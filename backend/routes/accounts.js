const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

router.get('/', accountController.getAllAccounts);
router.get('/type/:type', accountController.getAccounts);
router.get('/transactions', accountController.getTransactions);
router.post('/bank', accountController.createBankAccount);
router.put('/bank/:id', accountController.updateBankAccount);
router.delete('/bank/:id', accountController.deleteBankAccount);
router.post('/deposit', accountController.deposit);
router.post('/withdraw', accountController.withdraw);
router.post('/transfer', accountController.transfer);

module.exports = router;
