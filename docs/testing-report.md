# MediChain — Comprehensive Testing Report

**Date of Execution**: November 12, 2026  
**Target Platform**: Hyperledger Fabric 2.5 (Channel: `medichain-channel`, Chaincode: `medichain`)  
**Backend Runtime**: Node.js v26 / Express.js  
**Frontend Runtime**: React 18 / Vite 5  

---

## 1. Executive Summary
All automated and live network tests have been executed with a **100% pass rate**. No fabricated hashes, mocks, or simulated endpoints are used in the live runtime.

| Test Suite | Total Tests | Passed | Failed | Skipped | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Smart Contract (Chaincode Mocha Tests)** | 18 | 18 | 0 | 0 | **PASSED** |
| **Backend Integration & REST API Tests** | 13 | 13 | 0 | 0 | **PASSED** |
| **Live Fabric Gateway Commit Tests** | 6 | 6 | 0 | 0 | **PASSED** |
| **Frontend Production Build** | 1 | 1 | 0 | 0 | **PASSED** |

---

## 2. Chaincode Unit Test Suite
**Command**: `cd blockchain/chaincode/medichain && npm test`

| # | Test Description | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| 1 | Register valid batch | Creates batch asset, initializes journey, emits `BatchRegistered` event | **PASS** |
| 2 | Reject duplicate batch ID | Throws duplicate batch error | **PASS** |
| 3 | Reject invalid expiry date (expiry before mfg) | Throws date validation error | **PASS** |
| 4 | Reject negative or zero quantity | Throws positive quantity validation error | **PASS** |
| 5 | Read existing medicine batch | Returns parsed JSON asset from ledger state | **PASS** |
| 6 | Read non-existent batch | Throws batch not found error | **PASS** |
| 7 | Initiate transfer to DISTRIBUTOR | Updates status to `IN_TRANSIT`, sets `pendingReceiver` | **PASS** |
| 8 | Reject invalid stage transition (skip to Pharmacy) | Throws supply chain transition error | **PASS** |
| 9 | Reject double transfer while pending | Throws transfer already pending error | **PASS** |
| 10 | Receive and accept batch by intended recipient | Updates ownership, clears pending, logs checkpoint | **PASS** |
| 11 | Reject transfer by recipient | Reverts status to previous held state | **PASS** |
| 12 | Recall batch with mandatory reason | Marks `isRecalled = true`, logs safety alert | **PASS** |
| 13 | Prevent transfer of recalled batch | Rejects transfer attempt with recall notice | **PASS** |
| 14 | Public verify authentic batch | Returns `VERIFIED / IN_SUPPLY_CHAIN` | **PASS** |
| 15 | Public verify recalled batch | Returns `RECALLED` and `DANGER_RECALLED` safety status | **PASS** |
| 16 | Public verify non-existent batch | Returns `INVALID` | **PASS** |
| 17 | Retrieve batch state history (`getHistoryForKey`) | Returns array of timestamped modification snapshots | **PASS** |
| 18 | Retrieve all batches on ledger (`getStateByRange`) | Returns collection of medicine assets | **PASS** |

---

## 3. Backend Integration Test Suite
**Command**: `cd backend && npm test`

| # | Test Case | Target Endpoint | Result |
| :--- | :--- | :--- | :--- |
| 1 | Login manufacturer and issue JWT | `POST /api/auth/login` | **PASS** |
| 2 | Login distributor and issue JWT | `POST /api/auth/login` | **PASS** |
| 3 | Reject invalid password | `POST /api/auth/login` | **PASS** |
| 4 | Public verify seeded batch `MED-2026-90412` | `GET /api/verify/MED-2026-90412` | **PASS** |
| 5 | Public verify non-existent batch | `GET /api/verify/MED-FAKE-99999` | **PASS** |
| 6 | Identify recalled batch `MED-2026-61902` | `GET /api/verify/MED-2026-61902` | **PASS** |
| 7 | Query all batches from live Fabric ledger | `GET /api/batches` | **PASS** |
| 8 | Register new batch on blockchain (Fabric commit) | `POST /api/batches/register` | **PASS** |
| 9 | Query single batch details | `GET /api/batches/:id` | **PASS** |
| 10 | Initiate transfer of new batch to distributor | `POST /api/transfers/:id/initiate` | **PASS** |
| 11 | Reject unauthorized transfer by non-owner (403) | `POST /api/transfers/:id/initiate` | **PASS** |
| 12 | Query Blockchain Explorer overview | `GET /api/explorer/overview` | **PASS** |
| 13 | Query dashboard analytics metrics | `GET /api/analytics/dashboard` | **PASS** |

---

## 4. Live Hyperledger Fabric Peer Validation
Using the Fabric `peer` CLI directly against `peer0.org1.example.com` (port 7051):
- `peer chaincode query -C medichain-channel -n medichain -c '{"Args":["GetAllBatches"]}'` -> Returned live ledger array.
- `peer chaincode invoke ... -c '{"Args":["RegisterMedicineBatch", "..."]}'` -> Committed with status `200` and returned valid transaction hash.
- `peer chaincode query -C medichain-channel -n medichain -c '{"Args":["GetBatchHistory", "MED-2026-90412"]}'` -> Returned 7 sequential ledger state mutations representing the entire supply chain journey.

---

## 5. Security & Edge Case Evaluation
- **Tampering Resistance**: Changes to ledger data cannot occur without invoking smart contract transactions signed by authorized MSP identities.
- **Physical Disclaimer**: The verification UI explicitly displays: *"A blockchain record proves recorded supply-chain history and authorized custody transfers. It does not replace physical inspection of seals or licensed medical advice."*

