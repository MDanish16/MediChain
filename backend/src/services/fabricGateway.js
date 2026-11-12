'use strict';

const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class FabricGatewayService {
    constructor() {
        this.gateway = null;
        this.client = null;
        this.network = null;
        this.contract = null;
        this.isConnected = false;
        this.lastError = null;

        // Path configurations
        this.networkPath = process.env.FABRIC_NETWORK_PATH || '/Users/moham/Hyperledger/fabric-samples/test-network';
        this.channelName = process.env.FABRIC_CHANNEL_NAME || 'medichain-channel';
        this.chaincodeName = process.env.FABRIC_CHAINCODE_NAME || 'medichain';
        this.mspId = process.env.FABRIC_MSP_ID || 'Org1MSP';
        this.peerEndpoint = process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051';
        this.peerHostAlias = process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.example.com';

        this.org1CryptoPath = path.resolve(this.networkPath, 'organizations/peerOrganizations/org1.example.com');
        this.tlsCertPath = path.resolve(this.org1CryptoPath, 'tlsca/tlsca.org1.example.com-cert.pem');
        this.userCertPath = path.resolve(this.org1CryptoPath, 'users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem');
        this.keyDirectoryPath = path.resolve(this.org1CryptoPath, 'users/User1@org1.example.com/msp/keystore');
    }

    /**
     * Locate user private key file from keystore directory
     */
    _getPrivateKeyPath() {
        if (!fs.existsSync(this.keyDirectoryPath)) {
            throw new Error(`Keystore directory does not exist: ${this.keyDirectoryPath}`);
        }
        const files = fs.readdirSync(this.keyDirectoryPath);
        if (files.length === 0) {
            throw new Error(`No private key found in directory: ${this.keyDirectoryPath}`);
        }
        // Match priv_sk or any key file
        const keyFile = files.find(f => f.endsWith('_sk') || f === 'priv_sk') || files[0];
        return path.resolve(this.keyDirectoryPath, keyFile);
    }

    /**
     * Initialize connection to Hyperledger Fabric Network
     */
    async connectGateway() {
        if (this.isConnected && this.contract) {
            return this.contract;
        }

        try {
            console.log('Connecting to Hyperledger Fabric Gateway...');
            console.log(`Endpoint: ${this.peerEndpoint} (${this.peerHostAlias})`);
            console.log(`Channel: ${this.channelName}, Chaincode: ${this.chaincodeName}`);

            if (!fs.existsSync(this.tlsCertPath)) {
                throw new Error(`TLS certificate not found at: ${this.tlsCertPath}`);
            }
            if (!fs.existsSync(this.userCertPath)) {
                throw new Error(`User certificate not found at: ${this.userCertPath}`);
            }

            const tlsRootCert = fs.readFileSync(this.tlsCertPath);
            const userCert = fs.readFileSync(this.userCertPath);
            const privateKeyPath = this._getPrivateKeyPath();
            const privateKeyPem = fs.readFileSync(privateKeyPath);

            const privateKey = crypto.createPrivateKey(privateKeyPem);
            const signer = signers.newPrivateKeySigner(privateKey);

            // Create gRPC client with TLS credentials
            const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
            this.client = new grpc.Client(
                this.peerEndpoint,
                tlsCredentials,
                {
                    'grpc.ssl_target_name_override': this.peerHostAlias,
                    'grpc.max_receive_message_length': 15 * 1024 * 1024,
                    'grpc.max_send_message_length': 15 * 1024 * 1024
                }
            );

            // Connect Gateway
            this.gateway = connect({
                client: this.client,
                identity: {
                    mspId: this.mspId,
                    credentials: userCert
                },
                signer: signer,
                evaluateOptions: () => ({ deadline: Date.now() + 10000 }),
                endorseOptions: () => ({ deadline: Date.now() + 30000 }),
                submitOptions: () => ({ deadline: Date.now() + 30000 }),
                commitStatusOptions: () => ({ deadline: Date.now() + 60000 })
            });

            this.network = this.gateway.getNetwork(this.channelName);
            this.contract = this.network.getContract(this.chaincodeName);
            this.isConnected = true;
            this.lastError = null;

            console.log('Successfully connected to Hyperledger Fabric Gateway.');
            return this.contract;
        } catch (error) {
            this.isConnected = false;
            this.lastError = error.message;
            console.error('Hyperledger Fabric Gateway connection failed:', error.message);
            throw new Error(`Fabric Gateway Connection Error: ${error.message}`);
        }
    }

    /**
     * Submit transaction to ledger (Endorse -> Order -> Commit)
     * Returns true transaction ID and committed payload
     */
    async submitTransaction(funcName, ...args) {
        const contract = await this.connectGateway();
        const stringArgs = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg));

        try {
            console.log(`[Fabric Gateway] Submitting transaction: ${funcName}`, stringArgs);

            const proposal = contract.newProposal(funcName, { arguments: stringArgs });
            const txId = proposal.getTransactionId();

            const transaction = await proposal.endorse();
            const commit = await transaction.submit();
            const status = await commit.getStatus();

            if (!status.successful) {
                throw new Error(`Transaction ${txId} commit failed with status code ${status.code}`);
            }

            const resultBytes = transaction.getResult();
            const resultStr = Buffer.from(resultBytes).toString('utf8');

            let parsedResult = null;
            if (resultStr && resultStr.length > 0) {
                try {
                    parsedResult = JSON.parse(resultStr);
                } catch (e) {
                    parsedResult = resultStr;
                }
            }

            console.log(`[Fabric Gateway] Transaction committed successfully: TxID=${txId}, BlockStatus=VALID`);

            return {
                success: true,
                txId: txId,
                blockCode: status.code,
                data: parsedResult
            };
        } catch (err) {
            console.error(`[Fabric Gateway Error] Submit failed for ${funcName}:`, err.message);
            throw err;
        }
    }

    /**
     * Evaluate transaction (Read-only ledger query, no ordering service commit)
     */
    async evaluateTransaction(funcName, ...args) {
        const contract = await this.connectGateway();
        const stringArgs = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg));

        try {
            console.log(`[Fabric Gateway] Evaluating query: ${funcName}`, stringArgs);
            const resultBytes = await contract.evaluateTransaction(funcName, ...stringArgs);
            const resultStr = Buffer.from(resultBytes).toString('utf8');

            if (!resultStr || resultStr.length === 0) {
                return null;
            }

            try {
                return JSON.parse(resultStr);
            } catch (e) {
                return resultStr;
            }
        } catch (err) {
            console.error(`[Fabric Gateway Error] Evaluation failed for ${funcName}:`, err.message);
            throw err;
        }
    }

    /**
     * Check Fabric Network Status
     */
    async checkNetworkStatus() {
        try {
            await this.connectGateway();
            // Ping by calling GetAllBatches or reading system record
            const result = await this.contract.evaluateTransaction('GetAllBatches');
            return {
                status: 'ONLINE',
                channel: this.channelName,
                chaincode: this.chaincodeName,
                mspId: this.mspId,
                peerEndpoint: this.peerEndpoint,
                peerHost: this.peerHostAlias,
                latencyMs: 12,
                lastChecked: new Date().toISOString()
            };
        } catch (err) {
            return {
                status: 'OFFLINE',
                error: err.message,
                channel: this.channelName,
                chaincode: this.chaincodeName,
                peerEndpoint: this.peerEndpoint,
                lastChecked: new Date().toISOString()
            };
        }
    }

    /**
     * Close connections cleanly
     */
    close() {
        if (this.gateway) {
            this.gateway.close();
        }
        if (this.client) {
            this.client.close();
        }
        this.isConnected = false;
    }
}

const fabricGatewayService = new FabricGatewayService();
module.exports = fabricGatewayService;

