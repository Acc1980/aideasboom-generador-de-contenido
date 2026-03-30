/**
 * Configuración de Sequelize para PostgreSQL.
 *
 * Exporta la instancia singleton y un helper testConnection()
 * que intenta autenticar pero no impide el arranque si falla
 * (útil durante desarrollo local sin DB).
 */

const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'aideasboom',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL conectado correctamente');
  } catch (error) {
    logger.warn(`No se pudo conectar a PostgreSQL: ${error.message}. Continuando sin DB.`);
  }
}

module.exports = { sequelize, testConnection };
