import mongoose, { Schema, Document, Types } from "mongoose";

export type TransactionType = 
  | "purchase_prompt"     // User buys a prompt
  | "sell_prompt"         // User earns from selling prompt
  | "buy_credits"         // User purchases credits
  | "referral_bonus"      // Referral reward
  | "signup_bonus"        // Welcome bonus
  | "admin_adjustment"    // Manual admin adjustment
  | "refund"              // Refund transaction
  | "withdrawal"          // Cash out credits
  | "expired"             // Credits expired

export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface ICreditTransaction extends Document {
  user: Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: TransactionStatus;
  description: string;
  metadata?: {
    promptId?: Types.ObjectId;
    referredUserId?: Types.ObjectId;
    paymentIntentId?: string;
    adminUserId?: Types.ObjectId;
    expirationDate?: Date;
    [key: string]: any;
  };
  expiresAt?: Date; // For credits that expire
  createdAt: Date;
  updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    type: {
      type: String,
      enum: [
        "purchase_prompt",
        "sell_prompt", 
        "buy_credits",
        "referral_bonus",
        "signup_bonus",
        "admin_adjustment",
        "refund",
        "withdrawal",
        "expired"
      ],
      required: true,
      index: true
    },
    amount: { 
      type: Number, 
      required: true 
    },
    balanceBefore: { 
      type: Number, 
      required: true 
    },
    balanceAfter: { 
      type: Number, 
      required: true 
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "completed",
      index: true
    },
    description: { 
      type: String, 
      required: true 
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 } // MongoDB TTL index
    }
  },
  { 
    timestamps: true
  }
);

// Add compound indexes for common queries
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ user: 1, type: 1 });
creditTransactionSchema.index({ status: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>(
  "CreditTransaction", 
  creditTransactionSchema
);