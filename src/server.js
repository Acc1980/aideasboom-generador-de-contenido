/**
 * AIdeasBoom - Entry Point
 *
 * Inicializa Express, middlewares globales y monta las rutas de cada módulo.
 * La conexión a PostgreSQL se establece mediante Sequelize; si falla,
 * el servidor arranca igual para permitir desarrollo sin DB.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./config/logger');
const { sequelize, testConnection } = require('./config/database');

// Routers de cada módulo
const clientRoutes = require('./modules/clients/client.routes');
const strategyRoutes = require('./modules/strategy/strategy.routes');
const planningRoutes = require('./modules/planning/planning.routes');
const contentRoutes = require('./modules/content/content.routes');
const syncRoutes = require('./modules/sync/sync.routes');
const storiesRoutes = require('./modules/stories/stories.routes');
const eventRoutes = require('./modules/events/events.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Panel web ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas API ────────────────────────────────────────────────────────
app.use('/api/clients', clientRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/events', eventRoutes);

// Health-check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo global de errores ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ── Arranque ────────────────────────────────────────────────────────
async function runMigrations() {
  try {
    await sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'reels_5'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_plannings_package_type')
        ) THEN
          ALTER TYPE enum_plannings_package_type ADD VALUE 'reels_5';
        END IF;
      END $$;
    `);
    logger.info('Migrations OK');
  } catch (err) {
    logger.warn(`Migration warning: ${err.message}`);
  }
}

async function start() {
  await testConnection();
  await runMigrations();

  app.listen(PORT, () => {
    logger.info(`AIdeasBoom corriendo en puerto ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

start();

module.exports = app;
