import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPurchaseHistory extends Document {
  buyer: Types.ObjectId;
  prompt: Types.ObjectId;
  seller: Types.ObjectId;
  amount: number;
  paymentMethod: string; // e.g. 'credits', 'stripe', etc.
  purchasedAt: Date;
}

const purchaseHistorySchema = new Schema<IPurchaseHistory>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    prompt: { type: Schema.Types.ObjectId, ref: "Prompt", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "credits" },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PurchaseHistory = mongoose.model<IPurchaseHistory>("PurchaseHistory",purchaseHistorySchema);
