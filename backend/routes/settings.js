const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSetting);
router.get('/backup', settingsController.backupDatabase);

module.exports = router;
