'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const MediChainContract = require('../lib/medichain-contract');

describe('MediChain Smart Contract Tests', () => {
    let contract;
    let ctx;
    let mockStub;
    let mockClientIdentity;
    let ledgerState;

    beforeEach(() => {
        contract = new MediChainContract();
        ledgerState = {};

        mockStub = {
            getState: sinon.stub().callsFake(async (key) => {
                const val = ledgerState[key];
                return val ? Buffer.from(val) : Buffer.from('');
            }),
            putState: sinon.stub().callsFake(async (key, value) => {
                ledgerState[key] = value.toString('utf8');
            }),
            setEvent: sinon.stub(),
            getTxTimestamp: sinon.stub().returns({
                seconds: { low: 1773400000 },
                nanos: 0
            }),
            getTxID: sinon.stub().returns('tx_sample_1234567890abcdef'),
            getHistoryForKey: sinon.stub().callsFake(async (key) => {
                const history = [
                    {
                        txId: 'tx_init_111',
                        timestamp: { seconds: { low: 1773400000 }, nanos: 0 },
                        isDelete: false,
                        value: Buffer.from(ledgerState[key] || '{}')
                    }
                ];
                let index = 0;
                return {
                    next: async () => {
                        if (index < history.length) {
                            return { value: history[index++], done: false };
                        }
                        return { done: true };
                    },
                    close: async () => {}
                };
            }),
            getStateByRange: sinon.stub().callsFake(async () => {
                const keys = Object.keys(ledgerState);
                const entries = keys.map(k => ({
                    key: k,
                    value: Buffer.from(ledgerState[k])
                }));
                let index = 0;
                return {
                    next: async () => {
                        if (index < entries.length) {
                            return { value: entries[index++], done: false };
                        }
                        return { done: true };
                    },
                    close: async () => {}
                };
            })
        };

        mockClientIdentity = {
            getMSPID: sinon.stub().returns('Org1MSP'),
            getID: sinon.stub().returns('x509::/C=US/ST=California/O=PharmaCorp/CN=manufacturerAdmin::/C=US/ST=California/O=PharmaCorp/CN=ca.org1'),
            getAttributeValue: sinon.stub().callsFake((attr) => {
                if (attr === 'role') return 'MANUFACTURER';
                return null;
            })
        };

        ctx = {
            stub: mockStub,
            clientIdentity: mockClientIdentity
        };
    });

    const sampleValidBatch = {
        batchId: 'MED-2026-001',
        medicineName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        manufacturer: 'PharmaCorp Labs',
        manufacturerMSP: 'Org1MSP',
        manufacturingDate: '2026-01-10',
        expiryDate: '2028-01-10',
        quantity: 5000,
        unit: 'Boxes (10 strips)',
        composition: 'Paracetamol 500mg',
        storageConditions: 'Store below 25°C',
        notes: 'Initial production batch'
    };

    describe('1. RegisterMedicineBatch', () => {
        it('should successfully register a valid medicine batch', async () => {
            const resultStr = await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            const result = JSON.parse(resultStr);

            expect(result.batchId).to.equal('MED-2026-001');
            expect(result.currentStatus).to.equal('MANUFACTURED');
            expect(result.currentOwner).to.equal('PharmaCorp Labs');
            expect(result.currentOwnerRole).to.equal('MANUFACTURER');
            expect(result.journey).to.have.lengthOf(1);
            expect(result.journey[0].stage).to.equal('MANUFACTURED');
            expect(mockStub.putState).to.have.been.calledWith('MED-2026-001');
            expect(mockStub.setEvent).to.have.been.calledWith('BatchRegistered');
        });

        it('should reject duplicate batch registration', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));

            try {
                await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
                expect.fail('Should have thrown an error for duplicate batch ID');
            } catch (err) {
                expect(err.message).to.include('already exists on the ledger');
            }
        });

        it('should reject invalid dates (expiry before manufacturing)', async () => {
            const invalidDates = {
                ...sampleValidBatch,
                batchId: 'MED-2026-INV-DATE',
                manufacturingDate: '2027-01-01',
                expiryDate: '2026-01-01'
            };

            try {
                await contract.RegisterMedicineBatch(ctx, JSON.stringify(invalidDates));
                expect.fail('Should have thrown validation error for dates');
            } catch (err) {
                expect(err.message).to.include('Expiry date');
            }
        });

        it('should reject negative or zero quantity', async () => {
            const invalidQty = {
                ...sampleValidBatch,
                batchId: 'MED-2026-INV-QTY',
                quantity: -50
            };

            try {
                await contract.RegisterMedicineBatch(ctx, JSON.stringify(invalidQty));
                expect.fail('Should have thrown validation error for quantity');
            } catch (err) {
                expect(err.message).to.include('Quantity must be a positive number');
            }
        });
    });

    describe('2. ReadMedicineBatch', () => {
        it('should read existing batch record', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            const fetchedStr = await contract.ReadMedicineBatch(ctx, 'MED-2026-001');
            const fetched = JSON.parse(fetchedStr);

            expect(fetched.batchId).to.equal('MED-2026-001');
            expect(fetched.medicineName).to.equal('Paracetamol 500mg');
        });

        it('should throw error if batch does not exist', async () => {
            try {
                await contract.ReadMedicineBatch(ctx, 'NON-EXISTENT-BATCH');
                expect.fail('Should have failed for non-existent batch');
            } catch (err) {
                expect(err.message).to.include('does not exist');
            }
        });
    });

    describe('3. TransferBatch & Supply Chain Transitions', () => {
        beforeEach(async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
        });

        it('should successfully initiate transfer to DISTRIBUTOR', async () => {
            const resStr = await contract.TransferBatch(ctx, 'MED-2026-001', 'LogiCare Pharma', 'DISTRIBUTOR', 'Shipping via cold-chain courier');
            const res = JSON.parse(resStr);

            expect(res.currentStatus).to.equal('IN_TRANSIT');
            expect(res.pendingReceiver).to.equal('LogiCare Pharma');
            expect(res.pendingReceiverRole).to.equal('DISTRIBUTOR');
            expect(res.journey).to.have.lengthOf(2);
        });

        it('should reject invalid transition (Manufacturer transferring directly to Pharmacy)', async () => {
            try {
                await contract.TransferBatch(ctx, 'MED-2026-001', 'CarePlus Pharmacy', 'PHARMACY', 'Direct skip');
                expect.fail('Should have prevented invalid supply chain stage skip');
            } catch (err) {
                expect(err.message).to.include('Manufacturer can only transfer to DISTRIBUTOR');
            }
        });

        it('should reject transfer while previous transfer is still pending', async () => {
            await contract.TransferBatch(ctx, 'MED-2026-001', 'LogiCare Pharma', 'DISTRIBUTOR', '1st attempt');

            try {
                await contract.TransferBatch(ctx, 'MED-2026-001', 'Another Distributor', 'DISTRIBUTOR', '2nd attempt');
                expect.fail('Should have rejected double transfer');
            } catch (err) {
                expect(err.message).to.include('already pending');
            }
        });
    });

    describe('4. ReceiveBatch and RejectTransfer', () => {
        beforeEach(async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            await contract.TransferBatch(ctx, 'MED-2026-001', 'LogiCare Pharma', 'DISTRIBUTOR', 'Dispatch');
        });

        it('should allow intended recipient to receive and accept batch', async () => {
            const resStr = await contract.ReceiveBatch(ctx, 'MED-2026-001', 'Package inspected and temperature verified intact');
            const res = JSON.parse(resStr);

            expect(res.currentOwner).to.equal('LogiCare Pharma');
            expect(res.currentOwnerRole).to.equal('DISTRIBUTOR');
            expect(res.currentStatus).to.equal('RECEIVED_BY_DISTRIBUTOR');
            expect(res.previousOwner).to.equal('PharmaCorp Labs');
            expect(res.pendingReceiver).to.equal('');
        });

        it('should allow recipient to reject transfer and restore batch to previous owner', async () => {
            const resStr = await contract.RejectTransfer(ctx, 'MED-2026-001', 'Temperature excursion detected during transport');
            const res = JSON.parse(resStr);

            expect(res.currentOwner).to.equal('PharmaCorp Labs');
            expect(res.currentStatus).to.equal('MANUFACTURED');
            expect(res.pendingReceiver).to.equal('');
        });
    });

    describe('5. RecallBatch', () => {
        beforeEach(async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
        });

        it('should allow authorized recall with reason', async () => {
            const resStr = await contract.RecallBatch(ctx, 'MED-2026-001', 'Packaging seal defect reported by QA lab');
            const res = JSON.parse(resStr);

            expect(res.isRecalled).to.be.true;
            expect(res.currentStatus).to.equal('RECALLED');
            expect(res.recallReason).to.equal('Packaging seal defect reported by QA lab');
        });

        it('should prevent transfer of recalled batch', async () => {
            await contract.RecallBatch(ctx, 'MED-2026-001', 'Contamination risk');

            try {
                await contract.TransferBatch(ctx, 'MED-2026-001', 'LogiCare Pharma', 'DISTRIBUTOR', 'Move');
                expect.fail('Should have blocked transfer of recalled batch');
            } catch (err) {
                expect(err.message).to.include('has been RECALLED');
            }
        });
    });

    describe('6. VerifyMedicine & Public Verification', () => {
        it('should verify genuine medicine batch and report correct safety status', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            const verifyStr = await contract.VerifyMedicine(ctx, 'MED-2026-001');
            const result = JSON.parse(verifyStr);

            expect(result.exists).to.be.true;
            expect(result.batchId).to.equal('MED-2026-001');
            expect(result.isRecalled).to.be.false;
            expect(result.verificationStatus).to.equal('IN_SUPPLY_CHAIN');
        });

        it('should flag recalled medicine as DANGER_RECALLED during public verification', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            await contract.RecallBatch(ctx, 'MED-2026-001', 'Active ingredient degradation');

            const verifyStr = await contract.VerifyMedicine(ctx, 'MED-2026-001');
            const result = JSON.parse(verifyStr);

            expect(result.exists).to.be.true;
            expect(result.isRecalled).to.be.true;
            expect(result.verificationStatus).to.equal('RECALLED');
            expect(result.safetyStatus).to.equal('DANGER_RECALLED');
            expect(result.message).to.include('DO NOT CONSUME');
        });

        it('should return INVALID for non-existent batch', async () => {
            const verifyStr = await contract.VerifyMedicine(ctx, 'FAKE-BATCH-999');
            const result = JSON.parse(verifyStr);

            expect(result.exists).to.be.false;
            expect(result.verificationStatus).to.equal('INVALID');
            expect(result.message).to.include('NOT FOUND');
        });
    });

    describe('7. History and Multi-batch Ledger Queries', () => {
        it('should return complete batch history', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            const historyStr = await contract.GetBatchHistory(ctx, 'MED-2026-001');
            const history = JSON.parse(historyStr);

            expect(history).to.be.an('array');
            expect(history).to.have.lengthOf.at.least(1);
            expect(history[0].txId).to.equal('tx_init_111');
        });

        it('should return all batches on ledger', async () => {
            await contract.RegisterMedicineBatch(ctx, JSON.stringify(sampleValidBatch));
            const batchesStr = await contract.GetAllBatches(ctx);
            const batches = JSON.parse(batchesStr);

            expect(batches).to.be.an('array');
            expect(batches).to.have.lengthOf(1);
            expect(batches[0].batchId).to.equal('MED-2026-001');
        });
    });
});
