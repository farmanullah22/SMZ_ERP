const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.post('/categories', productController.createCategory);
router.delete('/categories/:id', productController.deleteCategory);
router.get('/suppliers', productController.getSuppliers);
router.post('/suppliers', productController.createSupplier);
router.put('/suppliers/:id', productController.updateSupplier);
router.delete('/suppliers/:id', productController.deleteSupplier);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
