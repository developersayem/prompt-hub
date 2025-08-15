import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFraudDetection extends Document {
  userId: Types.ObjectId;
  registrationIP: string;
  loginIPs: string[];
  deviceFingerprints: string[];
  riskScore: number;
  isFlagged: boolean;
  flaggedReason?: string;
  bonusClaimCount: number;
  suspiciousActivities: {
    type: string;
    description: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }[];
  relatedAccounts: Types.ObjectId[]; // Potentially linked accounts
  verificationLevel: 'none' | 'email' | 'phone' | 'document';
  createdAt: Date;
  updatedAt: Date;
}

const fraudDetectionSchema = new Schema<IFraudDetection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    registrationIP: {
      type: String,
      required: true,
      index: true
    },
    loginIPs: [{
      type: String,
      index: true
    }],
    deviceFingerprints: [{
      type: String,
      index: true
    }],
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flaggedReason: {
      type: String
    },
    bonusClaimCount: {
      type: Number,
      default: 0
    },
    suspiciousActivities: [{
      type: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      }
    }],
    relatedAccounts: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    verificationLevel: {
      type: String,
      enum: ['none', 'email', 'phone', 'document'],
      default: 'none'
    }
  },
  { 
    timestamps: true
  }
);

// Define indexes separately
fraudDetectionSchema.index({ registrationIP: 1, createdAt: -1 });
fraudDetectionSchema.index({ riskScore: -1, isFlagged: 1 });
fraudDetectionSchema.index({ userId: 1, bonusClaimCount: -1 });

export const FraudDetection = mongoose.model<IFraudDetection>(
  "FraudDetection", 
  fraudDetectionSchema
);