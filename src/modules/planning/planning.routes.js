const { Router } = require('express');
const ctrl = require('./planning.controller');
const { exportToSheet, importFromSheet } = require('../../services/approvalSheet.service');
const logger = require('../../config/logger');

const router = Router();

// Middleware para extender el timeout en rutas que llaman a OpenAI (hasta 3 min)
function longTimeout(req, res, next) {
  req.setTimeout(180000);
  res.setTimeout(180000);
  next();
}

router.post('/generate', ctrl.generatePlanning);
router.post('/:id/generate-format', longTimeout, ctrl.generateFormat);
router.post('/:id/generate-images', longTimeout, ctrl.generateImages);
router.post('/:id/produce-all', ctrl.produceAll);
router.get('/client/:clientId', ctrl.getPlanningsByClient);
router.get('/:id', ctrl.getPlanningById);
router.patch('/:id/status', ctrl.updatePlanningStatus);

// Exportar planeación a Google Sheet de aprobación
router.post('/:id/export-approval', async (req, res) => {
  try {
    const result = await exportToSheet(req.params.id);
    res.json({ ok: true, sheetUrl: result.sheetUrl });
  } catch (err) {
    logger.error('Error exportando aprobación: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Importar aprobaciones del cliente desde el Sheet
router.post('/:id/import-approvals', async (req, res) => {
  try {
    const result = await importFromSheet(req.params.id);
    res.json({ ok: true, updated: result.updated });
  } catch (err) {
    logger.error('Error importando aprobaciones: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
