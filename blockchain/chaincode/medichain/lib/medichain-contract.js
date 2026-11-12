'use strict';

const { Contract } = require('fabric-contract-api');

class MediChainContract extends Contract {

    constructor() {
        super('MediChainContract');
    }

    /**
     * Helper to safely parse fabric timestamp into ISO string
     */
    _parseTimestamp(timestamp) {
        if (!timestamp) return new Date().toISOString();
        let seconds = 0;
        let nanos = 0;

        if (typeof timestamp.seconds === 'object' && timestamp.seconds !== null) {
            seconds = timestamp.seconds.low !== undefined ? timestamp.seconds.low : Number(timestamp.seconds);
        } else if (typeof timestamp.seconds === 'number' || typeof timestamp.seconds === 'string') {
            seconds = Number(timestamp.seconds);
        }

        if (typeof timestamp.nanos === 'object' && timestamp.nanos !== null) {
            nanos = timestamp.nanos.low !== undefined ? timestamp.nanos.low : Number(timestamp.nanos);
        } else if (typeof timestamp.nanos === 'number' || typeof timestamp.nanos === 'string') {
            nanos = Number(timestamp.nanos);
        }

        const milliseconds = (seconds * 1000) + Math.round((nanos || 0) / 1000000);
        const date = new Date(milliseconds);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    /**
     * Helper to get transaction timestamp as ISO string
     */
    _getTxTimestamp(ctx) {
        const timestamp = ctx.stub.getTxTimestamp();
        return this._parseTimestamp(timestamp);
    }

    /**
     * Helper to get client identity details
     */
    _getClientIdentity(ctx) {
        const clientIdentity = ctx.clientIdentity;
        const mspId = clientIdentity.getMSPID();
        const id = clientIdentity.getID();
        
        let role = null;
        try {
            role = clientIdentity.getAttributeValue('role');
        } catch (e) {
            role = null;
        }

        return {
            mspId: mspId || 'Org1MSP',
            id: id,
            role: role
        };
    }

    /**
     * Initialize the ledger with optional genesis information
     */
    async InitLedger(ctx) {
        console.info('============= START : Initialize MediChain Ledger ===========');
        const genesisRecord = {
            docType: 'system_genesis',
            network: 'MediChain Supply Chain Network',
            channel: 'medichain-channel',
            contractVersion: '1.0.0',
            initializedAt: this._getTxTimestamp(ctx)
        };
        await ctx.stub.putState('SYSTEM_GENESIS', Buffer.from(JSON.stringify(genesisRecord)));
        console.info('============= END : Initialize MediChain Ledger ===========');
        return JSON.stringify(genesisRecord);
    }

    /**
     * Register a new medicine batch
     * Only authorized manufacturers can invoke this.
     */
    async RegisterMedicineBatch(ctx, batchDataJson) {
        console.info('============= START : RegisterMedicineBatch ===========');

        let data;
        try {
            data = JSON.parse(batchDataJson);
        } catch (err) {
            throw new Error(`Invalid JSON payload: ${err.message}`);
        }

        const requiredFields = [
            'batchId',
            'medicineName',
            'genericName',
            'manufacturer',
            'manufacturingDate',
            'expiryDate',
            'quantity',
            'unit',
            'composition',
            'storageConditions'
        ];

        for (const field of requiredFields) {
            if (!data[field] || String(data[field]).trim() === '') {
                throw new Error(`Validation Error: Missing required field "${field}".`);
            }
        }

        const batchId = String(data.batchId).trim();

        // 1. Check for duplicate batch ID
        const existsBytes = await ctx.stub.getState(batchId);
        if (existsBytes && existsBytes.length > 0) {
            throw new Error(`Conflict: Medicine batch with ID "${batchId}" already exists on the ledger.`);
        }

        // 2. Validate dates
        const mfgDate = new Date(data.manufacturingDate);
        const expDate = new Date(data.expiryDate);
        if (isNaN(mfgDate.getTime())) {
            throw new Error(`Validation Error: Invalid manufacturing date format: ${data.manufacturingDate}`);
        }
        if (isNaN(expDate.getTime())) {
            throw new Error(`Validation Error: Invalid expiry date format: ${data.expiryDate}`);
        }
        if (expDate <= mfgDate) {
            throw new Error(`Validation Error: Expiry date (${data.expiryDate}) must be after manufacturing date (${data.manufacturingDate}).`);
        }

        // 3. Validate quantity
        const quantity = Number(data.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            throw new Error(`Validation Error: Quantity must be a positive number. Received: ${data.quantity}`);
        }

        // 4. Client identity & MSP
        const client = this._getClientIdentity(ctx);
        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();

        const manufacturerMSP = data.manufacturerMSP || client.mspId;
        const manufacturer = String(data.manufacturer).trim();

        const initialJourneyEntry = {
            stage: 'MANUFACTURED',
            actor: manufacturer,
            role: 'MANUFACTURER',
            msp: manufacturerMSP,
            timestamp: txTimestamp,
            txId: txId,
            notes: data.notes || 'Batch manufactured, quality verified, and registered on Hyperledger Fabric ledger.'
        };

        const batch = {
            docType: 'medicine_batch',
            batchId: batchId,
            medicineName: String(data.medicineName).trim(),
            genericName: String(data.genericName).trim(),
            manufacturer: manufacturer,
            manufacturerMSP: manufacturerMSP,
            manufacturingDate: data.manufacturingDate,
            expiryDate: data.expiryDate,
            quantity: quantity,
            unit: String(data.unit).trim(),
            composition: String(data.composition).trim(),
            storageConditions: String(data.storageConditions).trim(),
            currentOwner: manufacturer,
            currentOwnerMSP: manufacturerMSP,
            currentOwnerRole: 'MANUFACTURER',
            currentStatus: 'MANUFACTURED',
            previousOwner: '',
            pendingReceiver: '',
            pendingReceiverRole: '',
            isRecalled: false,
            recallReason: '',
            recalledBy: '',
            recalledAt: null,
            createdAt: txTimestamp,
            updatedAt: txTimestamp,
            lastTxId: txId,
            journey: [initialJourneyEntry]
        };

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        // Emit Fabric Event
        const eventPayload = {
            batchId: batchId,
            medicineName: batch.medicineName,
            manufacturer: batch.manufacturer,
            txId: txId,
            timestamp: txTimestamp
        };
        ctx.stub.setEvent('BatchRegistered', Buffer.from(JSON.stringify(eventPayload)));

        console.info(`Batch ${batchId} successfully registered by ${manufacturer}.`);
        return JSON.stringify(batch);
    }

    /**
     * Read a medicine batch by batchId
     */
    async ReadMedicineBatch(ctx, batchId) {
        if (!batchId || String(batchId).trim() === '') {
            throw new Error('Batch ID must be provided.');
        }

        const batchBytes = await ctx.stub.getState(String(batchId).trim());
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch with ID "${batchId}" does not exist on the blockchain ledger.`);
        }

        return batchBytes.toString('utf8');
    }

    /**
     * Step 1 of Two-Step Transfer Workflow: Initiate Transfer
     */
    async TransferBatch(ctx, batchId, targetReceiver, targetRole, notes) {
        console.info(`============= START : TransferBatch ${batchId} ===========`);

        if (!batchId) throw new Error('Batch ID is required.');
        if (!targetReceiver || String(targetReceiver).trim() === '') {
            throw new Error('Target receiver name/organization is required.');
        }
        if (!targetRole || String(targetRole).trim() === '') {
            throw new Error('Target role is required (DISTRIBUTOR, WHOLESALER, PHARMACY).');
        }

        const normalizedTargetRole = String(targetRole).trim().toUpperCase();
        const validRoles = ['DISTRIBUTOR', 'WHOLESALER', 'PHARMACY'];
        if (!validRoles.includes(normalizedTargetRole)) {
            throw new Error(`Invalid target role "${targetRole}". Must be one of: ${validRoles.join(', ')}.`);
        }

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch "${batchId}" not found.`);
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));

        // Rule: Recalled batches cannot be transferred
        if (batch.isRecalled) {
            throw new Error(`Transfer Rejected: Batch "${batchId}" has been RECALLED. Reason: "${batch.recallReason}". Recalled batches cannot be moved.`);
        }

        // Rule: Expired batches cannot be transferred
        const now = new Date(this._getTxTimestamp(ctx));
        const expDate = new Date(batch.expiryDate);
        if (now > expDate) {
            throw new Error(`Transfer Rejected: Batch "${batchId}" expired on ${batch.expiryDate}. Expired medicines cannot be transferred.`);
        }

        // Rule: Prevent double transfer while pending
        if (batch.pendingReceiver && batch.pendingReceiver !== '') {
            throw new Error(`Transfer Rejected: A transfer is already pending for batch "${batchId}" to "${batch.pendingReceiver}" (${batch.pendingReceiverRole}).`);
        }

        // Rule: Enforce supply chain linear progression
        const currentRole = batch.currentOwnerRole;
        if (currentRole === 'MANUFACTURER' && normalizedTargetRole !== 'DISTRIBUTOR') {
            throw new Error(`Invalid Supply Chain Transition: Manufacturer can only transfer to DISTRIBUTOR. Cannot transfer directly to ${normalizedTargetRole}.`);
        } else if (currentRole === 'DISTRIBUTOR' && normalizedTargetRole !== 'WHOLESALER') {
            throw new Error(`Invalid Supply Chain Transition: Distributor can only transfer to WHOLESALER. Cannot transfer directly to ${normalizedTargetRole}.`);
        } else if (currentRole === 'WHOLESALER' && normalizedTargetRole !== 'PHARMACY') {
            throw new Error(`Invalid Supply Chain Transition: Wholesaler can only transfer to PHARMACY. Cannot transfer directly to ${normalizedTargetRole}.`);
        } else if (currentRole === 'PHARMACY') {
            throw new Error(`Invalid Supply Chain Transition: Pharmacy is the final distribution point. Batches cannot be transferred onward to ${normalizedTargetRole}.`);
        }

        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();
        const client = this._getClientIdentity(ctx);

        // Update state to IN_TRANSIT with pending receiver
        batch.currentStatus = 'IN_TRANSIT';
        batch.pendingReceiver = String(targetReceiver).trim();
        batch.pendingReceiverRole = normalizedTargetRole;
        batch.updatedAt = txTimestamp;
        batch.lastTxId = txId;

        batch.journey.push({
            stage: 'IN_TRANSIT',
            actor: batch.currentOwner,
            role: batch.currentOwnerRole,
            msp: client.mspId,
            timestamp: txTimestamp,
            txId: txId,
            notes: `Transfer initiated by ${batch.currentOwner} -> Pending acceptance by ${targetReceiver} (${normalizedTargetRole}). Notes: ${notes || 'Handover in transit'}`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        ctx.stub.setEvent('BatchTransferInitiated', Buffer.from(JSON.stringify({
            batchId: batchId,
            from: batch.currentOwner,
            to: targetReceiver,
            targetRole: normalizedTargetRole,
            txId: txId
        })));

        return JSON.stringify(batch);
    }

    /**
     * Step 2 of Two-Step Transfer Workflow: Receive and Accept Batch
     */
    async ReceiveBatch(ctx, batchId, receiverNotes) {
        console.info(`============= START : ReceiveBatch ${batchId} ===========`);

        if (!batchId) throw new Error('Batch ID is required.');

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch "${batchId}" not found.`);
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));

        if (!batch.pendingReceiver || batch.pendingReceiver === '') {
            throw new Error(`No pending transfer found for batch "${batchId}". It is currently held by "${batch.currentOwner}".`);
        }

        if (batch.isRecalled) {
            throw new Error(`Transfer Acceptance Rejected: Batch "${batchId}" has been RECALLED.`);
        }

        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();
        const client = this._getClientIdentity(ctx);

        const acceptedBy = batch.pendingReceiver;
        const acceptedRole = batch.pendingReceiverRole;

        // Determine new status based on accepted role
        let nextStatus;
        if (acceptedRole === 'DISTRIBUTOR') {
            nextStatus = 'RECEIVED_BY_DISTRIBUTOR';
        } else if (acceptedRole === 'WHOLESALER') {
            nextStatus = 'RECEIVED_BY_WHOLESALER';
        } else if (acceptedRole === 'PHARMACY') {
            nextStatus = 'RECEIVED_BY_PHARMACY';
        } else {
            nextStatus = 'RECEIVED';
        }

        batch.previousOwner = batch.currentOwner;
        batch.currentOwner = acceptedBy;
        batch.currentOwnerRole = acceptedRole;
        batch.currentOwnerMSP = client.mspId;
        batch.currentStatus = nextStatus;
        batch.pendingReceiver = '';
        batch.pendingReceiverRole = '';
        batch.updatedAt = txTimestamp;
        batch.lastTxId = txId;

        batch.journey.push({
            stage: nextStatus,
            actor: acceptedBy,
            role: acceptedRole,
            msp: client.mspId,
            timestamp: txTimestamp,
            txId: txId,
            notes: receiverNotes || `Batch received and inspected by ${acceptedBy} (${acceptedRole}). Ownership transferred.`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        ctx.stub.setEvent('BatchReceived', Buffer.from(JSON.stringify({
            batchId: batchId,
            newOwner: acceptedBy,
            role: acceptedRole,
            status: nextStatus,
            txId: txId
        })));

        return JSON.stringify(batch);
    }

    /**
     * Reject a pending transfer
     */
    async RejectTransfer(ctx, batchId, rejectionReason) {
        console.info(`============= START : RejectTransfer ${batchId} ===========`);

        if (!batchId) throw new Error('Batch ID is required.');
        if (!rejectionReason || String(rejectionReason).trim() === '') {
            throw new Error('Rejection reason must be provided.');
        }

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch "${batchId}" not found.`);
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));

        if (!batch.pendingReceiver || batch.pendingReceiver === '') {
            throw new Error(`No pending transfer to reject for batch "${batchId}".`);
        }

        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();
        const client = this._getClientIdentity(ctx);

        const rejectedBy = batch.pendingReceiver;
        const previousOwnerRole = batch.currentOwnerRole;

        // Revert status to previous owner's held status
        let revertedStatus;
        if (previousOwnerRole === 'MANUFACTURER') {
            revertedStatus = 'MANUFACTURED';
        } else if (previousOwnerRole === 'DISTRIBUTOR') {
            revertedStatus = 'RECEIVED_BY_DISTRIBUTOR';
        } else if (previousOwnerRole === 'WHOLESALER') {
            revertedStatus = 'RECEIVED_BY_WHOLESALER';
        } else {
            revertedStatus = 'HELD';
        }

        batch.currentStatus = revertedStatus;
        const rejectedTarget = batch.pendingReceiver;
        batch.pendingReceiver = '';
        batch.pendingReceiverRole = '';
        batch.updatedAt = txTimestamp;
        batch.lastTxId = txId;

        batch.journey.push({
            stage: 'TRANSFER_REJECTED',
            actor: rejectedBy,
            role: batch.pendingReceiverRole,
            msp: client.mspId,
            timestamp: txTimestamp,
            txId: txId,
            notes: `Transfer rejected by ${rejectedTarget}. Reason: ${rejectionReason}. Returned to ${batch.currentOwner}.`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        ctx.stub.setEvent('BatchTransferRejected', Buffer.from(JSON.stringify({
            batchId: batchId,
            rejectedBy: rejectedBy,
            currentOwner: batch.currentOwner,
            reason: rejectionReason,
            txId: txId
        })));

        return JSON.stringify(batch);
    }

    /**
     * Mark batch as AVAILABLE_FOR_SALE (Pharmacy only)
     */
    async UpdateBatchStatus(ctx, batchId, newStatus, notes) {
        if (!batchId) throw new Error('Batch ID is required.');
        if (!newStatus) throw new Error('New status is required.');

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch "${batchId}" not found.`);
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));

        if (batch.isRecalled) {
            throw new Error(`Cannot update status of RECALLED batch "${batchId}".`);
        }

        const normalizedStatus = String(newStatus).trim().toUpperCase();

        if (normalizedStatus === 'AVAILABLE_FOR_SALE') {
            if (batch.currentOwnerRole !== 'PHARMACY') {
                throw new Error(`Only a PHARMACY can mark a batch as AVAILABLE_FOR_SALE. Current owner role: ${batch.currentOwnerRole}`);
            }
            if (batch.currentStatus !== 'RECEIVED_BY_PHARMACY') {
                throw new Error(`Batch must be in RECEIVED_BY_PHARMACY state before marking AVAILABLE_FOR_SALE. Current status: ${batch.currentStatus}`);
            }
        }

        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();
        const client = this._getClientIdentity(ctx);

        batch.currentStatus = normalizedStatus;
        batch.updatedAt = txTimestamp;
        batch.lastTxId = txId;

        batch.journey.push({
            stage: normalizedStatus,
            actor: batch.currentOwner,
            role: batch.currentOwnerRole,
            msp: client.mspId,
            timestamp: txTimestamp,
            txId: txId,
            notes: notes || `Batch status updated to ${normalizedStatus} by ${batch.currentOwner}.`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        return JSON.stringify(batch);
    }

    /**
     * Recall a medicine batch
     * Can only be called by the manufacturer or authorized regulator/super admin
     */
    async RecallBatch(ctx, batchId, reason) {
        console.info(`============= START : RecallBatch ${batchId} ===========`);

        if (!batchId) throw new Error('Batch ID is required.');
        if (!reason || String(reason).trim() === '') {
            throw new Error('A specific recall reason must be provided.');
        }

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Medicine batch "${batchId}" not found.`);
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));

        if (batch.isRecalled) {
            throw new Error(`Batch "${batchId}" is already RECALLED on ${batch.recalledAt}. Reason: "${batch.recallReason}".`);
        }

        const txTimestamp = this._getTxTimestamp(ctx);
        const txId = ctx.stub.getTxID();
        const client = this._getClientIdentity(ctx);

        batch.isRecalled = true;
        batch.recallReason = String(reason).trim();
        batch.recalledBy = client.id || client.mspId;
        batch.recalledAt = txTimestamp;
        batch.currentStatus = 'RECALLED';
        batch.updatedAt = txTimestamp;
        batch.lastTxId = txId;

        batch.journey.push({
            stage: 'RECALLED',
            actor: batch.manufacturer,
            role: 'REGULATOR_OR_MANUFACTURER',
            msp: client.mspId,
            timestamp: txTimestamp,
            txId: txId,
            notes: `SAFETY ALERT: Batch recalled! Reason: ${batch.recallReason}`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        ctx.stub.setEvent('BatchRecalled', Buffer.from(JSON.stringify({
            batchId: batchId,
            reason: batch.recallReason,
            recalledBy: batch.recalledBy,
            txId: txId
        })));

        return JSON.stringify(batch);
    }

    /**
     * Public Verification function
     * Evaluates full batch authenticity and supply chain journey
     */
    async VerifyMedicine(ctx, batchId) {
        if (!batchId) {
            return JSON.stringify({
                exists: false,
                verificationStatus: 'INVALID',
                message: 'No batch ID provided.'
            });
        }

        const batchBytes = await ctx.stub.getState(String(batchId).trim());
        if (!batchBytes || batchBytes.length === 0) {
            return JSON.stringify({
                exists: false,
                batchId: batchId,
                verificationStatus: 'INVALID',
                message: `Medicine batch "${batchId}" was NOT FOUND on the blockchain. This medicine may be counterfeit or unregistered.`
            });
        }

        const batch = JSON.parse(batchBytes.toString('utf8'));
        const now = new Date(this._getTxTimestamp(ctx));
        const expDate = new Date(batch.expiryDate);

        let verificationStatus = 'VERIFIED';
        let safetyStatus = 'SAFE';
        let message = 'Medicine is authentic and registered on Hyperledger Fabric.';

        if (batch.isRecalled) {
            verificationStatus = 'RECALLED';
            safetyStatus = 'DANGER_RECALLED';
            message = `WARNING: This medicine batch has been officially RECALLED! Reason: ${batch.recallReason}. DO NOT CONSUME.`;
        } else if (now > expDate) {
            verificationStatus = 'EXPIRED';
            safetyStatus = 'DANGER_EXPIRED';
            message = `WARNING: This medicine batch EXPIRED on ${batch.expiryDate}. DO NOT CONSUME.`;
        } else if (batch.currentStatus === 'IN_TRANSIT') {
            verificationStatus = 'IN_TRANSIT';
            safetyStatus = 'IN_TRANSIT';
            message = `Batch is currently IN TRANSIT to ${batch.pendingReceiver} (${batch.pendingReceiverRole}). Not yet confirmed at destination.`;
        } else if (batch.currentStatus === 'AVAILABLE_FOR_SALE') {
            verificationStatus = 'VERIFIED_AVAILABLE';
            safetyStatus = 'SAFE';
            message = `Authentic medicine batch, fully verified through supply chain and currently AVAILABLE FOR SALE at pharmacy.`;
        } else if (batch.currentStatus === 'RECEIVED_BY_PHARMACY') {
            verificationStatus = 'VERIFIED_AT_PHARMACY';
            safetyStatus = 'SAFE';
            message = `Authentic medicine batch, received at verified pharmacy: ${batch.currentOwner}.`;
        } else {
            verificationStatus = 'IN_SUPPLY_CHAIN';
            safetyStatus = 'IN_PIPELINE';
            message = `Batch is genuine and moving through supply chain. Currently at: ${batch.currentOwner} (${batch.currentOwnerRole}).`;
        }

        const verificationResult = {
            exists: true,
            batchId: batch.batchId,
            medicineName: batch.medicineName,
            genericName: batch.genericName,
            manufacturer: batch.manufacturer,
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            unit: batch.unit,
            composition: batch.composition,
            storageConditions: batch.storageConditions,
            currentOwner: batch.currentOwner,
            currentOwnerRole: batch.currentOwnerRole,
            currentStatus: batch.currentStatus,
            verificationStatus: verificationStatus,
            safetyStatus: safetyStatus,
            isRecalled: batch.isRecalled,
            recallReason: batch.recallReason || null,
            recalledAt: batch.recalledAt || null,
            message: message,
            verifiedAt: this._getTxTimestamp(ctx),
            supplyChainStagesCompleted: {
                manufactured: batch.journey.some(j => j.stage === 'MANUFACTURED'),
                distributorReceived: batch.journey.some(j => j.stage === 'RECEIVED_BY_DISTRIBUTOR'),
                wholesalerReceived: batch.journey.some(j => j.stage === 'RECEIVED_BY_WHOLESALER'),
                pharmacyReceived: batch.journey.some(j => j.stage === 'RECEIVED_BY_PHARMACY'),
                availableForSale: batch.journey.some(j => j.stage === 'AVAILABLE_FOR_SALE')
            },
            journey: batch.journey,
            lastTxId: batch.lastTxId
        };

        return JSON.stringify(verificationResult);
    }

    /**
     * Get complete state history for a batch
     * Uses ctx.stub.getHistoryForKey
     */
    async GetBatchHistory(ctx, batchId) {
        if (!batchId) throw new Error('Batch ID is required.');

        const iterator = await ctx.stub.getHistoryForKey(String(batchId).trim());
        const allResults = [];

        try {
            let res = await iterator.next();
            while (!res.done) {
                if (res.value) {
                    const obj = {
                        txId: res.value.txId,
                        timestamp: this._parseTimestamp(res.value.timestamp),
                        isDelete: res.value.isDelete
                    };

                    if (res.value.value && res.value.value.length > 0) {
                        try {
                            obj.value = JSON.parse(res.value.value.toString('utf8'));
                        } catch (err) {
                            obj.value = res.value.value.toString('utf8');
                        }
                    }

                    allResults.push(obj);
                }
                res = await iterator.next();
            }
        } finally {
            await iterator.close();
        }

        return JSON.stringify(allResults);
    }

    /**
     * Get all medicine batches on ledger
     */
    async GetAllBatches(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const allBatches = [];

        try {
            let result = await iterator.next();
            while (!result.done) {
                if (result.value && result.value.value) {
                    const strValue = Buffer.isBuffer(result.value.value)
                        ? result.value.value.toString('utf8')
                        : Buffer.from(result.value.value).toString('utf8');
                    try {
                        const record = JSON.parse(strValue);
                        if (record && record.docType === 'medicine_batch') {
                            allBatches.push(record);
                        }
                    } catch (err) {
                        // ignore non-json
                    }
                }
                result = await iterator.next();
            }
        } finally {
            await iterator.close();
        }

        return JSON.stringify(allBatches);
    }

    /**
     * Return ledger summary statistics for auditing
     */
    async GetTransactionHistory(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const summary = {
            totalBatches: 0,
            activeBatches: 0,
            recalledBatches: 0,
            inTransitBatches: 0,
            batches: []
        };

        try {
            let result = await iterator.next();
            while (!result.done) {
                if (result.value && result.value.value) {
                    const strValue = Buffer.isBuffer(result.value.value)
                        ? result.value.value.toString('utf8')
                        : Buffer.from(result.value.value).toString('utf8');
                    try {
                        const record = JSON.parse(strValue);
                        if (record && record.docType === 'medicine_batch') {
                            summary.totalBatches += 1;
                            if (record.isRecalled) summary.recalledBatches += 1;
                            if (record.currentStatus === 'IN_TRANSIT') summary.inTransitBatches += 1;
                            summary.batches.push({
                                batchId: record.batchId,
                                medicineName: record.medicineName,
                                currentOwner: record.currentOwner,
                                currentStatus: record.currentStatus,
                                lastTxId: record.lastTxId,
                                updatedAt: record.updatedAt
                            });
                        }
                    } catch (e) {
                        // skip non-json
                    }
                }
                result = await iterator.next();
            }
        } finally {
            await iterator.close();
        }

        summary.activeBatches = summary.totalBatches - summary.recalledBatches;
        return JSON.stringify(summary);
    }
}

module.exports = MediChainContract;
