const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/sales', reportController.getSalesReport);
router.get('/profit-loss', reportController.getProfitLossReport);
router.get('/inventory', reportController.getInventoryReport);
router.get('/customers', reportController.getCustomerReport);
router.get('/suppliers', reportController.getSupplierReport);
router.get('/purchases', reportController.getPurchaseReport);
router.get('/accounts', reportController.getAccountsReport);
router.get('/history', reportController.getHistory);

module.exports = router;
