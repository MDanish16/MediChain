'use strict';

const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get pending transfers for current logged-in role / organization
router.get('/pending', authenticateToken, transferController.getPendingTransfers);

// Step 1: Initiate Transfer
router.post('/:batchId/initiate', authenticateToken, transferController.initiateTransfer);

// Step 2: Accept incoming transfer
router.post('/:batchId/receive', authenticateToken, transferController.receiveBatch);

// Reject incoming transfer
router.post('/:batchId/reject', authenticateToken, transferController.rejectTransfer);

module.exports = router;

