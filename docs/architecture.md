# MediChain — System Architecture & Technical Design

## 1. System Overview
MediChain is an enterprise-grade pharmaceutical supply chain traceability platform. It leverages **Hyperledger Fabric 2.5** to create an immutable, distributed ledger that records the life cycle of every manufactured medicine batch.

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 18 / Vite / Tailwind)"]
        Landing["Landing Page /"]
        PublicVerify["Public QR Verification /verify/:id"]
        ExplorerUI["Blockchain Explorer /explorer"]
        Dashboards["Role Dashboards (Mfg, Dist, Ws, Rx, Admin)"]
    end

    subgraph Backend["Backend API Layer (Node.js / Express)"]
        AuthMid["JWT & RBAC Middleware"]
        Controllers["Controllers (Batch, Transfer, Verify, Explorer)"]
        SQLiteDB[("SQLite (App Users & Audit Cache)")]
        GatewaySvc["Fabric Gateway Service (gRPC / TLS)"]
    end

    subgraph Blockchain["Hyperledger Fabric 2.5 Infrastructure"]
        Channel["Channel: medichain-channel"]
        Orderer["Raft Ordering Service (orderer.example.com:7050)"]
        Peer1["Peer 0 Org1 (peer0.org1.example.com:7051)"]
        Peer2["Peer 0 Org2 (peer0.org2.example.com:9051)"]
        Chaincode["Chaincode: medichain (JavaScript Contract)"]
        WorldState[("LevelDB Distributed Ledger")]
    end

    Client -->|REST APIs / JSON| Backend
    Controllers --> SQLiteDB
    Controllers --> GatewaySvc
    GatewaySvc -->|gRPC TLS / Endorse & Submit| Peer1
    GatewaySvc -->|gRPC TLS / Endorse| Peer2
    Peer1 --> Chaincode
    Peer2 --> Chaincode
    Peer1 -->|Broadcast Transaction Proposal| Orderer
    Orderer -->|Deliver Blocks with Consensus| Peer1
    Orderer -->|Deliver Blocks with Consensus| Peer2
    Peer1 --> WorldState
    Peer2 --> WorldState
```

---

## 2. Supply Chain Two-Step Handover Workflow

```mermaid
sequenceDiagram
    autonumber
    actor CurrentOwner as Current Owner (e.g. Manufacturer)
    participant Backend as MediChain Backend API
    participant Gateway as Fabric Gateway SDK
    participant Fabric as Hyperledger Fabric Ledger
    actor TargetReceiver as Target Receiver (e.g. Distributor)

    CurrentOwner->>Backend: POST /api/transfers/:id/initiate (targetReceiver, targetRole)
    Backend->>Gateway: submitTransaction("TransferBatch", id, targetReceiver, role)
    Gateway->>Fabric: Endorse & Commit Block
    Fabric-->>Gateway: TxID committed, Status=IN_TRANSIT, pendingReceiver set
    Gateway-->>Backend: Success + Real TxID
    Backend-->>CurrentOwner: Handover initiated

    Note over Fabric,TargetReceiver: Medicine physically in transit via cold-chain carrier

    TargetReceiver->>Backend: POST /api/transfers/:id/receive (inspection notes)
    Backend->>Gateway: submitTransaction("ReceiveBatch", id, notes)
    Gateway->>Fabric: Endorse & Commit Block
    Fabric-->>Gateway: TxID committed, Status=RECEIVED, Ownership transferred
    Gateway-->>Backend: Success + Real TxID
    Backend-->>TargetReceiver: Ownership confirmed on blockchain
```

---

## 3. Blockchain Consensus & State Model

### Ledger Structure
Every medicine batch is represented as an asset key on the channel:
- Key: Unique Batch ID (e.g., `MED-2026-90412`)
- Value: JSON serialized `MedicineBatch` struct
- State Database: LevelDB embedded in each peer node

### Cryptographic Identities
- Identities are backed by X.509 PKI certificates generated via Fabric Cryptogen.
- Org1MSP and Org2MSP define the consortium trust boundaries.
- Fabric Gateway authenticates calls using User1 signcert and ECDSA private key.

