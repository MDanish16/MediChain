'use strict';

const fabricGateway = require('../services/fabricGateway');
const { query } = require('../config/database');

/**
 * Get Blockchain Overview & Network Health
 */
async function getLedgerOverview(req, res) {
    try {
        const netStatus = await fabricGateway.checkNetworkStatus();
        const rawBatches = await fabricGateway.evaluateTransaction('GetAllBatches');
        const batches = Array.isArray(rawBatches) ? rawBatches : [];

        // Aggregate total blockchain transactions across all batch journeys
        let totalCommittedTx = 0;
        const allTransactions = [];

        batches.forEach(b => {
            if (Array.isArray(b.journey)) {
                b.journey.forEach(step => {
                    totalCommittedTx += 1;
                    allTransactions.push({
                        txId: step.txId,
                        batchId: b.batchId,
                        medicineName: b.medicineName,
                        stage: step.stage,
                        actor: step.actor,
                        role: step.role,
                        msp: step.msp,
                        timestamp: step.timestamp,
                        status: 'COMMITTED',
                        notes: step.notes
                    });
                });
            }
        });

        // Sort latest transactions first
        allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const activeBatches = batches.filter(b => !b.isRecalled);
        const recalledBatches = batches.filter(b => b.isRecalled);
        const inTransitBatches = batches.filter(b => b.currentStatus === 'IN_TRANSIT');
        const atPharmacy = batches.filter(b => b.currentStatus === 'RECEIVED_BY_PHARMACY' || b.currentStatus === 'AVAILABLE_FOR_SALE');

        // Recent audit logs from database
        const auditLogs = await query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 15');

        return res.json({
            success: true,
            network: {
                status: netStatus.status,
                channel: netStatus.channel,
                chaincode: netStatus.chaincode,
                peerEndpoint: netStatus.peerEndpoint,
                peerHost: netStatus.peerHost,
                mspId: netStatus.mspId,
                latencyMs: netStatus.latencyMs,
                lastChecked: netStatus.lastChecked,
                consensus: 'Raft (BFT Ready)',
                orderer: 'orderer.example.com:7050',
                endorsingPeers: [
                    { name: 'peer0.org1.example.com', endpoint: 'localhost:7051', msp: 'Org1MSP', status: 'ACTIVE' },
                    { name: 'peer0.org2.example.com', endpoint: 'localhost:9051', msp: 'Org2MSP', status: 'ACTIVE' }
                ]
            },
            metrics: {
                totalBatches: batches.length,
                totalTransactions: totalCommittedTx,
                activeBatches: activeBatches.length,
                recalledBatches: recalledBatches.length,
                inTransitBatches: inTransitBatches.length,
                atPharmacyBatches: atPharmacy.length
            },
            recentTransactions: allTransactions.slice(0, 25),
            recentAuditLogs: auditLogs
        });
    } catch (err) {
        console.error('Ledger overview error:', err);
        return res.status(500).json({
            success: false,
            message: `Explorer overview error: ${err.message}`
        });
    }
}

/**
 * Get all committed transactions from blockchain
 */
async function getAllTransactions(req, res) {
    try {
        const rawBatches = await fabricGateway.evaluateTransaction('GetAllBatches');
        const batches = Array.isArray(rawBatches) ? rawBatches : [];

        const transactions = [];
        batches.forEach(b => {
            if (Array.isArray(b.journey)) {
                b.journey.forEach(step => {
                    transactions.push({
                        txId: step.txId,
                        batchId: b.batchId,
                        medicineName: b.medicineName,
                        stage: step.stage,
                        actor: step.actor,
                        role: step.role,
                        msp: step.msp,
                        timestamp: step.timestamp,
                        status: 'COMMITTED',
                        notes: step.notes
                    });
                });
            }
        });

        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return res.json({
            success: true,
            count: transactions.length,
            transactions: transactions
        });
    } catch (err) {
        console.error('All transactions error:', err);
        return res.status(500).json({
            success: false,
            message: `Failed to retrieve transactions: ${err.message}`
        });
    }
}

/**
 * Network Health check
 */
async function getNetworkHealth(req, res) {
    const health = await fabricGateway.checkNetworkStatus();
    return res.json({
        success: health.status === 'ONLINE',
        health: health
    });
}

module.exports = {
    getLedgerOverview,
    getAllTransactions,
    getNetworkHealth
};

