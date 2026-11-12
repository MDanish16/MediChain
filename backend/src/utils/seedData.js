'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDatabase, get, run } = require('../config/database');
const fabricGateway = require('../services/fabricGateway');

async function seedUsers() {
    console.log('--- Seeding Application Demo Users into SQLite ---');

    const defaultPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const users = [
        {
            username: 'admin',
            email: 'admin@medichain.network',
            role: 'SUPER_ADMIN',
            organization: 'MediChain Supply Chain Consortium',
            mspId: 'Org1MSP'
        },
        {
            username: 'manufacturer',
            email: 'qa@pharmacorp.com',
            role: 'MANUFACTURER',
            organization: 'PharmaCorp Labs',
            mspId: 'Org1MSP'
        },
        {
            username: 'distributor',
            email: 'operations@logicare.com',
            role: 'DISTRIBUTOR',
            organization: 'LogiCare Pharma Distribution',
            mspId: 'Org2MSP'
        },
        {
            username: 'wholesaler',
            email: 'inventory@medsupply.com',
            role: 'WHOLESALER',
            organization: 'MedSupply Global Logistics',
            mspId: 'Org2MSP'
        },
        {
            username: 'pharmacy',
            email: 'rx@careplus.com',
            role: 'PHARMACY',
            organization: 'CarePlus Pharmacy Network',
            mspId: 'Org1MSP'
        }
    ];

    for (const u of users) {
        const existing = await get('SELECT id FROM users WHERE username = ?', [u.username]);
        if (!existing) {
            await run(
                'INSERT INTO users (username, email, password_hash, role, organization, mspId) VALUES (?, ?, ?, ?, ?, ?)',
                [u.username, u.email, passwordHash, u.role, u.organization, u.mspId]
            );
            console.log(`✓ Created user: ${u.username} (${u.role} - ${u.organization}) [Password: Password@123]`);
        } else {
            console.log(`  User already exists: ${u.username}`);
        }
    }
}

