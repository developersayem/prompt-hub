// models/ConnectedDevice.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IConnectedDevice extends Document {
    userId: Types.ObjectId;
    ip: string;
    userAgent: string;
    deviceName: string;
    os: string;
    browser: string;
    location: string;
    isCurrent: boolean;
    lastActive: Date;
    sessionToken?: string; // For force logout functionality
    deviceFingerprint: string; // Unique device identifier
    isActive: boolean; // Track if device session is still active
    loginCount: number; // Track how many times this device has been used
}

const connectedDeviceSchema = new Schema<IConnectedDevice>(
  {
   userId: { 
     type: Schema.Types.ObjectId, 
     ref: "User", 
     required: true,
     index: true 
   },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    deviceName: { type: String, required: true },
    os: { type: String, required: true },
    browser: { type: String, required: true },
    location: { type: String, default: "Unknown" },
    isCurrent: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    sessionToken: { type: String }, // For tracking active sessions
    deviceFingerprint: { 
      type: String, 
      required: true,
      index: true 
    },
    isActive: { type: Boolean, default: true },
    loginCount: { type: Number, default: 1 }
  },
  { 
    timestamps: true
  }
);

// Schema-level indexes (no duplicates)
connectedDeviceSchema.index({ userId: 1, lastActive: -1 });
connectedDeviceSchema.index({ userId: 1, isActive: 1 });
connectedDeviceSchema.index({ userId: 1, deviceFingerprint: 1 });

export const ConnectedDevice = model<IConnectedDevice>("ConnectedDevice", connectedDeviceSchema);