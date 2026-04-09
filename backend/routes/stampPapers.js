const express = require('express');
const router = express.Router();
const stampPaperController = require('../controllers/stampPaperController');

router.get('/', stampPaperController.getStampPapers);
router.post('/', stampPaperController.createStampPaper);
router.put('/:id', stampPaperController.updateStampPaper);
router.delete('/:id', stampPaperController.deleteStampPaper);

module.exports = router;
