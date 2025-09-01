# Solana Presale Contract

## 🔧 Setup Solana CLI

### 1. ติดตั้ง Solana CLI (ผ่าน anza installer)
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

### 2. รันสคริปต์ setup (เพิ่ม PATH อัตโนมัติ)
```bash
chmod +x setup_solana.sh
./setup_solana.sh
```

### 3. ตรวจสอบว่าใช้งานได้
```bash
solana --version
solana config get
```

## 🗝️ การตั้งค่ากระเป๋า (Wallet Setup)

### กรณีที่ 1: สร้างกระเป๋าใหม่ (Devnet/Testnet/Mainnet ใช้เหมือนกัน)

```bash
# สร้าง keypair ใหม่
solana-keygen new --outfile ~/.config/solana/id.json

# ตรวจสอบ public key
solana-keygen pubkey ~/.config/solana/id.json

# ตั้งค่าให้ CLI ใช้ keypair นี้
solana config set --keypair ~/.config/solana/id.json
```

### กรณีที่ 2: มีกระเป๋าอยู่แล้ว (จาก Phantom, Solflare ฯลฯ)

#### 2.1 Export Private Key จากกระเป๋า
- Phantom / Solflare จะให้ Private Key (Base58 หรือ JSON)
- สำหรับ CLI จะต้องใช้ **รูปแบบ array ของ 64 ตัวเลข** (JSON array) เช่น:
```json
[12,99,54, ... ,87]
```
*(นี่คือ secret key array ของ Solana)*

⚠️ **ห้ามแชร์ไฟล์นี้กับใครเด็ดขาด**  
ถ้า private key รั่ว → เงินหายหมดทันที

#### 2.2 นำมาเก็บในไฟล์ id.json

**วิธีที่ 1: JSON Array (64 ตัวเลข)**
บันทึก private key array ที่ export มา → ใส่ไฟล์:
```bash
nano ~/.config/solana/id.json
```
วาง JSON array แล้วกด `Ctrl+O`, `Enter`, `Ctrl+X` เพื่อบันทึก

**วิธีที่ 2: Base58 String หรือ Seed Phrase**
หาก Phantom/Solflare ให้ Base58 string หรือ seed phrase:
```bash
solana-keygen recover "prompt://?full-path" --outfile ~/.config/solana/id.json
```
จากนั้นวาง Seed Phrase หรือ Private Key (Base58) ที่ได้มา → Solana CLI จะสร้าง id.json ให้ใช้งานได้เลย

#### 2.3 ตั้งค่าให้ CLI ใช้กระเป๋านี้
```bash
solana config set --keypair ~/.config/solana/id.json
solana-keygen pubkey ~/.config/solana/id.json
```

## 🌐 เลือก Cluster (Network)

### 🔹 Devnet (สำหรับทดสอบ)
```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
solana balance
```

### 🔹 Testnet (สำหรับทดสอบเครือข่ายจริง แต่ไม่มี airdrop)
```bash
solana config set --url https://api.testnet.solana.com
```

### 🔹 Mainnet (สำหรับใช้งานจริง)
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

### ตรวจสอบ config ปัจจุบัน:
```bash
solana config get
```

## ✅ ตัวอย่าง Workflow

### Devnet
```bash
solana config set --url https://api.devnet.solana.com
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2
solana balance
```

### Mainnet (ใช้กระเป๋าที่มีอยู่แล้ว)
```bash
# สร้างไฟล์ keypair จาก private key JSON array
nano ~/.config/solana/id.json

# ตั้งค่า CLI ให้ใช้กระเป๋านี้
solana config set --keypair ~/.config/solana/id.json

# ชี้ไปที่ mainnet
solana config set --url https://api.mainnet-beta.solana.com

# ตรวจสอบ balance
solana balance
```

## 🧾 Mainnet Deployment Checklist

⚠️ **ก่อน Deploy ไป Mainnet ให้ตรวจสอบขั้นตอนต่อไปนี้:**

### 1. ตรวจสอบ Balance และ Configuration
```bash
# ตรวจสอบ balance (ต้องมีพอสำหรับค่า deploy)
solana balance

# ตรวจสอบว่า config ชี้ไป mainnet
solana config get
# ต้องแสดง: RPC URL: https://api.mainnet-beta.solana.com

# ตรวจสอบ wallet address
solana address
```

### 2. ทดสอบบน Devnet ก่อน
```bash
# Deploy และทดสอบบน devnet ก่อน
solana config set --url https://api.devnet.solana.com
yarn run build-deploy:devnet
yarn run check:devnet

# ถ้าทุกอย่างทำงานได้ดี จึงไป mainnet
solana config set --url https://api.mainnet-beta.solana.com
```

### 3. Update Program ID หลัง Deploy ครั้งแรก
หลังจาก deploy สำเร็จ ให้เอา Program ID ที่ได้มาอัพเดตใน:

**Anchor.toml:**
```toml
[programs.mainnet]
presale_contract_solana = "YOUR_NEW_PROGRAM_ID_HERE"
```

**programs/presale_contract_solana/src/lib.rs:**
```rust
declare_id!("YOUR_NEW_PROGRAM_ID_HERE");
```

### 4. Build และ Deploy ใหม่
```bash
# Build ใหม่หลังอัพเดต Program ID
anchor build

# Deploy ใหม่
anchor deploy --provider.cluster mainnet-beta
```

### 5. ตรวจสอบผลลัพธ์
```bash
# ตรวจสอบว่า deploy สำเร็จ
yarn run check:mainnet

# ดูใน Explorer
# https://explorer.solana.com/address/YOUR_PROGRAM_ID
```

## 🚀 การ Deploy Contract

