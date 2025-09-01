const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Solana Presale Contract Setup...\n');

// Check if required commands exist
const requiredCommands = ['solana', 'anchor', 'node', 'yarn'];
const missingCommands = [];

console.log('📋 Checking required tools:');
requiredCommands.forEach(cmd => {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    console.log(`✅ ${cmd} - Found`);
  } catch (error) {
    console.log(`❌ ${cmd} - Not found`);
    missingCommands.push(cmd);
  }
});

if (missingCommands.length > 0) {
  console.log(`\n❌ Missing required tools: ${missingCommands.join(', ')}`);
  console.log('Please install them before proceeding.');
  process.exit(1);
}

// Check Solana configuration
console.log('\n🔧 Checking Solana configuration:');
try {
  const config = execSync('solana config get', { encoding: 'utf8' });
  console.log(config);
} catch (error) {
  console.log('❌ Failed to get Solana config');
  console.log('💡 Run: solana config set --url https://api.devnet.solana.com');
}

// Check wallet
console.log('👛 Checking wallet:');
try {
  const address = execSync('solana address', { encoding: 'utf8' }).trim();
  console.log(`✅ Wallet address: ${address}`);
  
  const balance = execSync('solana balance', { encoding: 'utf8' }).trim();
  console.log(`💰 Balance: ${balance}`);
} catch (error) {
  console.log('❌ No wallet configured');
  console.log('💡 Run: solana-keygen new --outfile ~/.config/solana/id.json');
}

// Check project structure
console.log('\n📁 Checking project structure:');
const requiredFiles = [
  'Anchor.toml',
  'package.json',
  'programs/presale_contract_solana/src/lib.rs',
  'tests/presale_contract_solana.ts',
  'scripts/deploy.js',
  'scripts/check-results.js',
  'scripts/build-and-deploy.sh'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n❌ Missing files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Check if scripts are executable
console.log('\n🔐 Checking script permissions:');
try {
  const stats = fs.statSync('scripts/build-and-deploy.sh');
  const isExecutable = !!(stats.mode & parseInt('111', 8));
  
  if (isExecutable) {
    console.log('✅ build-and-deploy.sh is executable');
  } else {
    console.log('⚠️  build-and-deploy.sh is not executable');
    console.log('💡 Run: chmod +x scripts/build-and-deploy.sh');
  }
} catch (error) {
  console.log('❌ Cannot check script permissions');
}

// Check dependencies
console.log('\n📦 Checking Node.js dependencies:');
try {
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules exists');
  } else {
    console.log('⚠️  node_modules not found');
    console.log('💡 Run: yarn install');
  }
} catch (error) {
  console.log('❌ Error checking dependencies');
}

// Test basic functionality
console.log('\n🧪 Testing basic functionality:');
try {
  // Test if we can load the IDL (after build)
  const idlPath = 'target/idl/presale_contract_solana.json';
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    console.log(`✅ IDL loaded - Program ID: ${idl.metadata.address}`);
  } else {
    console.log('⚠️  IDL not found (run anchor build first)');
  }
} catch (error) {
  console.log('⚠️  Cannot load IDL');
}

console.log('\n🎉 Setup verification complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure you have SOL in your wallet (run: solana airdrop 2 for devnet)');
console.log('2. Build the program: anchor build');
console.log('3. Deploy to devnet: yarn run build-deploy:devnet');
console.log('4. Check results: yarn run check:devnet');
console.log('\n🔗 Useful commands:');
console.log('• yarn run deploy:devnet     - Deploy to devnet');
console.log('• yarn run check:devnet      - Check deployment status');
console.log('• anchor test                - Run tests');
console.log('• solana logs <PROGRAM_ID>   - View program logs');
