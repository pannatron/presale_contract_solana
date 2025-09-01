const anchor = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORKS = {
  localnet: 'http://127.0.0.1:8899',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
};

async function deploy(network = 'devnet') {
  console.log(`🚀 Starting deployment to ${network}...`);
  
  try {
    // Set up provider
    const connection = new anchor.web3.Connection(NETWORKS[network], 'confirmed');
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(provider);

    console.log(`📡 Connected to ${network}`);
    console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);
    
    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Wallet balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.1 * anchor.web3.LAMPORTS_PER_SOL) {
      console.log('⚠️  Low balance! You may need more SOL for deployment.');
      if (network === 'devnet') {
        console.log('💡 Run: solana airdrop 2');
      }
    }

    // Load program
    const idl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/presale_contract_solana.json'), 'utf8'));
    const programId = new anchor.web3.PublicKey(idl.metadata.address);
    
    console.log(`📋 Program ID: ${programId.toString()}`);
    
    // Check if program is already deployed
    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo) {
      console.log('✅ Program already deployed!');
      console.log(`📊 Program data length: ${programInfo.data.length} bytes`);
      console.log(`👤 Program owner: ${programInfo.owner.toString()}`);
    } else {
      console.log('❌ Program not found. Please deploy using: anchor deploy');
      return;
    }

    // Initialize program instance
    const program = new anchor.Program(idl, programId, provider);
    
    // Test program functionality
    console.log('\n🧪 Testing program functionality...');
    try {
      const tx = await program.methods.initialize().rpc();
      console.log(`✅ Initialize transaction: ${tx}`);
      
      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed');
      console.log('✅ Transaction confirmed!');
      
    } catch (error) {
      console.log('⚠️  Initialize test failed (this might be expected):', error.message);
    }

    console.log('\n🎉 Deployment verification complete!');
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${programId}?cluster=${network}`);
    
    // Save deployment info
    const deploymentInfo = {
      network,
      programId: programId.toString(),
      deployedAt: new Date().toISOString(),
      wallet: wallet.publicKey.toString(),
      rpcUrl: NETWORKS[network]
    };
    
    fs.writeFileSync(
      path.join(__dirname, `../deployments/${network}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`📝 Deployment info saved to deployments/${network}.json`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// CLI usage
const network = process.argv[2] || 'devnet';
if (!NETWORKS[network]) {
  console.error(`❌ Invalid network: ${network}`);
  console.log('Available networks:', Object.keys(NETWORKS).join(', '));
  process.exit(1);
}

deploy(network);
