const express = require('express');
const router = express.Router();
const controller = require('../controllers/mobileTransactionController');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.deleteTransaction);
router.get('/stats', controller.getStats);

module.exports = router;
