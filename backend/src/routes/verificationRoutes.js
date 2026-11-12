'use strict';

const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Public verification endpoint - NO LOGIN REQUIRED
router.get('/:batchId', verificationController.verifyBatch);

module.exports = router;

