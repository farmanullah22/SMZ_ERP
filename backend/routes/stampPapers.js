const express = require('express');
const router = express.Router();
const stampPaperController = require('../controllers/stampPaperController');

router.get('/', stampPaperController.getStampPapers);
router.post('/', stampPaperController.createStampPaper);
router.put('/:id', stampPaperController.updateStampPaper);
router.delete('/:id', stampPaperController.deleteStampPaper);
router.post('/upload-doc', stampPaperController.uploadDoc.single('document'), stampPaperController.uploadDocument);

module.exports = router;
