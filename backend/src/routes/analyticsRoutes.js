'use strict';

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/dashboard', authenticateToken, analyticsController.getAnalytics);

module.exports = router;

