#!/usr/bin/env bash
# MediChain - Safe Demo Environment Reset Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TEST_NETWORK_DIR="/Users/moham/Hyperledger/fabric-samples/test-network"
CHANNEL_NAME="medichain-channel"

echo "=========================================================="
echo "          MEDICHAIN DEMO RESET UTILITY                    "
echo "=========================================================="
echo "WARNING: This will reset the Fabric ledger, tear down"
echo "containers, clear the application database, and re-deploy"
echo "the medichain chaincode for a fresh demonstration."
echo "=========================================================="

if [ "$1" != "--force" ]; then
    read -p "Are you sure you want to proceed with resetting? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Reset cancelled by user."
        exit 0
    fi
fi

echo "1. Stopping network and pruning containers..."
cd "${TEST_NETWORK_DIR}"
./network.sh down

echo "2. Re-starting network and creating channel '${CHANNEL_NAME}'..."
./network.sh up createChannel -c "${CHANNEL_NAME}"

echo "3. Copying fresh chaincode and deploying..."
mkdir -p /Users/moham/Hyperledger/fabric-samples/chaincode-medichain
cp -r "${PROJECT_ROOT}/blockchain/chaincode/medichain/"* /Users/moham/Hyperledger/fabric-samples/chaincode-medichain/
./network.sh deployCC -c "${CHANNEL_NAME}" -ccn medichain -ccp ../chaincode-medichain -ccl javascript -ccv 1.0 -ccs 1

echo "4. Removing backend database if present..."
rm -f "${PROJECT_ROOT}/backend/medichain.sqlite"

echo "5. Seeding initial demo batches via blockchain transactions..."
cd "${PROJECT_ROOT}/backend"
npm run seed || echo "Seeding script can be run once backend dependencies are installed."

echo "=========================================================="
echo " Demo environment successfully reset and ready!"
echo "=========================================================="

