import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from '../types/index.js';

export interface OrderDocument extends IOrder, Document {}

const orderSchema = new Schema<OrderDocument>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  storeId: {
    type: String,
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    index: true
  },
  buyerWalletHash: {
    type: String,
    required: true
  },
  txSignature: {
    type: String,
    required: true,
    unique: true
  },
  escrowTx: {
    type: String
  },
  escrowLockedAt: { type: Date },
  fileAvailableAt: { type: Date },
  releaseAt: { type: Date },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'delivered', 'failed'],
    default: 'pending'
  },
  escrowState: {
    type: String,
    enum: ['ESCROW_LOCKED', 'FILE_AVAILABLE', 'ESCROW_RELEASED', 'DISPUTE_OPEN'],
    default: 'ESCROW_LOCKED'
  },
  disputeStatus: {
    type: String,
    enum: ['none', 'open', 'resolved'],
    default: 'none'
  },
  disputeReason: {
    type: String,
    maxlength: 500
  },
  disputeOpenedAt: {
    type: Date
  },
  downloadToken: {
    type: String,
    unique: true,
    sparse: true
  },
  downloadedAt: {
    type: Date
  },
  // Proof-of-delivery: encrypted key stored off-chain (IPFS CID)
  encryptedKeyCid: {
    type: String
  },
  keyReleased: {
    type: Boolean,
    default: false
  },
  keyReleasedAt: { type: Date },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ buyerWalletHash: 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<OrderDocument>('Order', orderSchema);