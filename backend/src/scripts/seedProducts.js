// Simple seed script - Run with: node src/scripts/seedProducts.js
// Save to: backend/src/scripts/seedProducts.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';

dotenv.config();

const DEMO_PRODUCTS = [
  {
    title: 'Ultimate JavaScript Course 2024',
    description: 'Complete modern JavaScript course from beginner to advanced. Includes ES6+, async/await, promises, and more.',
    category: 'ebook',
    price: 1.5,
  },
  {
    title: 'Photoshop Mastery Bundle',
    description: 'Professional photo editing templates, brushes, and presets for Adobe Photoshop. 100+ premium assets.',
    category: 'template',
    price: 2.0,
  },
  {
    title: 'Web3 Development Starter Kit',
    description: 'Complete Solana dApp development course with React. Build your first NFT marketplace.',
    category: 'course',
    price: 3.5,
  },
  {
    title: 'Crypto Trading Signals Bot',
    description: 'Automated trading bot with Python source code. Includes backtesting and risk management.',
    category: 'software',
    price: 5.0,
  },
  {
    title: 'NFT Collection Generator',
    description: 'Generate unique NFT collections with customizable traits. Includes Solidity smart contracts.',
    category: 'software',
    price: 4.0,
  },
  {
    title: 'Landing Page Templates (10 Pack)',
    description: 'Modern, responsive landing page templates. HTML, CSS, and React versions included.',
    category: 'template',
    price: 1.8,
  },
  {
    title: 'AI Prompts for ChatGPT (500+)',
    description: 'Massive collection of optimized prompts for ChatGPT, covering business, coding, writing, and more.',
    category: 'ebook',
    price: 0.5,
  },
  {
    title: 'Mobile App UI Kit - Dark Mode',
    description: 'Premium mobile UI kit with 50+ screens. Figma and Sketch files included.',
    category: 'template',
    price: 2.5,
  },
  {
    title: 'Blockchain Security Guide',
    description: 'Complete guide to smart contract security. Includes auditing checklists and tools.',
    category: 'ebook',
    price: 1.2,
  },
  {
    title: 'Social Media Content Calendar',
    description: 'Ready-to-use content calendar with 365 post ideas. Perfect for businesses and influencers.',
    category: 'template',
    price: 0.8,
  },
  {
    title: 'Full-Stack Developer Roadmap 2024',
    description: 'Interactive roadmap with resources for becoming a full-stack developer. Covers MERN, Next.js, and more.',
    category: 'course',
    price: 1.0,
  },
  {
    title: 'E-commerce Store Template (React)',
    description: 'Complete e-commerce storefront with cart, checkout, and payment integration. Fully responsive.',
    category: 'template',
    price: 3.0,
  },
];

// Product Schema (inline)
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  storeId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'SOL' },
  category: { type: String, required: true },
  fileName: { type: String, default: 'product-file.zip' },
  fileType: { type: String, default: 'application/zip' },
  fileSize: { type: Number, default: 1000000 },
  coverImage: { type: String, default: 'bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly' },
  encryptedFileHash: { type: String, default: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku' },
  isActive: { type: Boolean, default: true },
  stats: {
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const storefrontSchema = new mongoose.Schema({
  storeId: { type: String, required: true, unique: true },
  storeName: String,
  walletAddress: String
});

async function seedProducts() {
  try {
    console.log('🚀 Starting seed process...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ghost-commerce';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get models
    const Product = mongoose.model('Product', productSchema);
    const Storefront = mongoose.model('Storefront', storefrontSchema);

    // Get or create demo storefront
    let storefront = await Storefront.findOne({});
    
    if (!storefront) {
      console.log('❌ No storefront found!');
      console.log('📌 Please:');
      console.log('   1. Open the app');
      console.log('   2. Connect your wallet');
      console.log('   3. Create a store');
      console.log('   4. Then run this script again\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found storefront: "${storefront.storeName}"\n`);

    // Clear existing products (optional)
    const deleteResult = await Product.deleteMany({ storeId: storefront.storeId });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing products\n`);

    // Create demo products
    console.log('📦 Creating products...\n');
    
    for (const productData of DEMO_PRODUCTS) {
      const product = await Product.create({
        productId: `product_${uuid()}`,
        storeId: storefront.storeId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: 'SOL',
        category: productData.category,
        fileName: `${productData.title.toLowerCase().replace(/\s+/g, '-')}.zip`,
        fileType: 'application/zip',
        fileSize: Math.floor(Math.random() * 5000000) + 500000,
        coverImage: 'bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly',
        encryptedFileHash: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
        isActive: true,
        stats: {
          views: Math.floor(Math.random() * 1000),
          sales: Math.floor(Math.random() * 50),
          revenue: 0
        }
      });

      console.log(`   ✅ ${product.title} - ${product.price} SOL`);
    }

    console.log(`\n🎉 Successfully seeded ${DEMO_PRODUCTS.length} products!\n`);
    console.log('You can now see them in your marketplace.\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed error:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run the seed
seedProducts();