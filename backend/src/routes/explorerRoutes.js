'use strict';

const express = require('express');
const router = express.Router();
const explorerController = require('../controllers/explorerController');

// Explorer overview & health (Publicly viewable or authenticated)
router.get('/overview', explorerController.getLedgerOverview);
router.get('/transactions', explorerController.getAllTransactions);
router.get('/health', explorerController.getNetworkHealth);

module.exports = router;

