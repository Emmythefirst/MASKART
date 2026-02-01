import mongoose, { Schema, Document } from 'mongoose';
import { IStorefront } from '../types/index.js';

interface StorefrontDocument extends IStorefront, Document {}

const storefrontSchema = new Schema<StorefrontDocument>({
  storeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  storeName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  encryptedContactInfo: {
    type: String
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#8B5CF6'
    },
    logoUrl: String
  },
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalSales: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<StorefrontDocument>('Storefront', storefrontSchema);