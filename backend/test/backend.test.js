'use strict';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { initDatabase } = require('../src/config/database');

describe('MediChain Backend API Tests', () => {
    let manufacturerToken;
    let distributorToken;
    let testBatchId;

    before(async () => {
        await initDatabase();
    });

    describe('1. Authentication Endpoints', () => {
        it('should login manufacturer successfully and return JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'manufacturer',
                    password: 'Password@123'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.token).to.be.a('string');
            expect(res.body.user.role).to.equal('MANUFACTURER');
            manufacturerToken = res.body.token;
        });

        it('should login distributor successfully and return JWT', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'distributor',
                    password: 'Password@123'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.user.role).to.equal('DISTRIBUTOR');
            distributorToken = res.body.token;
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'manufacturer',
                    password: 'WrongPassword'
                });

            expect(res.status).to.equal(401);
            expect(res.body.success).to.be.false;
        });
    });

    describe('2. Public Medicine Verification (No Auth Required)', () => {
        it('should verify existing seeded batch MED-2026-90412', async () => {
            const res = await request(app)
                .get('/api/verify/MED-2026-90412');

            expect(res.status).to.equal(200);
            expect(res.body.exists).to.be.true;
            expect(res.body.verification.batchId).to.equal('MED-2026-90412');
            expect(res.body.verification.isRecalled).to.be.false;
            expect(res.body.qrCode).to.include('data:image/png;base64');
        });

        it('should return INVALID for non-existent batch', async () => {
            const res = await request(app)
                .get('/api/verify/MED-FAKE-99999');

            expect(res.status).to.equal(200);
            expect(res.body.exists).to.be.false;
            expect(res.body.verificationStatus).to.equal('INVALID');
        });

        it('should identify recalled batch MED-2026-61902 with safety alert', async () => {
            const res = await request(app)
                .get('/api/verify/MED-2026-61902');

            expect(res.status).to.equal(200);
            expect(res.body.exists).to.be.true;
            expect(res.body.verification.isRecalled).to.be.true;
            expect(res.body.verification.verificationStatus).to.equal('RECALLED');
        });
    });

    describe('3. Batch Management on Hyperledger Fabric', () => {
        it('should list all batches from the Fabric ledger', async () => {
            const res = await request(app)
                .get('/api/batches')
                .set('Authorization', `Bearer ${manufacturerToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.batches).to.be.an('array');
            expect(res.body.count).to.be.greaterThan(0);
        });

        it('should register a new batch on the blockchain', async () => {
            testBatchId = `MED-API-TEST-${Date.now().toString().slice(-5)}`;
            const res = await request(app)
                .post('/api/batches/register')
                .set('Authorization', `Bearer ${manufacturerToken}`)
                .send({
                    batchId: testBatchId,
                    medicineName: 'Ibuprofen 400mg Tablets',
                    genericName: 'Ibuprofen',
                    manufacturingDate: '2026-03-01',
                    expiryDate: '2028-03-01',
                    quantity: 4000,
                    unit: 'Boxes (20 strips)',
                    composition: 'Ibuprofen IP 400mg',
                    storageConditions: 'Store below 25°C',
                    notes: 'Backend integration test batch'
                });

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.txId).to.be.a('string');
            expect(res.body.batch.batchId).to.equal(testBatchId);
        });

        it('should retrieve single batch details from ledger', async () => {
            const res = await request(app)
                .get(`/api/batches/${testBatchId}`)
                .set('Authorization', `Bearer ${manufacturerToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.batch.batchId).to.equal(testBatchId);
        });
    });

    describe('4. Transfer Workflow', () => {
        it('should initiate transfer of newly created batch to distributor', async () => {
            const res = await request(app)
                .post(`/api/transfers/${testBatchId}/initiate`)
                .set('Authorization', `Bearer ${manufacturerToken}`)
                .send({
                    targetReceiver: 'LogiCare Pharma Distribution',
                    targetRole: 'DISTRIBUTOR',
                    notes: 'Dispatched for test handover'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.batch.currentStatus).to.equal('IN_TRANSIT');
        });

        it('should reject unauthorized initiation from non-owner', async () => {
            const res = await request(app)
                .post('/api/transfers/MED-2026-90412/initiate')
                .set('Authorization', `Bearer ${manufacturerToken}`)
                .send({
                    targetReceiver: 'Another Org',
                    targetRole: 'DISTRIBUTOR'
                });

            expect(res.status).to.equal(403);
            expect(res.body.message).to.include('Unauthorized Transfer');
        });
    });

    describe('5. Explorer & Analytics', () => {
        it('should return explorer overview and network status', async () => {
            const res = await request(app).get('/api/explorer/overview');
            expect(res.status).to.equal(200);
            expect(res.body.network.status).to.equal('ONLINE');
            expect(res.body.metrics.totalBatches).to.be.greaterThan(0);
        });

        it('should return analytics metrics for dashboard', async () => {
            const res = await request(app)
                .get('/api/analytics/dashboard')
                .set('Authorization', `Bearer ${manufacturerToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.statusDistribution).to.be.an('array');
        });
    });
});

