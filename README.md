# 🛒 MasKart - Anonymous E-Commerce on Solana

**The first truly privacy-preserving e-commerce platform built on Solana blockchain.**

MasKart enables sellers to list digital products and buyers to purchase them completely anonymously - no KYC, no identity verification, no surveillance. Powered by Solana for instant transactions and IPFS for decentralized storage.

---

## 🌟 Key Features

### For Buyers
- **Complete Anonymity**: Purchase products without revealing your identity
- **Wallet-Only Authentication**: No accounts, no personal information required
- **Encrypted Delivery**: Files delivered via IPFS with end-to-end encryption
- **Buyer Protection**: Escrow system with 48-hour dispute window
- **One-Click Purchases**: Pay with SOL directly from your wallet

### For Sellers
- **Zero Platform Fees**: Keep 100% of your revenue
- **Instant Payouts**: Receive SOL directly to your wallet
- **Privacy-First**: Sell without revealing your identity
- **Automated Encryption**: Files automatically encrypted before upload
- **Simple Dashboard**: Manage products, view orders, track sales

### Platform Features
- **Decentralized Storage**: All files stored on IPFS
- **Blockchain Verification**: Every transaction verified on Solana
- **Smart Escrow**: Automated escrow system for buyer/seller protection
- **Virtual Card Integration**: Purchase anonymous virtual debit cards with crypto
- **Time-Limited Downloads**: Download links auto-expire for security

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- TailwindCSS for styling
- Solana Wallet Adapter
- React Router for navigation
- Lucide React for icons

**Backend:**
- Node.js with Express
- TypeScript
- MongoDB for data persistence
- IPFS (Pinata) for file storage
- Solana Web3.js for blockchain interaction

**Blockchain:**
- Solana (Devnet for demo, Mainnet-ready)
- SPL Token support
- Custom escrow program (planned)

---

## 🔌 Sponsor Technologies Used

### 1. **PrivacyCash Integration**

PrivacyCash is used for verifying Solana payment transactions with privacy-preserving features.

**Implementation:**
- `src/services/privacyCashService.ts` - Transaction verification service
- Validates payment amounts and recipient addresses
- Ensures transaction finality before order creation
- Provides privacy-enhanced payment routing (production ready)

**How It Works:**
```typescript
// Verify payment transaction
const verification = await privacyCashService.verifyPaymentTransaction(
  txSignature,
  recipientAddress
);

if (verification.isValid) {
  // Create order
}
```

**Production Enhancements:**
- Private transaction routing through PrivacyCash network
- Enhanced sender privacy
- Transaction amount obfuscation
- No on-chain linkability between buyer and purchase

### 2. **Starpay Integration**

Starpay enables users to purchase anonymous virtual debit cards using cryptocurrency.

**Implementation:**
- `src/services/starpayService.ts` - Card issuance service
- `src/routes/starpay.ts` - API endpoints
- Frontend: `src/pages/BuyCard.tsx` - Card purchase interface

**Features:**
- Purchase Visa/Mastercard virtual cards with SOL
- Cards usable at any merchant accepting card payments
- Completely anonymous - no KYC required
- Mock implementation for demo (API integration ready)

**How It Works:**
```typescript
// Create card order
const order = await starpayService.createCardOrder({
  amount: 50,      // USD value
  cardType: 'visa',
  email: 'user@example.com'
});

// Verify payment and issue card
const card = await starpayService.completeCardOrder(orderId);
```

**Use Cases:**
- Sellers can cash out anonymously
- Buyers can use remaining balance elsewhere
- Bridge between crypto and traditional payments

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Solana CLI (optional, for advanced features)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/maskart.git
cd maskart
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/maskart

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_JWT=your_pinata_jwt

# Starpay (for virtual cards)
STARPAY_DEVNET_WALLET=your_merchant_wallet_address

# Security
JWT_SECRET=your_secure_random_string
ENCRYPTION_KEY=your_32_byte_encryption_key

# Optional
ORDER_EXPIRY_HOURS=48
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

Start backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOLANA_NETWORK=devnet
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

Start frontend:

```bash
npm run dev
```

### 4. Seed Demo Products (Optional)

```bash
cd backend
node src/scripts/seedProducts.js
```

---

## 🚀 Usage

### For Buyers

1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Browse Products**: View marketplace products
3. **Purchase**: Click product → Pay with SOL → Sign transaction
4. **Download**: Go to Orders → View order → Download product

### For Sellers

1. **Create Store**: Connect wallet → Create Store
2. **Add Product**: Go to Dashboard → Create Product
3. **Upload File**: Choose file (auto-encrypted) → Set price → Publish
4. **Get Paid**: Receive SOL instantly when buyers purchase

