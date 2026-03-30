const express = require('express');
const router = express.Router();
const { syncAll } = require('../../services/sheetsSync.service');
const logger = require('../../config/logger');

// POST /api/sync — dispara la sincronización completa
router.post('/', async (req, res) => {
  try {
    const result = await syncAll();
    res.json({ ok: true, result });
  } catch (err) {
    logger.error('Error en sincronización: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
