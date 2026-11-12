'use strict';

require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./config/database');
const fabricGateway = require('./services/fabricGateway');

const PORT = process.env.PORT || 5001;

async function startServer() {
    try {
        console.log('==================================================');
        console.log('       MEDICHAIN BACKEND INITIALIZATION           ');
        console.log('==================================================');

        // 1. Initialize SQLite Database
        console.log('1. Initializing SQLite application database...');
        await initDatabase();
        console.log('✓ SQLite database initialized successfully.');

        // 2. Connect to Hyperledger Fabric Gateway
        console.log('2. Connecting to Hyperledger Fabric Gateway...');
        try {
            await fabricGateway.connectGateway();
            console.log('✓ Connected to Hyperledger Fabric peer0.org1 on channel "medichain-channel".');
        } catch (fabricErr) {
            console.warn('⚠️ WARNING: Initial Fabric Gateway connection failed.');
            console.warn(`Reason: ${fabricErr.message}`);
            console.warn('Backend will continue running. Fabric will reconnect automatically when network becomes available.');
        }

        // 3. Start Express Server
        app.listen(PORT, () => {
            console.log(`✓ MediChain API Server running on port ${PORT}`);
            console.log(`  Health Check: http://localhost:${PORT}/api/health`);
            console.log(`  Explorer API: http://localhost:${PORT}/api/explorer/overview`);
            console.log('==================================================');
        });
    } catch (err) {
        console.error('Fatal Server Startup Error:', err);
        process.exit(1);
    }
}

startServer();