### วิธีที่ 1: ใช้ Anchor CLI (แนะนำ)

#### 1. ติดตั้ง Anchor
```bash
# ติดตั้ง Rust ก่อน (ถ้ายังไม่มี)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# ติดตั้ง Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

#### 2. Build และ Deploy
```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta
```

### วิธีที่ 2: ใช้ Script อัตโนมัติ (แนะนำสำหรับมือใหม่)

#### 1. ให้สิทธิ์ execute script
```bash
chmod +x scripts/build-and-deploy.sh
```

#### 2. Deploy to Devnet
```bash
./scripts/build-and-deploy.sh --network devnet
```

#### 3. Deploy to Mainnet
```bash
./scripts/build-and-deploy.sh --network mainnet
```

#### 4. ตัวเลือกเพิ่มเติม
```bash
# Skip build step
./scripts/build-and-deploy.sh --network devnet --skip-build

# Skip tests
./scripts/build-and-deploy.sh --network devnet --skip-test

# Show help
./scripts/build-and-deploy.sh --help
```

### วิธีที่ 3: ใช้ Node.js Scripts

#### Deploy และตรวจสอบ
```bash
# Deploy to devnet
node scripts/deploy.js devnet

# Deploy to mainnet
node scripts/deploy.js mainnet
```

### วิธีที่ 4: ใช้ NPM/Yarn Scripts (แนะนำ)

#### ตรวจสอบการตั้งค่า
```bash
yarn run verify
# หรือ
npm run verify
```

#### Deploy
```bash
# Deploy to devnet
yarn run deploy:devnet

# Deploy to mainnet  
yarn run deploy:mainnet

# Build และ deploy ในคำสั่งเดียว
yarn run build-deploy:devnet
yarn run build-deploy:mainnet
```

## 🔍 การตรวจสอบผลลัพธ์

### 1. ตรวจสอบสถานะ Program
```bash
# ตรวจสอบ devnet
node scripts/check-results.js devnet

# ตรวจสอบ mainnet
node scripts/check-results.js mainnet
```

### 2. ตรวจสอบ Transaction เฉพาะ
```bash
# ตรวจสอบ transaction signature
node scripts/check-results.js devnet <TRANSACTION_SIGNATURE>
```

### 3. ใช้ Anchor Test
```bash
# Run tests on localnet
anchor test

# Run tests on devnet
anchor test --provider.cluster devnet
```

### 4. ใช้ NPM/Yarn Scripts
```bash
# ตรวจสอบ devnet
yarn run check:devnet

# ตรวจสอบ mainnet
yarn run check:mainnet

# ตรวจสอบ testnet
yarn run check:testnet
```

### 5. ตรวจสอบผ่าน Solana CLI
```bash
# ดู program account
solana account <PROGRAM_ID>

# ดู transaction
solana confirm <TRANSACTION_SIGNATURE>

# ดู recent transactions
solana transaction-history <WALLET_ADDRESS>
```

## 🔗 Explorer Links

### Devnet
- **Solana Explorer**: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
- **Solscan**: `https://solscan.io/account/<PROGRAM_ID>?cluster=devnet`

### Mainnet
- **Solana Explorer**: `https://explorer.solana.com/address/<PROGRAM_ID>`
- **Solscan**: `https://solscan.io/account/<PROGRAM_ID>`

## 📁 โครงสร้างไฟล์

```
presale_contract_solana/
├── programs/
│   └── presale_contract_solana/
│       └── src/
│           └── lib.rs              # Smart contract code
├── tests/
│   └── presale_contract_solana.ts  # Test files
├── scripts/
│   ├── deploy.js                   # Deployment script
│   ├── check-results.js            # Result checking script
│   └── build-and-deploy.sh         # Automated build & deploy
├── deployments/                    # Deployment info (auto-generated)
│   ├── devnet.json
│   ├── testnet.json
│   └── mainnet.json
├── Anchor.toml                     # Anchor configuration
├── package.json                    # Node.js dependencies
└── setup_solana.sh                 # Solana CLI setup script
```

## 🛠️ การพัฒนา

### 1. แก้ไข Smart Contract
```bash
# แก้ไขไฟล์
nano programs/presale_contract_solana/src/lib.rs

# Build ใหม่
anchor build

# Test
anchor test
```

### 2. แก้ไข Tests
```bash
# แก้ไขไฟล์
nano tests/presale_contract_solana.ts

# Run tests
anchor test
```

### 3. Update Program ID
หลัง deploy ครั้งแรก ให้อัพเดท Program ID ใน:
- `Anchor.toml`
- `programs/presale_contract_solana/src/lib.rs` (declare_id!)

## ⚠️ ข้อควรระวัง

1. **Mainnet Deployment**: ใช้เงินจริง ตรวจสอบให้ดีก่อน deploy
2. **Private Key Security**: ห้ามแชร์ private key เด็ดขาด
3. **Gas Fees**: Mainnet มีค่าธรรมเนียม ตรวจสอบ balance ก่อน
4. **Testing**: ทดสอบบน devnet ก่อนเสมอ
5. **Backup**: สำรอง keypair และ program ID

## 🆘 Troubleshooting

### Program Deploy Failed
```bash
# ตรวจสอบ balance
solana balance

# ตรวจสอบ config
solana config get

# ลอง airdrop (devnet only)
solana airdrop 2
```

### Transaction Failed
```bash
# ตรวจสอบ transaction
node scripts/check-results.js devnet <TX_SIGNATURE>

# ดู logs
solana logs <PROGRAM_ID>
```

### Build Error
```bash
# Clean และ build ใหม่
anchor clean
anchor build

# ตรวจสอบ Rust version
rustc --version
