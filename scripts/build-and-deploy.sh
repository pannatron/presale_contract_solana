#!/usr/bin/env bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NETWORK="devnet"
SKIP_BUILD=false
SKIP_TEST=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--network)
      NETWORK="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-test)
      SKIP_TEST=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -n, --network NETWORK    Target network (localnet, devnet, testnet, mainnet)"
      echo "  --skip-build            Skip the build step"
      echo "  --skip-test             Skip the test step"
      echo "  -h, --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 Starting build and deployment process...${NC}"
echo -e "${BLUE}📡 Target network: ${NETWORK}${NC}"

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
    echo -e "${YELLOW}💡 Run: sh -c \"\$(curl -sSfL https://release.anza.xyz/stable/install)\"${NC}"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install it first.${NC}"
    echo -e "${YELLOW}💡 Run: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force${NC}"
    exit 1
fi

# Set Solana config for the target network
echo -e "${BLUE}⚙️  Configuring Solana CLI...${NC}"
case $NETWORK in
  localnet)
    solana config set --url http://127.0.0.1:8899
    ;;
  devnet)
    solana config set --url https://api.devnet.solana.com
    ;;
  testnet)
    solana config set --url https://api.testnet.solana.com
    ;;
  mainnet)
    solana config set --url https://api.mainnet-beta.solana.com
    ;;
  *)
    echo -e "${RED}❌ Invalid network: $NETWORK${NC}"
    echo -e "${YELLOW}Available networks: localnet, devnet, testnet, mainnet${NC}"
    exit 1
    ;;
esac

# Show current config
echo -e "${BLUE}📋 Current Solana configuration:${NC}"
solana config get

# Check wallet balance
echo -e "${BLUE}💰 Checking wallet balance...${NC}"
BALANCE=$(solana balance --lamports)
BALANCE_SOL=$(echo "scale=4; $BALANCE / 1000000000" | bc -l)
echo -e "${GREEN}Balance: $BALANCE_SOL SOL${NC}"

# Check if we have enough SOL for deployment
MIN_BALANCE=100000000  # 0.1 SOL in lamports
if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo -e "${YELLOW}⚠️  Low balance detected!${NC}"
    if [ "$NETWORK" = "devnet" ]; then
        echo -e "${YELLOW}💡 Getting airdrop...${NC}"
        solana airdrop 2
        echo -e "${GREEN}✅ Airdrop completed${NC}"
    else
        echo -e "${RED}❌ Insufficient balance for deployment on $NETWORK${NC}"
        exit 1
    fi
fi

# Build the program
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}🔨 Building the program...${NC}"
    anchor build
    echo -e "${GREEN}✅ Build completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping build step${NC}"
fi

# Run tests (only for localnet/devnet)
if [ "$SKIP_TEST" = false ] && [ "$NETWORK" != "mainnet" ]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Start local validator if testing on localnet
    if [ "$NETWORK" = "localnet" ]; then
        echo -e "${BLUE}🏃 Starting local validator...${NC}"
        solana-test-validator --reset &
        VALIDATOR_PID=$!
        sleep 5  # Wait for validator to start
        
        # Ensure we kill the validator on exit
        trap "kill $VALIDATOR_PID 2>/dev/null || true" EXIT
    fi
    
    anchor test --skip-local-validator
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping tests${NC}"
fi

# Deploy the program
echo -e "${BLUE}🚀 Deploying to $NETWORK...${NC}"
anchor deploy --provider.cluster $NETWORK

# Get program ID
PROGRAM_ID=$(anchor keys list | grep "presale_contract_solana" | awk '{print $2}')
echo -e "${GREEN}📋 Program ID: $PROGRAM_ID${NC}"

# Create deployments directory if it doesn't exist
mkdir -p deployments

# Save deployment info
cat > "deployments/${NETWORK}.json" << EOF
{
  "network": "$NETWORK",
  "programId": "$PROGRAM_ID",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "wallet": "$(solana address)",
  "rpcUrl": "$(solana config get | grep "RPC URL" | awk '{print $3}')"
}
EOF

echo -e "${GREEN}📝 Deployment info saved to deployments/${NETWORK}.json${NC}"

# Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
node scripts/deploy.js $NETWORK

# Show explorer link
case $NETWORK in
  localnet)
    echo -e "${GREEN}🔗 Local explorer: http://localhost:3000/address/$PROGRAM_ID${NC}"
    ;;
  *)
    echo -e "${GREEN}🔗 Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=$NETWORK${NC}"
    ;;
esac

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}  • Check results: node scripts/check-results.js $NETWORK${NC}"
echo -e "${BLUE}  • Run tests: anchor test${NC}"
echo -e "${BLUE}  • View on explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=$NETWORK${NC}"
