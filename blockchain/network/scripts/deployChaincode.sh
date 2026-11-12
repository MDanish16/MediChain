#!/usr/bin/env bash
# MediChain - Chaincode Deployment Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
TEST_NETWORK_DIR="/Users/moham/Hyperledger/fabric-samples/test-network"
CHAINCODE_SRC="${PROJECT_ROOT}/blockchain/chaincode/medichain"
FABRIC_CC_DEST="/Users/moham/Hyperledger/fabric-samples/chaincode-medichain"
CHANNEL_NAME="medichain-channel"
CC_NAME="medichain"
VERSION="${1:-1.0}"
SEQUENCE="${2:-1}"

echo "=========================================================="
echo " Deploying MediChain Chaincode"
echo " Channel: ${CHANNEL_NAME}"
echo " Chaincode: ${CC_NAME} (v${VERSION}, seq ${SEQUENCE})"
echo "=========================================================="

mkdir -p "${FABRIC_CC_DEST}"
cp -r "${CHAINCODE_SRC}/"* "${FABRIC_CC_DEST}/"

cd "${TEST_NETWORK_DIR}"
./network.sh deployCC -c "${CHANNEL_NAME}" -ccn "${CC_NAME}" -ccp ../chaincode-medichain -ccl javascript -ccv "${VERSION}" -ccs "${SEQUENCE}"

echo "=========================================================="
echo " Chaincode '${CC_NAME}' successfully deployed on channel '${CHANNEL_NAME}'!"
echo "=========================================================="

