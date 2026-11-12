'use strict';

const fabricGateway = require('../services/fabricGateway');
const { run } = require('../config/database');

/**
 * Step 1: Initiate Transfer to next participant
 */
async function initiateTransfer(req, res) {
    try {
        const { batchId } = req.params;
        const { targetReceiver, targetRole, notes } = req.body;

        if (!targetReceiver || !targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target receiver organization name and role are required.'
            });
        }

        // Verify current batch ownership on blockchain
        const currentBatch = await fabricGateway.evaluateTransaction('ReadMedicineBatch', batchId);
        if (!currentBatch) {
            return res.status(404).json({
                success: false,
                message: `Medicine batch "${batchId}" not found on ledger.`
            });
        }

        // Check caller ownership
        if (req.user.role !== 'SUPER_ADMIN') {
            if (currentBatch.currentOwnerRole !== req.user.role && currentBatch.currentOwner !== req.user.organization) {
                return res.status(403).json({
                    success: false,
                    message: `Unauthorized Transfer: Only the current owner (${currentBatch.currentOwner} [${currentBatch.currentOwnerRole}]) can initiate a transfer. You are logged in as ${req.user.organization} [${req.user.role}].`
                });
            }
        }

        // Submit TransferBatch transaction to Hyperledger Fabric
        const commitResult = await fabricGateway.submitTransaction(
            'TransferBatch',
            batchId,
            targetReceiver,
            targetRole,
            notes || `Transfer initiated by ${req.user.organization}`
        );

        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'TRANSFER_INITIATED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Initiated transfer of ${batchId} to ${targetReceiver} (${targetRole})`
            ]
        );

        return res.json({
            success: true,
            message: `Transfer for batch "${batchId}" successfully initiated on Hyperledger Fabric.`,
            txId: commitResult.txId,
            batch: commitResult.data
        });
    } catch (err) {
        console.error('Initiate transfer error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to initiate batch transfer.'
        });
    }
}

/**
 * Step 2: Accept incoming transfer
 */
async function receiveBatch(req, res) {
    try {
        const { batchId } = req.params;
        const { notes } = req.body;

        // Verify batch state on ledger
        const currentBatch = await fabricGateway.evaluateTransaction('ReadMedicineBatch', batchId);
        if (!currentBatch) {
            return res.status(404).json({
                success: false,
                message: `Batch "${batchId}" not found.`
            });
        }

        if (currentBatch.currentStatus !== 'IN_TRANSIT') {
            return res.status(400).json({
                success: false,
                message: `Batch "${batchId}" is not currently in transit. Current status: ${currentBatch.currentStatus}`
            });
        }

        // Verify recipient role matches
        if (req.user.role !== 'SUPER_ADMIN') {
            if (currentBatch.pendingReceiverRole !== req.user.role) {
                return res.status(403).json({
                    success: false,
                    message: `Unauthorized Acceptance: This batch is designated for ${currentBatch.pendingReceiver} (${currentBatch.pendingReceiverRole}). You are logged in as ${req.user.organization} (${req.user.role}).`
                });
            }
        }

        const receiverNotes = notes || `Batch received and inspected by ${req.user.organization} (${req.user.role}). Handover confirmed.`;

        const commitResult = await fabricGateway.submitTransaction('ReceiveBatch', batchId, receiverNotes);

        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'TRANSFER_ACCEPTED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Accepted transfer of batch ${batchId}. New owner: ${req.user.organization}`
            ]
        );

        return res.json({
            success: true,
            message: `Batch "${batchId}" transfer accepted and ownership committed on Hyperledger Fabric.`,
            txId: commitResult.txId,
            batch: commitResult.data
        });
    } catch (err) {
        console.error('Receive batch error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to accept batch transfer.'
        });
    }
}

/**
 * Reject incoming transfer
 */
async function rejectTransfer(req, res) {
    try {
        const { batchId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'A rejection reason is required.'
            });
        }

        const commitResult = await fabricGateway.submitTransaction('RejectTransfer', batchId, reason.trim());

        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'TRANSFER_REJECTED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Rejected transfer of ${batchId}. Reason: ${reason}`
            ]
        );

        return res.json({
            success: true,
            message: `Transfer for batch "${batchId}" rejected and reverted on Hyperledger Fabric.`,
            txId: commitResult.txId,
            batch: commitResult.data
        });
    } catch (err) {
        console.error('Reject transfer error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to reject transfer.'
        });
    }
}

/**
 * Get pending incoming transfers for current user / role
 */
async function getPendingTransfers(req, res) {
    try {
        const rawBatches = await fabricGateway.evaluateTransaction('GetAllBatches');
        const batches = Array.isArray(rawBatches) ? rawBatches : [];

        let pending;
        if (req.user.role === 'SUPER_ADMIN') {
            pending = batches.filter(b => b.currentStatus === 'IN_TRANSIT');
        } else {
            pending = batches.filter(b =>
                b.currentStatus === 'IN_TRANSIT' &&
                (b.pendingReceiverRole === req.user.role || b.pendingReceiver === req.user.organization)
            );
        }

        return res.json({
            success: true,
            count: pending.length,
            transfers: pending
        });
    } catch (err) {
        console.error('Get pending transfers error:', err);
        return res.status(500).json({
            success: false,
            message: `Failed to retrieve pending transfers: ${err.message}`
        });
    }
}

module.exports = {
    initiateTransfer,
    receiveBatch,
    rejectTransfer,
    getPendingTransfers
};

