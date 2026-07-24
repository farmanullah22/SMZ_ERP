const express = require('express');
const router = express.Router();
const wc = require('../controllers/websiteContentController');

router.get('/', wc.getContent);
router.get('/manage', wc.getManageContent);
router.put('/section/:section', wc.updateSection);
router.post('/upload-image', wc.upload.single('image'), wc.uploadImage);
router.get('/search-stamp', wc.searchStampPaper);
router.post('/reset', wc.resetContent);

module.exports = router;
