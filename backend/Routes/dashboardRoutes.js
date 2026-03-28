const express = require('express');
const router = express.Router();
const { getStats } = require('../Controllers/dashboardController');
const authMiddleware = require('../Middleware/authMiddleware');

router.get('/stats', authMiddleware, getStats);

module.exports = router;
