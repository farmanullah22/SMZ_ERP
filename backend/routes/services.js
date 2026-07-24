const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceController');

router.get('/', controller.getAllServices);
router.get('/:id', controller.getService);
router.post('/', controller.createService);
router.put('/:id', controller.updateService);
router.delete('/:id', controller.deleteService);

module.exports = router;
