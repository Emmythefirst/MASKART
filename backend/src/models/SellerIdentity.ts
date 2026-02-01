import mongoose, { Schema, Document } from 'mongoose';

export interface SellerIdentityDocument extends Document {
  sellerId: string;
  walletAddress: string;
  reputationScore: number;
  stats: {
    completedOrders: number;
    unresolvedDisputes: number;
    createdAt: Date;
  };
  isActive: boolean;
}

const sellerIdentitySchema = new Schema<SellerIdentityDocument>({
  sellerId: { type: String, required: true, unique: true, index: true },
  walletAddress: { type: String, required: true, index: true },
  reputationScore: { type: Number, default: 50 },
  stats: {
    completedOrders: { type: Number, default: 0 },
    unresolvedDisputes: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });


export default mongoose.model<SellerIdentityDocument>('SellerIdentity', sellerIdentitySchema);
