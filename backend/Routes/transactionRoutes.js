const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middleware/authMiddleware');
const { getAllTransactions, issueBook, returnBook } = require('../Controllers/transactionController');

router.use(authMiddleware);

router.get('/', getAllTransactions);
router.post('/issue', issueBook);
router.post('/return', returnBook);

module.exports = router;
