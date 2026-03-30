const { Router } = require('express');
const ctrl = require('./content.controller');

const router = Router();

router.get('/planning/:planningId', ctrl.getContentsByPlanning);
router.get('/:id', ctrl.getContentById);
router.put('/:id', ctrl.updateContent);
router.patch('/:id/status', ctrl.updateContentStatus);

module.exports = router;
