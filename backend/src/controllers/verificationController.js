'use strict';

const QRCode = require('qrcode');
const fabricGateway = require('../services/fabricGateway');

/**
 * Public Verification Endpoint (No Authentication Required)
 */
async function verifyBatch(req, res) {
    try {
        const { batchId } = req.params;

        if (!batchId || batchId.trim() === '') {
            return res.status(400).json({
                success: false,
                exists: false,
                verificationStatus: 'INVALID',
                message: 'Medicine Batch ID must be provided.'
            });
        }

        const trimmedId = batchId.trim().toUpperCase();

        let verificationResult;
        try {
            verificationResult = await fabricGateway.evaluateTransaction('VerifyMedicine', trimmedId);
        } catch (err) {
            return res.status(200).json({
                success: true,
                exists: false,
                batchId: trimmedId,
                verificationStatus: 'INVALID',
                safetyStatus: 'UNVERIFIED',
                message: `Medicine batch "${trimmedId}" was NOT found on the Hyperledger Fabric blockchain. This batch may be counterfeit, unapproved, or mislabelled.`,
                disclaimer: 'Blockchain verification confirms the recorded immutable ledger history of an authorized batch. Always inspect physical packaging, security seals, and consult licensed healthcare providers.'
            });
        }

        if (!verificationResult || !verificationResult.exists) {
            return res.status(200).json({
                success: true,
                exists: false,
                batchId: trimmedId,
                verificationStatus: 'INVALID',
                safetyStatus: 'UNVERIFIED',
                message: `Medicine batch "${trimmedId}" was NOT found on the Hyperledger Fabric blockchain.`,
                disclaimer: 'Blockchain verification confirms the recorded immutable ledger history of an authorized batch.'
            });
        }

        // Generate QR code data URL for verification sharing
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${trimmedId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: { dark: '#0F172A', light: '#FFFFFF' }
        });

        return res.json({
            success: true,
            exists: true,
            verification: verificationResult,
            qrCode: qrCodeDataUrl,
            verifyUrl: verifyUrl,
            disclaimer: 'MediChain verified: cryptographic proof of recorded pharmaceutical supply chain journey on Hyperledger Fabric. Ledger records tamper-evident custody from manufacturer to pharmacy.'
        });
    } catch (err) {
        console.error('Verification error:', err);
        return res.status(500).json({
            success: false,
            message: `Public verification service error: ${err.message}`
        });
    }
}

module.exports = {
    verifyBatch
};

