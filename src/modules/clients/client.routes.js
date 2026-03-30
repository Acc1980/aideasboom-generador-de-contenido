const { Router } = require('express');
const ctrl = require('./client.controller');

const router = Router();

router.post('/', ctrl.createClient);
router.get('/', ctrl.getAllClients);
router.get('/:id', ctrl.getClientById);
router.put('/:id', ctrl.updateClient);
router.delete('/:id', ctrl.deleteClient);
router.post('/:id/logo', ctrl.uploadLogo);

module.exports = router;
