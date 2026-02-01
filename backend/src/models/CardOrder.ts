// backend/src/models/CardOrder.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ICardOrder extends Document {
  orderId: string;
  walletAddress?: string;
  amount: number;
  cardType: 'visa' | 'mastercard';
  email: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  paymentAddress: string;
  amountSol: number;
  transactionSignature?: string;
  cardDetails?: {
    number: string;
    cvv: string;
    expiry: string;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cardOrderSchema = new Schema<ICardOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: false,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 5,
    max: 10000
  },
  cardType: {
    type: String,
    enum: ['visa', 'mastercard'],
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
    default: 'pending',
    index: true
  },
  paymentAddress: {
    type: String,
    required: true
  },
  amountSol: {
    type: Number,
    required: true
  },
  transactionSignature: {
    type: String,
    sparse: true
  },
  cardDetails: {
    number: String,
    cvv: String,
    expiry: String
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
cardOrderSchema.index({ email: 1, status: 1 });
cardOrderSchema.index({ createdAt: -1 });
cardOrderSchema.index({ expiresAt: 1 });

export default mongoose.model<ICardOrder>('CardOrder', cardOrderSchema);