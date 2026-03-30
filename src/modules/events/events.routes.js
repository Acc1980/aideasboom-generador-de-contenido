const { Router } = require('express');
const ctrl = require('./events.controller');

const router = Router();

router.post('/', ctrl.createEvent);
router.get('/client/:clientId', ctrl.getEventsByClient);
router.get('/client/:clientId/with-stage', ctrl.getActiveEventsWithStage);
router.get('/:id', ctrl.getEventById);
router.put('/:id', ctrl.updateEvent);
router.delete('/:id', ctrl.deleteEvent);

module.exports = router;
