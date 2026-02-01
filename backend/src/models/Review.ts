import mongoose, { Schema, Document } from 'mongoose';

interface ReviewDocument extends Document {
  reviewId: string;
  orderId: string;
  productId: string;
  sellerId: string;
  reviewerHash: string;
  rating: number;
  commentHash?: string;
  isVerifiedPurchase: boolean;
}

const reviewSchema = new Schema<ReviewDocument>({
  reviewId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  sellerId: { type: String, required: true, index: true },
  reviewerHash: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  commentHash: { type: String },
  isVerifiedPurchase: { type: Boolean, default: false }
}, { timestamps: true });

// Reviews are immutable by design: no update routes provided and we avoid storing raw text.
export default mongoose.model<ReviewDocument>('Review', reviewSchema);
