# MediChain — Faculty 5-to-8 Minute Demonstration Script

This document provides a step-by-step walkthrough designed specifically for university faculty, project evaluators, and viva voce examiners to prove genuine Hyperledger Fabric blockchain integration.

---

## 🎯 Demonstration Objective
Demonstrate how MediChain establishes an immutable, permissioned pharmaceutical supply chain with:
1. Genuine Hyperledger Fabric 2.5 blockchain consensus and smart contracts (`medichain`).
2. Two-step cryptographic ownership handover (Manufacturer → Distributor → Wholesaler → Pharmacy).
3. Public QR code anti-counterfeit verification with full ledger provenance.
4. Tamper-evident batch recalls and unauthorized transaction rejections.

---

## 🔑 Demo Access Credentials

| Role | Username | Password | Organization | Fabric MSP |
| :--- | :--- | :--- | :--- | :--- |
| **Manufacturer** | `manufacturer` | `Password@123` | PharmaCorp Labs | `Org1MSP` |
| **Distributor** | `distributor` | `Password@123` | LogiCare Pharma Distribution | `Org2MSP` |
| **Wholesaler** | `wholesaler` | `Password@123` | MedSupply Global Logistics | `Org2MSP` |
| **Pharmacy** | `pharmacy` | `Password@123` | CarePlus Pharmacy Network | `Org1MSP` |
| **Consortium Admin**| `admin` | `Password@123` | MediChain Consortium | `Org1MSP` |

> **Pro-Tip**: The login page (`http://localhost:3000/login`) features a **"Faculty 1-Click Fast Switch"** panel. You can simply click any role card to immediately authenticate and test that dashboard without manual typing!

---

## ⏱️ Step-by-Step Demonstration Flow (5–8 Minutes)

### Step 1: Open Application & Network Status (Minute 1)
1. Open your browser and navigate to **`http://localhost:3000`**.
2. Point out the top navigation pill: **`Fabric 2.5: medichain-channel (ONLINE)`** with a green pulsing indicator.
3. Show the live ledger metrics on the landing page (Batches, Block Commits, Participating MSPs).

### Step 2: Login as Manufacturer & Register a New Medicine Batch (Minute 2)
1. Navigate to `/login` or click **"Participant Portal"**.
2. Click **"PharmaCorp Labs (Manufacturer)"** from the 1-Click Switch panel.
3. Click the **"Register New Batch"** button.
4. Fill in:
   - **Medicine Name**: `Ciprofloxacin 500mg`
   - **Generic Name**: `Ciprofloxacin Hydrochloride`
   - **Quantity**: `5000` (Boxes)
5. Click **"Commit to Blockchain"**.
6. **Academic High Point**: Notice the real-time block confirmation and the automatic popup showing the generated **Batch QR Code** and verifiable URL!

### Step 3: Initiate Transfer to Distributor (Minute 3)
1. In the Manufacturer table, find the newly registered batch (status: `Manufactured`).
2. Click **"Transfer to Distributor"**.
3. Confirm recipient is `LogiCare Pharma Distribution` and click **"Dispatch Transfer"**.
4. The batch status changes to **`IN_TRANSIT`**, with pending receiver set on the distributed ledger.

### Step 4: Login as Distributor & Accept Transfer (Minute 4)
1. Click **"Sign Out"** or visit `/login`.
2. Click **"LogiCare Pharma (Distributor)"**.
3. In the **"Incoming Transfers"** tab, see the batch waiting for handover.
4. Click **"Accept Transfer"**.
5. The transaction commits to Hyperledger Fabric: ownership shifts to `LogiCare Pharma Distribution`.
6. Switch to **"Warehouse Inventory"**, click **"Transfer to Wholesaler"**, and dispatch to `MedSupply Global Logistics`.

### Step 5: Wholesaler & Pharmacy Progression (Minute 5)
1. Log in as **"MedSupply Global (Wholesaler)"** → Accept consignment in Incoming tab → Transfer to `CarePlus Pharmacy Network`.
2. Log in as **"CarePlus Pharmacy (Pharmacy)"** → Accept incoming delivery.
3. In the Pharmacy Stock table, click **"Mark Available for Sale"**.
4. Status changes to **`AVAILABLE_FOR_SALE`**!

### Step 6: Public Customer QR Verification (Minute 6)
1. Open the public verification page: **`http://localhost:3000/verify`** (No login required!).
2. Search for the batch or click demo batch **`MED-2026-90412`** (Paracetamol).
3. Point out:
   - **Authenticity Banner**: `VERIFIED AUTHENTIC & SAFE`.
   - **4-Stage Checklist**: Manufacturer → Distributor → Wholesaler → Pharmacy all checked.
   - **Cryptographic Journey Timeline**: Complete historical trace with real Fabric transaction IDs, actor organizations, and timestamps.
4. Test counter-examples using the demo buttons:
   - **`MED-2026-61902`**: Shows prominent **SAFETY RECALL ALERT** (Recalled on ledger).
   - **`MED-2024-11002`**: Shows **EXPIRED MEDICINE WARNING**.
   - **`MED-FAKE-99999`**: Shows **UNVERIFIED / COUNTERFEIT WARNING**.

### Step 7: Blockchain Explorer & Audit Proof (Minute 7)
1. Navigate to **`http://localhost:3000/explorer`**.
2. Show the evaluator:
   - Live Peer nodes (`peer0.org1:7051`, `peer0.org2:9051`, `orderer:7050`).
   - The **Committed Ledger Transactions** table displaying the cryptographic SHA-256 transaction IDs for every action performed during the demo.
   - Click the **"History"** button on any batch to view the raw state modification snapshots retrieved via Fabric's `getHistoryForKey` API.

---

## 🛠️ Quick Reset Utility
To reset the demonstration environment to a clean slate before or after a presentation:
```bash
npm run network:reset
# or
bash blockchain/network/scripts/resetDemo.sh
```
This restarts the network, redeploys the chaincode, and re-seeds the standard demo dataset in under 90 seconds.

