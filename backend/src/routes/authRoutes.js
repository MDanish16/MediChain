'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);
router.get('/users', authenticateToken, requireRole(['SUPER_ADMIN']), authController.listUsers);

module.exports = router;

