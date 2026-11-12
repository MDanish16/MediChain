'use strict';

const QRCode = require('qrcode');
const fabricGateway = require('../services/fabricGateway');
const { run } = require('../config/database');

/**
 * Register a new medicine batch (Manufacturer only)
 */
async function registerBatch(req, res) {
    try {
        const {
            batchId: customBatchId,
            medicineName,
            genericName,
            manufacturer: reqManufacturer,
            manufacturingDate,
            expiryDate,
            quantity,
            unit,
            composition,
            storageConditions,
            notes
        } = req.body;

        // Auto-generate batchId if not supplied
        const batchId = customBatchId && customBatchId.trim() !== ''
            ? customBatchId.trim().toUpperCase()
            : `MED-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

        const manufacturer = req.user && req.user.organization
            ? req.user.organization
            : (reqManufacturer || 'PharmaCorp Labs');

        const mspId = req.user && req.user.mspId ? req.user.mspId : 'Org1MSP';

        const batchPayload = {
            batchId: batchId,
            medicineName: medicineName,
            genericName: genericName,
            manufacturer: manufacturer,
            manufacturerMSP: mspId,
            manufacturingDate: manufacturingDate,
            expiryDate: expiryDate,
            quantity: Number(quantity),
            unit: unit || 'Boxes (10 strips)',
            composition: composition,
            storageConditions: storageConditions,
            notes: notes || `Batch registered by ${manufacturer} on MediChain network.`
        };

        // Submit to Hyperledger Fabric Blockchain
        const commitResult = await fabricGateway.submitTransaction(
            'RegisterMedicineBatch',
            JSON.stringify(batchPayload)
        );

        // Generate QR code for this batch
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${batchId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: {
                dark: '#0F172A',
                light: '#FFFFFF'
            }
        });

        // Record in local audit table
        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'BATCH_REGISTERED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Registered batch ${batchId} for ${medicineName}`
            ]
        );

        return res.status(201).json({
            success: true,
            message: `Medicine batch "${batchId}" successfully committed to Hyperledger Fabric.`,
            txId: commitResult.txId,
            batch: commitResult.data,
            qrCode: qrCodeDataUrl,
            verifyUrl: verifyUrl
        });
    } catch (err) {
        console.error('Batch registration error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to register batch on Hyperledger Fabric.'
        });
    }
}

/**
 * Get all batches from Hyperledger Fabric ledger
 */
async function getAllBatches(req, res) {
    try {
        const rawBatches = await fabricGateway.evaluateTransaction('GetAllBatches');
        let batches = Array.isArray(rawBatches) ? rawBatches : [];

        const { status, medicine, owner, isRecalled } = req.query;

        if (status) {
            batches = batches.filter(b => b.currentStatus === status);
        }
        if (medicine) {
            const medLower = medicine.toLowerCase();
            batches = batches.filter(b =>
                (b.medicineName && b.medicineName.toLowerCase().includes(medLower)) ||
                (b.genericName && b.genericName.toLowerCase().includes(medLower))
            );
        }
        if (owner) {
            batches = batches.filter(b => b.currentOwner && b.currentOwner.toLowerCase().includes(owner.toLowerCase()));
        }
        if (isRecalled !== undefined) {
            const recalledBool = isRecalled === 'true';
            batches = batches.filter(b => b.isRecalled === recalledBool);
        }

        return res.json({
            success: true,
            count: batches.length,
            batches: batches
        });
    } catch (err) {
        console.error('Get all batches error:', err);
        return res.status(500).json({
            success: false,
            message: `Blockchain query failed: ${err.message}`
        });
    }
}

/**
 * Get single batch by ID
 */
async function getBatchById(req, res) {
    try {
        const { batchId } = req.params;
        const batch = await fabricGateway.evaluateTransaction('ReadMedicineBatch', batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: `Medicine batch "${batchId}" not found on ledger.`
            });
        }

        const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${batchId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: { dark: '#0F172A', light: '#FFFFFF' }
        });

        return res.json({
            success: true,
            batch: batch,
            qrCode: qrCodeDataUrl,
            verifyUrl: verifyUrl
        });
    } catch (err) {
        console.error(`Get batch ${req.params.batchId} error:`, err);
        return res.status(404).json({
            success: false,
            message: err.message || 'Batch not found.'
        });
    }
}

/**
 * Get blockchain ledger history for a specific batch
 */
async function getBatchHistory(req, res) {
    try {
        const { batchId } = req.params;
        const history = await fabricGateway.evaluateTransaction('GetBatchHistory', batchId);

        return res.json({
            success: true,
            batchId: batchId,
            count: Array.isArray(history) ? history.length : 0,
            history: history
        });
    } catch (err) {
        console.error(`Get batch history error for ${req.params.batchId}:`, err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to retrieve batch ledger history.'
        });
    }
}

/**
 * Recall a medicine batch
 */
async function recallBatch(req, res) {
    try {
        const { batchId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'A clear reason for recall is required.'
            });
        }

        const commitResult = await fabricGateway.submitTransaction('RecallBatch', batchId, reason.trim());

        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'BATCH_RECALLED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Recalled batch ${batchId}. Reason: ${reason}`
            ]
        );

        return res.json({
            success: true,
            message: `Batch "${batchId}" successfully marked RECALLED on Hyperledger Fabric ledger.`,
            txId: commitResult.txId,
            batch: commitResult.data
        });
    } catch (err) {
        console.error('Recall error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to recall batch.'
        });
    }
}

/**
 * Update batch status (e.g. Pharmacy marks AVAILABLE_FOR_SALE)
 */
async function updateBatchStatus(req, res) {
    try {
        const { batchId } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'New status is required.'
            });
        }

        const commitResult = await fabricGateway.submitTransaction(
            'UpdateBatchStatus',
            batchId,
            status,
            notes || `Status updated to ${status} by ${req.user.organization}`
        );

        await run(
            'INSERT INTO audit_logs (action, performed_by, role, batch_id, tx_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'STATUS_UPDATED',
                req.user.username,
                req.user.role,
                batchId,
                commitResult.txId,
                `Updated status of ${batchId} to ${status}`
            ]
        );

        return res.json({
            success: true,
            message: `Batch "${batchId}" status updated to ${status}.`,
            txId: commitResult.txId,
            batch: commitResult.data
        });
    } catch (err) {
        console.error('Update batch status error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Failed to update batch status.'
        });
    }
}

module.exports = {
    registerBatch,
    getAllBatches,
    getBatchById,
    getBatchHistory,
    recallBatch,
    updateBatchStatus
};

