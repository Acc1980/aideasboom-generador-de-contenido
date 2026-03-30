const { Router } = require('express');
const ctrl = require('./stories.controller');
const { exportStoriesToSheet, importStoriesFromSheet } = require('../../services/approvalSheet.service');
const logger = require('../../config/logger');

const router = Router();

// Middleware para extender timeout (OpenAI puede tardar)
function longTimeout(req, res, next) {
  req.setTimeout(180000);
  res.setTimeout(180000);
  next();
}

// Generar stories para una planeación
router.post('/generate/:planningId', longTimeout, ctrl.generate);

// Listar stories de una planeación (agrupadas por día)
router.get('/planning/:planningId', ctrl.getByPlanning);

// Stories de un día específico
router.get('/planning/:planningId/day/:dayOfWeek', ctrl.getByDay);

// Actualizar una story
router.put('/:id', ctrl.updateStory);

// Generar imágenes de stories (Puppeteer)
router.post('/:planningId/generate-images', longTimeout, ctrl.generateImages);

// Exportar stories al Google Sheet de aprobación
router.post('/:planningId/export-approval', async (req, res) => {
  try {
    const result = await exportStoriesToSheet(req.params.planningId);
    res.json({ ok: true, sheetUrl: result.sheetUrl });
  } catch (err) {
    logger.error('Error exportando stories al sheet: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Importar aprobaciones de stories desde el Sheet
router.post('/:planningId/import-approvals', async (req, res) => {
  try {
    const result = await importStoriesFromSheet(req.params.planningId);
    res.json({ ok: true, updated: result.updated });
  } catch (err) {
    logger.error('Error importando aprobaciones de stories: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
