import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types/index.js';

interface ProductDocument extends IProduct, Document {}

const productSchema = new Schema<ProductDocument>({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  storeId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['SOL', 'USDC'],
    default: 'SOL'
  },
  category: {
    type: String,
    enum: ['ebook', 'course', 'software', 'music', 'video', 'other'],
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  encryptedFileHash: {
    type: String,
    required: true
  },
  encryptedKey: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
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

// Indexes
productSchema.index({ storeId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

export default mongoose.model<ProductDocument>('Product', productSchema);