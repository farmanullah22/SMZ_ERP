const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.get('/stats', salesController.getSalesStats);
router.get('/monthly', salesController.getMonthlySalesData);
router.get('/:id', salesController.getSale);
router.post('/', salesController.createSale);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
