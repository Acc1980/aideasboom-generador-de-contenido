/**
 * BullMQ Job – Generación asíncrona de contenido.
 *
 * Este worker procesa trabajos de generación de planeación mensual
 * en background, desacoplando la petición HTTP de la generación con IA.
 *
 * Uso:
 *  - El controller o un cron agrega un job a la cola 'content-generation'.
 *  - Este worker lo procesa llamando a planningGenerator.
 *
 * Para activar: descomentar el arranque en server.js cuando Redis esté disponible.
 */

const { Queue, Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const Client = require('../modules/clients/client.model');
const planningGenerator = require('../services/planningGenerator.service');
const logger = require('../config/logger');

const QUEUE_NAME = 'content-generation';

// ── Cola ─────────────────────────────────────────────────────────────
const contentQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

/**
 * Agrega un trabajo de generación a la cola.
 *
 * @param {object} data - { clientId, year, month }
 * @param {object} opts - Opciones de BullMQ (delay, priority, etc.)
 */
async function addGenerationJob(data, opts = {}) {
  const job = await contentQueue.add('generate-planning', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    ...opts,
  });
  logger.info(`Job ${job.id} agregado a cola: ${data.clientId} – ${data.month}/${data.year}`);
  return job;
}

// ── Worker ───────────────────────────────────────────────────────────
function startWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { clientId, year, month } = job.data;
      logger.info(`Procesando job ${job.id}: generando planeación ${month}/${year} para ${clientId}`);

      const client = await Client.findByPk(clientId);
      if (!client) throw new Error(`Cliente ${clientId} no encontrado`);
      if (!client.active) throw new Error(`Cliente ${clientId} está inactivo`);

      const planning = await planningGenerator.generate(client, year, month);

      logger.info(`Job ${job.id} completado: planning ${planning.id} con ${planning.contents?.length || 0} piezas`);
      return { planningId: planning.id };
    },
    {
      connection: redisConnection,
      concurrency: 2, // Máximo 2 generaciones simultáneas (controlar costo API)
    },
  );

  worker.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completado → planning: ${result.planningId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} falló: ${err.message}`, { stack: err.stack });
  });

  logger.info(`Worker "${QUEUE_NAME}" iniciado (concurrency: 2)`);
  return worker;
}

module.exports = { contentQueue, addGenerationJob, startWorker };
