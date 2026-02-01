import mongoose, { Schema, Document } from 'mongoose';

interface CardTransactionDocument extends Document {
  transactionId: string;
  cardOrderId: string; // Reference to CardOrder
  walletAddress: string;
  type: 'topup' | 'withdrawal' | 'purchase';
  merchant?: string;
  amount: number; // Positive for topup, negative for purchase/withdrawal
  status: 'completed' | 'failed' | 'pending';
  metadata?: {
    merchantCategory?: string;
    location?: string;
    starpayTxId?: string;
  };
  createdAt: Date;
}

const cardTransactionSchema = new Schema<CardTransactionDocument>({
  transactionId: { type: String, required: true, unique: true, index: true },
  cardOrderId: { type: String, required: true, index: true },
  walletAddress: { type: String, required: true, index: true },
  type: { type: String, enum: ['topup', 'withdrawal', 'purchase'], required: true },
  merchant: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'failed', 'pending'], default: 'pending' },
  metadata: {
    merchantCategory: String,
    location: String,
    starpayTxId: String
  }
}, { timestamps: true });

export default mongoose.model<CardTransactionDocument>('CardTransaction', cardTransactionSchema);