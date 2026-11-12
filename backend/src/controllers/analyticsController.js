'use strict';

const fabricGateway = require('../services/fabricGateway');

/**
 * Get Analytics & Reporting Data
 */
async function getAnalytics(req, res) {
    try {
        const rawBatches = await fabricGateway.evaluateTransaction('GetAllBatches');
        const batches = Array.isArray(rawBatches) ? rawBatches : [];

        // 1. Status Breakdown
        const statusMap = {
            MANUFACTURED: 0,
            IN_TRANSIT: 0,
            RECEIVED_BY_DISTRIBUTOR: 0,
            RECEIVED_BY_WHOLESALER: 0,
            RECEIVED_BY_PHARMACY: 0,
            AVAILABLE_FOR_SALE: 0,
            RECALLED: 0,
            EXPIRED: 0
        };

        const now = new Date();
        const expiringWithin90Days = [];

        batches.forEach(b => {
            if (b.isRecalled) {
                statusMap.RECALLED += 1;
            } else if (new Date(b.expiryDate) < now) {
                statusMap.EXPIRED += 1;
            } else if (statusMap[b.currentStatus] !== undefined) {
                statusMap[b.currentStatus] += 1;
            } else {
                statusMap.MANUFACTURED += 1;
            }

            // Expiry calculation
            const diffDays = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 90 && diffDays > 0) {
                expiringWithin90Days.push({
                    batchId: b.batchId,
                    medicineName: b.medicineName,
                    daysRemaining: diffDays,
                    expiryDate: b.expiryDate,
                    currentOwner: b.currentOwner
                });
            }
        });

        const statusDistribution = Object.keys(statusMap).map(key => ({
            status: key.replace(/_/g, ' '),
            rawStatus: key,
            count: statusMap[key]
        }));

        // 2. Batches by Organization / Owner
        const ownerMap = {};
        batches.forEach(b => {
            const owner = b.currentOwner || 'Unknown';
            ownerMap[owner] = (ownerMap[owner] || 0) + 1;
        });

        const ownerDistribution = Object.keys(ownerMap).map(key => ({
            organization: key,
            batches: ownerMap[key]
        }));

        // 3. Transactions by Stage
        const stageMap = {};
        batches.forEach(b => {
            if (Array.isArray(b.journey)) {
                b.journey.forEach(step => {
                    const st = step.stage || 'STAGE';
                    stageMap[st] = (stageMap[st] || 0) + 1;
                });
            }
        });

        const stageDistribution = Object.keys(stageMap).map(key => ({
            stage: key.replace(/_/g, ' '),
            count: stageMap[key]
        }));

        // 4. Role participation counts
        const roleMap = {
            MANUFACTURER: 0,
            DISTRIBUTOR: 0,
            WHOLESALER: 0,
            PHARMACY: 0
        };
        batches.forEach(b => {
            if (roleMap[b.currentOwnerRole] !== undefined) {
                roleMap[b.currentOwnerRole] += 1;
            }
        });

        return res.json({
            success: true,
            summary: {
                totalBatches: batches.length,
                activeBatches: batches.filter(b => !b.isRecalled).length,
                recalledBatches: batches.filter(b => b.isRecalled).length,
                expiringSoonCount: expiringWithin90Days.length
            },
            statusDistribution: statusDistribution,
            ownerDistribution: ownerDistribution,
            stageDistribution: stageDistribution,
            roleDistribution: Object.keys(roleMap).map(r => ({ role: r, count: roleMap[r] })),
            expiringSoon: expiringWithin90Days
        });
    } catch (err) {
        console.error('Analytics error:', err);
        return res.status(500).json({
            success: false,
            message: `Failed to compute analytics: ${err.message}`
        });
    }
}

module.exports = {
    getAnalytics
};

