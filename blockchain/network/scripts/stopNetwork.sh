#!/usr/bin/env bash
# MediChain - Hyperledger Fabric Network Teardown Script
set -e

TEST_NETWORK_DIR="/Users/moham/Hyperledger/fabric-samples/test-network"

echo "=========================================================="
echo " Stopping MediChain Hyperledger Fabric Network"
echo "=========================================================="

if [ -d "${TEST_NETWORK_DIR}" ]; then
    cd "${TEST_NETWORK_DIR}"
    ./network.sh down
fi

echo "=========================================================="
echo " Fabric Network containers and volumes stopped."
echo "=========================================================="

