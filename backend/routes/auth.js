const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/change-password', authController.changePassword);
router.get('/users', authController.getUsers);
router.post('/users', authController.createUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;
