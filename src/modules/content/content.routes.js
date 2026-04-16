const { Router } = require('express');
const ctrl = require('./content.controller');

const router = Router();

router.get('/planning/:planningId', ctrl.getContentsByPlanning);
router.get('/pending-video', ctrl.getPendingVideo);
router.get('/:id', ctrl.getContentById);
router.put('/:id', ctrl.updateContent);
router.patch('/:id', ctrl.updateContent);
router.patch('/:id/status', ctrl.updateContentStatus);
router.patch('/:id/approve', ctrl.approveContent);
router.patch('/:id/approve-video', ctrl.approveVideo);
router.patch('/:id/video-url', ctrl.updateVideoUrl);
router.post('/:id/generate-video', ctrl.generateVideo);
router.post('/:id/regenerate', ctrl.regenerateContent);

module.exports = router;
