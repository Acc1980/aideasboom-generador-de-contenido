/**
 * Script de migración – Sincroniza los modelos Sequelize con PostgreSQL.
 *
 * Uso: npm run db:migrate
 *
 * En desarrollo usa { alter: true } para actualizar tablas sin perder datos.
 * En producción se recomienda usar migraciones explícitas con sequelize-cli.
 */

require('dotenv').config();

const { sequelize } = require('./database');
const logger = require('./logger');

// Importar todos los modelos para que Sequelize los registre
require('../modules/clients/client.model');
require('../modules/strategy/strategy.model');
require('../modules/planning/planning.model');
require('../modules/content/content.model');
require('../modules/stories/story.model');
require('../modules/events/event.model');

async function migrate() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    await sequelize.sync({
      alter: !isProduction,
      force: false,
    });

    logger.info('Modelos sincronizados con la base de datos');
    process.exit(0);
  } catch (error) {
    logger.error(`Error en migración: ${error.message}`);
    process.exit(1);
  }
}

migrate();
