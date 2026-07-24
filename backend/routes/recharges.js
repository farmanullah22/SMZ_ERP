const express = require('express');
const router = express.Router();
const controller = require('../controllers/rechargeController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.deleteRecharge);
router.get('/stats', controller.getStats);

module.exports = router;
