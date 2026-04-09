const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.get('/', purchaseController.getAllPurchases);
router.get('/stats', purchaseController.getPurchaseStats);
router.get('/:id', purchaseController.getPurchase);
router.post('/', purchaseController.createPurchase);
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;
