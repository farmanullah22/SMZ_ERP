const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteController');

router.post('/upload', websiteController.upload.single('file'), websiteController.uploadFile);
router.post('/upload-multiple', websiteController.upload.array('files', 10), websiteController.uploadFiles);
router.post('/upload-hero', websiteController.uploadHero.single('hero'), websiteController.uploadHeroBg);
router.get('/files', websiteController.getFiles);
router.delete('/files/:filename', websiteController.deleteFile);

module.exports = router;