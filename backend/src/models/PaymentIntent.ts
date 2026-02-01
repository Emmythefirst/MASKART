import mongoose, { Schema, Document } from 'mongoose';

interface PaymentIntentDocument extends Document {
  intentId: string;
  productId: string;
  buyerWallet?: string;
  amount: number;
  currency: string;
  recipientAddress: string;
  used: boolean;
  txSignature?: string;
  expiresAt: Date;
}

const PaymentIntentSchema = new Schema<PaymentIntentDocument>({
  intentId: { type: String, required: true, unique: true, index: true },
  productId: { type: String, required: true, index: true },
  buyerWallet: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'SOL' },
  recipientAddress: { type: String, required: true },
  used: { type: Boolean, default: false },
  txSignature: { type: String, index: true, sparse: true, unique: true },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

export default mongoose.model<PaymentIntentDocument>('PaymentIntent', PaymentIntentSchema);