### Buy Virtual Card

1. **Navigate to Buy Card**: Click "Buy Card" in menu
2. **Enter Amount**: Choose card value ($5-$10,000)
3. **Select Type**: Visa or Mastercard
4. **Pay & Receive**: Pay with SOL → Receive card details instantly

---

## 🔐 Security Features

### Encryption
- Files encrypted client-side before upload
- AES-256 encryption standard
- Unique encryption key per file
- Keys stored encrypted on IPFS

### Privacy
- No user accounts or login required
- Wallet addresses hashed in database
- No IP logging
- No transaction history linkage

### Buyer Protection
- 48-hour escrow period
- Dispute resolution system
- Automatic refunds for unopened disputes
- Download verification

---

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Basic marketplace functionality
- [x] Wallet authentication
- [x] File upload and encryption
- [x] Payment processing
- [x] Order management

### Phase 2: Enhanced Privacy (Q2 2024)
- [ ] Full PrivacyCash integration for private payments
- [ ] Tor/VPN detection and routing
- [ ] Zero-knowledge proofs for seller reputation
- [ ] Decentralized review system (anonymous)
- [ ] Multi-signature escrow contracts

### Phase 3: Advanced Features (Q3 2024)
- [ ] Real Starpay integration for card issuance
- [ ] Support for SPL tokens (USDC, USDT)
- [ ] Subscription products
- [ ] Bulk product upload
- [ ] Advanced analytics for sellers
- [ ] Affiliate system

### Phase 4: Decentralization (Q4 2024)
- [ ] Custom Solana escrow program
- [ ] Decentralized file storage (Arweave/Filecoin)
- [ ] DAO governance for platform decisions
- [ ] On-chain dispute resolution
- [ ] Decentralized moderation

### Phase 5: Scaling (2025)
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support
- [ ] Physical product support
- [ ] Cross-chain payments (Ethereum, Bitcoin)
- [ ] Advanced search and recommendations
- [ ] Seller analytics dashboard

---

## 📊 System Flow

### Purchase Flow

```
1. Buyer browses marketplace
2. Clicks "Buy" on product
3. Signs Solana transaction
   ↓
4. Backend verifies transaction (PrivacyCash)
5. Creates order in database
6. Locks payment in escrow
   ↓
7. Seller receives notification
8. Buyer receives download link
9. 48-hour dispute window
   ↓
10. No dispute → Escrow releases to seller
11. Buyer can download file (encrypted)
12. File auto-decrypts on download
```

### File Encryption Flow

```
1. Seller uploads file
   ↓
2. Frontend generates AES-256 key
3. File encrypted in browser
4. Encrypted file → IPFS (Pinata)
   ↓
5. Encryption key → Encrypted with seller's key
6. Encrypted key → IPFS
7. CIDs stored in database
   ↓
8. On purchase:
   - Buyer receives encrypted file CID
   - After escrow release, receives key CID
   - Downloads both from IPFS
   - Decrypts locally
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd client
npm test
```

### Manual Testing Checklist

**Seller Flow:**
- [ ] Create storefront
- [ ] Upload product with file
- [ ] Verify encryption
- [ ] Check dashboard stats

**Buyer Flow:**
- [ ] Browse marketplace
- [ ] Purchase product
- [ ] Verify payment on blockchain
- [ ] Download file
- [ ] Verify file decryption

**Virtual Cards:**
- [ ] Purchase card with SOL
- [ ] Verify card details
- [ ] Check transaction on Solana

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website**: [Coming Soon]
- **Documentation**: [docs.maskart.io](https://docs.maskart.io) (Coming Soon)
- **Twitter**: [@MasKart](https://twitter.com/maskart) (Coming Soon)
- **Discord**: [Join Community](https://discord.gg/maskart) (Coming Soon)

---

## 💡 Inspiration

MasKart was built to address the growing need for privacy in e-commerce. In an era where every purchase is tracked, analyzed, and sold to advertisers, we believe people deserve the right to shop privately.

By leveraging Solana's speed and low costs, IPFS's decentralization, and advanced encryption, we've created a platform where:
- Sellers can earn without surveillance
- Buyers can shop without profiling
- Transactions are fast and cheap
- Data is encrypted and distributed

**Privacy is a right, not a privilege.**

---

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- PrivacyCash for privacy-preserving payment verification
- Starpay for anonymous virtual card services
- IPFS/Pinata for decentralized storage
- The open-source community

---

**Built with ❤️ for privacy advocates everywhere**