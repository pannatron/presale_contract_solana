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

async function checkResults(network = 'devnet', txSignature = null) {
  console.log(`🔍 Checking results on ${network}...`);
  
  try {
    // Set up connection
    const connection = new anchor.web3.Connection(NETWORKS[network], 'confirmed');
    const wallet = anchor.Wallet.local();
    
    console.log(`📡 Connected to ${network}`);
    console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);
    
    // Load deployment info if exists
    const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
    let deploymentInfo = null;
    
    if (fs.existsSync(deploymentPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      console.log(`📋 Program ID: ${deploymentInfo.programId}`);
      console.log(`📅 Deployed at: ${deploymentInfo.deployedAt}`);
    }
    
    // Check specific transaction if provided
    if (txSignature) {
      console.log(`\n🔍 Checking transaction: ${txSignature}`);
      
      try {
        const txInfo = await connection.getTransaction(txSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (txInfo) {
          console.log('✅ Transaction found!');
          console.log(`📊 Slot: ${txInfo.slot}`);
          console.log(`⏰ Block time: ${new Date(txInfo.blockTime * 1000).toISOString()}`);
          console.log(`💰 Fee: ${txInfo.meta.fee / anchor.web3.LAMPORTS_PER_SOL} SOL`);
          console.log(`✅ Success: ${txInfo.meta.err === null ? 'Yes' : 'No'}`);
          
          if (txInfo.meta.err) {
            console.log(`❌ Error: ${JSON.stringify(txInfo.meta.err)}`);
          }
          
          // Show logs
          if (txInfo.meta.logMessages && txInfo.meta.logMessages.length > 0) {
            console.log('\n📝 Transaction logs:');
            txInfo.meta.logMessages.forEach((log, index) => {
              console.log(`  ${index + 1}. ${log}`);
            });
          }
          
          // Show account changes
          if (txInfo.meta.preBalances && txInfo.meta.postBalances) {
            console.log('\n💰 Balance changes:');
            txInfo.transaction.message.accountKeys.forEach((account, index) => {
              const preBalance = txInfo.meta.preBalances[index];
              const postBalance = txInfo.meta.postBalances[index];
              const change = postBalance - preBalance;
              
              if (change !== 0) {
                console.log(`  ${account.toString()}: ${change / anchor.web3.LAMPORTS_PER_SOL} SOL`);
              }
            });
          }
          
        } else {
          console.log('❌ Transaction not found');
        }
        
      } catch (error) {
        console.log(`❌ Error checking transaction: ${error.message}`);
      }
    }
    
    // Check program status if deployment info exists
    if (deploymentInfo) {
      console.log('\n🔍 Checking program status...');
      const programId = new anchor.web3.PublicKey(deploymentInfo.programId);
      
      try {
        const programInfo = await connection.getAccountInfo(programId);
        
        if (programInfo) {
          console.log('✅ Program is deployed and active');
          console.log(`📊 Data length: ${programInfo.data.length} bytes`);
          console.log(`👤 Owner: ${programInfo.owner.toString()}`);
          console.log(`💰 Rent: ${programInfo.lamports / anchor.web3.LAMPORTS_PER_SOL} SOL`);
          console.log(`🔄 Executable: ${programInfo.executable ? 'Yes' : 'No'}`);
        } else {
          console.log('❌ Program not found on network');
        }
        
      } catch (error) {
        console.log(`❌ Error checking program: ${error.message}`);
      }
    }
    
    // Check wallet balance
    console.log('\n💰 Current wallet balance:');
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`  ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    
    // Get recent transactions for this wallet
    console.log('\n📋 Recent transactions (last 10):');
    try {
      const signatures = await connection.getSignaturesForAddress(
        wallet.publicKey,
        { limit: 10 }
      );
      
      if (signatures.length > 0) {
        for (const sig of signatures) {
          const status = sig.err ? '❌' : '✅';
          const time = new Date(sig.blockTime * 1000).toLocaleString();
          console.log(`  ${status} ${sig.signature} (${time})`);
        }
      } else {
        console.log('  No recent transactions found');
      }
      
    } catch (error) {
      console.log(`  Error fetching transactions: ${error.message}`);
    }
    
    // Network status
    console.log('\n🌐 Network status:');
    try {
      const health = await connection.getHealth();
      console.log(`  Health: ${health}`);
      
      const version = await connection.getVersion();
      console.log(`  Version: ${version['solana-core']}`);
      
      const slot = await connection.getSlot();
      console.log(`  Current slot: ${slot}`);
      
    } catch (error) {
      console.log(`  Error checking network status: ${error.message}`);
    }
    
    console.log('\n🎉 Results check complete!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// CLI usage
const network = process.argv[2] || 'devnet';
const txSignature = process.argv[3] || null;

if (!NETWORKS[network]) {
  console.error(`❌ Invalid network: ${network}`);
  console.log('Available networks:', Object.keys(NETWORKS).join(', '));
  console.log('Usage: node check-results.js <network> [transaction-signature]');
  process.exit(1);
}

checkResults(network, txSignature);
