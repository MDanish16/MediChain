'use strict';

const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Get all batches (Authenticated)
router.get('/', authenticateToken, batchController.getAllBatches);

// Register batch (Manufacturer or Super Admin only)
router.post('/register', authenticateToken, requireRole(['MANUFACTURER', 'SUPER_ADMIN']), batchController.registerBatch);

// Get single batch details
router.get('/:batchId', authenticateToken, batchController.getBatchById);

// Get ledger history for batch
router.get('/:batchId/history', authenticateToken, batchController.getBatchHistory);

// Recall batch (Manufacturer or Super Admin)
router.post('/:batchId/recall', authenticateToken, requireRole(['MANUFACTURER', 'SUPER_ADMIN']), batchController.recallBatch);

// Update status (e.g. Pharmacy marks AVAILABLE_FOR_SALE)
router.patch('/:batchId/status', authenticateToken, batchController.updateBatchStatus);

module.exports = router;

