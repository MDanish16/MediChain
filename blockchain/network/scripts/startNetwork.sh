#!/usr/bin/env bash
# MediChain - Hyperledger Fabric Network Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TEST_NETWORK_DIR="/Users/moham/Hyperledger/fabric-samples/test-network"
CHANNEL_NAME="medichain-channel"

echo "=========================================================="
echo " Starting MediChain Hyperledger Fabric Network"
echo " Channel: ${CHANNEL_NAME}"
echo "=========================================================="

if [ ! -d "${TEST_NETWORK_DIR}" ]; then
    echo "Error: test-network directory not found at ${TEST_NETWORK_DIR}"
    exit 1
fi

cd "${TEST_NETWORK_DIR}"
./network.sh up createChannel -c "${CHANNEL_NAME}"

echo "=========================================================="
echo " Fabric Network and Channel '${CHANNEL_NAME}' are ACTIVE!"
echo "=========================================================="

