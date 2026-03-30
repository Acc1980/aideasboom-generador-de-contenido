const { Router } = require('express');
const ctrl = require('./strategy.controller');

const router = Router();

// CRUD de estrategias vinculadas a un cliente
router.post('/client/:clientId', ctrl.createStrategy);
router.get('/client/:clientId', ctrl.getStrategiesByClient);

// Compilar JSON estratégico unificado
router.get('/client/:clientId/compile', ctrl.compileStrategy);

// Actualizar estrategia individual
router.put('/:id', ctrl.updateStrategy);

module.exports = router;
