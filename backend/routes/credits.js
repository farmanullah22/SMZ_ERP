const express = require('express');
const router = express.Router();
const controller = require('../controllers/creditController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.updateCredit);
router.delete('/:id', controller.deleteCredit);
router.post('/:id/payments', controller.addPayment);
router.get('/stats', controller.getStats);

module.exports = router;
