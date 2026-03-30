/**
 * Configuración de conexión Redis para BullMQ.
 * Exporta las opciones de conexión reutilizables.
 */

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Requerido por BullMQ
};

module.exports = { redisConnection };
