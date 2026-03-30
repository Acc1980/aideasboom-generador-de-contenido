/**
 * Planning Generator Service
 *
 * Divide la generación en dos fases:
 *  1. createPlanning  – crea el registro Planning (sin contenido)
 *  2. generateFormat  – genera piezas para UN formato y las persiste
 *
 * El controller llama a createPlanning una vez y luego a generateFormat
 * tres veces (post → carrusel → reel), permitiendo mostrar progreso
 * en el panel y optimizar el uso de tokens por llamada a OpenAI.
 */

const strategyCompiler = require('./strategyCompiler.service');
const { calculatePackageDistribution, calculateWithCustomFunnel } = require('./packageCalculator.service');
const { buildSystemPrompt, buildFormatPrompt } = require('./promptBuilder.service');
const { getActiveEventContexts, getFunnelDistributionForStage, dominantStage, weekReferenceDate } = require('./eventContext.service');
const openaiService = require('./openai.service');
const Planning = require('../modules/planning/planning.model');
const Content = require('../modules/content/content.model');
const Client = require('../modules/clients/client.model');
const logger = require('../config/logger');

const FORMAT_KEY = { post: 'posts', carrusel: 'carruseles', reel: 'reels' };

/**
 * Crea el registro Planning con su distribución calculada.
 * No genera contenido — solo inicializa la planeación.
 */
async function createPlanning(client, year, month, week = 1) {
  const quarter = Math.ceil(month / 3);

  const compiledStrategy = await strategyCompiler.compile(client.id, { year, quarter, month });

  // Calcular distribución según eventos activos (si existen)
  const refDate = weekReferenceDate(year, month, week);
  const eventContexts = await getActiveEventContexts(client.id, refDate);
  const stage = dominantStage(eventContexts);

  let distribution;
  if (stage) {
    const funnelPcts = getFunnelDistributionForStage(stage);
    distribution = calculateWithCustomFunnel(client.packageType, funnelPcts);
    logger.info(`Distribución ajustada por evento (stage=${stage}): TOFU=${distribution.tofu} MOFU=${distribution.mofu} BOFU=${distribution.bofu}`);
  } else {
    distribution = calculatePackageDistribution(client.packageType, compiledStrategy.conversionActive);
  }

  const planning = await Planning.create({
    clientId: client.id,
    year,
    month,
    week,
    packageType: client.packageType,
    distribution,
    pieces: [],
    status: 'draft',
    generatedPrompt: null,
  });

  logger.info(`Planning creado: S${week} ${month}/${year} para ${client.name} (${distribution.total} piezas)`);
  return planning;
}

/**
 * Genera piezas para UN formato (post | carrusel | reel) y las persiste.
 * Puede llamarse tres veces consecutivas sobre el mismo planningId.
 *
 * @param {string} planningId - UUID del Planning existente
 * @param {string} format     - 'post' | 'carrusel' | 'reel'
 */
async function generateFormat(planningId, format, { replace = false } = {}) {
  if (!FORMAT_KEY[format]) throw new Error(`Formato inválido: ${format}`);

  const planning = await Planning.findByPk(planningId, {
    include: [{ model: Client, as: 'client' }],
  });
  if (!planning) throw new Error('Planeación no encontrada');

  const client = planning.client;
  const distribution = planning.distribution;
  const count = distribution[FORMAT_KEY[format]];

  if (!count || count === 0) {
    logger.info(`Sin piezas de tipo "${format}" en este paquete — saltando`);
    return { generated: 0, format };
  }

  // Si replace=true, eliminar las piezas existentes de ese formato
  if (replace) {
    const deleted = await Content.destroy({ where: { planningId, format } });
    logger.info(`Regenerando: ${deleted} ${format}(s) anteriores eliminados`);
  }

  // Offset para numerar las piezas en continuación
  const existingCount = await Content.count({ where: { planningId } });

  // Re-compilar estrategia (rápido, solo consultas a BD)
  const quarter = Math.ceil(planning.month / 3);
  const compiledStrategy = await strategyCompiler.compile(client.id, {
    year: planning.year,
    quarter,
    month: planning.month,
  });

  // Recalcular eventContexts con referencia exacta de la semana del planning
  const refDate = weekReferenceDate(planning.year, planning.month, planning.week);
  compiledStrategy.eventContexts = await getActiveEventContexts(client.id, refDate);

  const systemPrompt = buildSystemPrompt(client.brandIdentity || {});
  const userPrompt = buildFormatPrompt(
    format, count, existingCount, distribution, compiledStrategy, planning.week,
  );

  logger.info(`Generando ${count} ${format}(s) para planning ${planningId}...`);

  const aiResponse = await openaiService.generateJSON(systemPrompt, userPrompt, {
    temperature: 0.75,
    maxTokens: 4096,
  });

  const pieces = aiResponse.pieces;
  if (!Array.isArray(pieces) || pieces.length === 0) {
    throw new Error(`OpenAI no devolvió piezas para el formato "${format}"`);
  }

  const contentRecords = pieces.map((piece, i) => ({
    planningId,
    format: piece.format || format,
    funnelStage: piece.funnelStage,
    title: piece.title,
    hook: piece.hook || null,
    copy: piece.copy,
    cta: piece.cta,
    hashtags: piece.hashtags || [],
    script: piece.script || null,
    carouselSlides: piece.carouselSlides || null,
    visualDirection: piece.visualDirection || null,
    order: existingCount + i + 1,
    status: 'generated',
  }));

  await Content.bulkCreate(contentRecords);
  logger.info(`${contentRecords.length} ${format}(s) guardados para planning ${planningId}`);

  return { generated: contentRecords.length, format };
}

module.exports = { createPlanning, generateFormat };