async function seedBlockchainBatches() {
    console.log('\n--- Seeding Demo Medicine Batches onto Hyperledger Fabric Ledger ---');

    await fabricGateway.connectGateway();

    // 1. Batch: PARACETAMOL-500 (Full Lifecycle -> AVAILABLE_FOR_SALE)
    const batch1Id = 'MED-2026-90412';
    try {
        const existing = await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch1Id);
        console.log(`  Batch ${batch1Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`1. Creating Batch ${batch1Id} (PARACETAMOL-500)...`);
        const b1 = {
            batchId: batch1Id,
            medicineName: 'Paracetamol 500mg Tablets',
            genericName: 'Acetaminophen',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2026-01-15',
            expiryDate: '2028-01-15',
            quantity: 15000,
            unit: 'Boxes (10 strips x 10 tabs)',
            composition: 'Paracetamol IP 500mg, Excipients q.s.',
            storageConditions: 'Store below 25°C in a dry place. Protect from direct sunlight.',
            notes: 'High-purity analgesic batch manufactured under GMP Certificate QA-2026-A1.'
        };
        const reg1 = await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b1));
        console.log(`  Registered on Fabric: TxID=${reg1.txId}`);

        // Transfer to Distributor
        const t1 = await fabricGateway.submitTransaction('TransferBatch', batch1Id, 'LogiCare Pharma Distribution', 'DISTRIBUTOR', 'Cold-chain dispatch container #LC-402');
        console.log(`  Transferred to Distributor: TxID=${t1.txId}`);

        // Distributor receives
        const r1 = await fabricGateway.submitTransaction('ReceiveBatch', batch1Id, 'Received at Central Distribution Hub. Seal intact.');
        console.log(`  Received by Distributor: TxID=${r1.txId}`);

        // Transfer to Wholesaler
        const t2 = await fabricGateway.submitTransaction('TransferBatch', batch1Id, 'MedSupply Global Logistics', 'WHOLESALER', 'Regional freight dispatch');
        console.log(`  Transferred to Wholesaler: TxID=${t2.txId}`);

        // Wholesaler receives
        const r2 = await fabricGateway.submitTransaction('ReceiveBatch', batch1Id, 'Received at regional wholesale warehouse. QC passed.');
        console.log(`  Received by Wholesaler: TxID=${r2.txId}`);

        // Transfer to Pharmacy
        const t3 = await fabricGateway.submitTransaction('TransferBatch', batch1Id, 'CarePlus Pharmacy Network', 'PHARMACY', 'Last-mile store delivery');
        console.log(`  Transferred to Pharmacy: TxID=${t3.txId}`);

        // Pharmacy receives
        const r3 = await fabricGateway.submitTransaction('ReceiveBatch', batch1Id, 'Received at CarePlus Pharmacy main branch.');
        console.log(`  Received by Pharmacy: TxID=${r3.txId}`);

        // Pharmacy marks AVAILABLE_FOR_SALE
        const s1 = await fabricGateway.submitTransaction('UpdateBatchStatus', batch1Id, 'AVAILABLE_FOR_SALE', 'Dispensing inventory verified and placed on shelves.');
        console.log(`  Marked AVAILABLE_FOR_SALE: TxID=${s1.txId}`);
    }

    // 2. Batch: AMOXICILLIN-250 (Received by Wholesaler)
    const batch2Id = 'MED-2026-88124';
    try {
        await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch2Id);
        console.log(`  Batch ${batch2Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`2. Creating Batch ${batch2Id} (AMOXICILLIN-250)...`);
        const b2 = {
            batchId: batch2Id,
            medicineName: 'Amoxicillin 250mg Capsules',
            genericName: 'Amoxicillin Trihydrate',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2026-02-01',
            expiryDate: '2027-08-01',
            quantity: 8000,
            unit: 'Bottles (100 capsules)',
            composition: 'Amoxicillin Trihydrate IP eq. to Amoxicillin 250mg',
            storageConditions: 'Store in airtight containers below 20°C in a dry place.',
            notes: 'Broad-spectrum antibiotic batch inspected under ISO 9001:2015 protocol.'
        };
        const reg2 = await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b2));
        console.log(`  Registered on Fabric: TxID=${reg2.txId}`);

        await fabricGateway.submitTransaction('TransferBatch', batch2Id, 'LogiCare Pharma Distribution', 'DISTRIBUTOR', 'Air freight shipment');
        await fabricGateway.submitTransaction('ReceiveBatch', batch2Id, 'Inspected at airport transit warehouse.');
        await fabricGateway.submitTransaction('TransferBatch', batch2Id, 'MedSupply Global Logistics', 'WHOLESALER', 'Consignment release');
        const r2 = await fabricGateway.submitTransaction('ReceiveBatch', batch2Id, 'Stored in temperature-controlled zone B.');
        console.log(`  Now held at Wholesaler: TxID=${r2.txId}`);
    }

    // 3. Batch: CETIRIZINE-10 (In Transit to Wholesaler)
    const batch3Id = 'MED-2026-73591';
    try {
        await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch3Id);
        console.log(`  Batch ${batch3Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`3. Creating Batch ${batch3Id} (CETIRIZINE-10)...`);
        const b3 = {
            batchId: batch3Id,
            medicineName: 'Cetirizine 10mg Tablets',
            genericName: 'Cetirizine Hydrochloride',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2026-02-10',
            expiryDate: '2028-02-10',
            quantity: 20000,
            unit: 'Boxes (10 x 10 blister strips)',
            composition: 'Cetirizine Hydrochloride IP 10mg',
            storageConditions: 'Store below 30°C. Protect from moisture.',
            notes: 'Antihistamine batch packaged in moisture-barrier blisters.'
        };
        await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b3));
        await fabricGateway.submitTransaction('TransferBatch', batch3Id, 'LogiCare Pharma Distribution', 'DISTRIBUTOR', 'Ground fleet transfer');
        await fabricGateway.submitTransaction('ReceiveBatch', batch3Id, 'Received and sorted for regional dispatch.');
        const t3 = await fabricGateway.submitTransaction('TransferBatch', batch3Id, 'MedSupply Global Logistics', 'WHOLESALER', 'En-route via GPS-tracked truck #TRK-881');
        console.log(`  Now IN_TRANSIT to Wholesaler: TxID=${t3.txId}`);
    }

    // 4. Batch: AZITHROMYCIN-500 (Recalled Batch)
    const batch4Id = 'MED-2026-61902';
    try {
        await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch4Id);
        console.log(`  Batch ${batch4Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`4. Creating Batch ${batch4Id} (AZITHROMYCIN-500 - RECALLED)...`);
        const b4 = {
            batchId: batch4Id,
            medicineName: 'Azithromycin 500mg Tablets',
            genericName: 'Azithromycin Dihydrate',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2026-01-20',
            expiryDate: '2027-07-20',
            quantity: 5000,
            unit: 'Boxes (3 tablets strip)',
            composition: 'Azithromycin Dihydrate IP eq. to Azithromycin 500mg',
            storageConditions: 'Store in dry place below 25°C.',
            notes: 'Production run for hospital supply.'
        };
        await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b4));
        const rec = await fabricGateway.submitTransaction(
            'RecallBatch',
            batch4Id,
            'Defective blister sealing detected during stability testing. Potential risk of active ingredient oxidation.'
        );
        console.log(`  Recalled on Fabric: TxID=${rec.txId}`);
    }

    // 5. Batch: VITAMIN-C-500 (Newly Manufactured at Manufacturer)
    const batch5Id = 'MED-2026-55420';
    try {
        await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch5Id);
        console.log(`  Batch ${batch5Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`5. Creating Batch ${batch5Id} (VITAMIN-C-500 - Newly Manufactured)...`);
        const b5 = {
            batchId: batch5Id,
            medicineName: 'Vitamin C 500mg Chewable',
            genericName: 'Ascorbic Acid & Sodium Ascorbate',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2026-03-01',
            expiryDate: '2028-03-01',
            quantity: 25000,
            unit: 'Bottles (60 chewable tabs)',
            composition: 'Ascorbic Acid IP 100mg, Sodium Ascorbate IP 450mg',
            storageConditions: 'Store in cool and dry place. Keep container tightly closed.',
            notes: 'Freshly manufactured batch pending distribution allocation.'
        };
        const reg5 = await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b5));
        console.log(`  Registered at Manufacturer: TxID=${reg5.txId}`);
    }

    // 6. Expired Demo Batch
    const batch6Id = 'MED-2024-11002';
    try {
        await fabricGateway.evaluateTransaction('ReadMedicineBatch', batch6Id);
        console.log(`  Batch ${batch6Id} already exists on blockchain ledger.`);
    } catch (e) {
        console.log(`6. Creating Expired Batch ${batch6Id}...`);
        const b6 = {
            batchId: batch6Id,
            medicineName: 'Pediatric Paracetamol Syrup 125mg/5ml',
            genericName: 'Acetaminophen Oral Suspension',
            manufacturer: 'PharmaCorp Labs',
            manufacturingDate: '2024-01-01',
            expiryDate: '2025-01-01',
            quantity: 3000,
            unit: 'Bottles (60ml)',
            composition: 'Each 5ml contains Paracetamol IP 125mg',
            storageConditions: 'Store below 25°C. Shake well before use.',
            notes: 'Historical reference batch for expiry testing demonstration.'
        };
        const reg6 = await fabricGateway.submitTransaction('RegisterMedicineBatch', JSON.stringify(b6));
        console.log(`  Registered Expired batch: TxID=${reg6.txId}`);
    }

    console.log('\n==================================================');
    console.log('✓ DEMO SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
}

async function main() {
    try {
        await initDatabase();
        await seedUsers();
        await seedBlockchainBatches();
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

main();

