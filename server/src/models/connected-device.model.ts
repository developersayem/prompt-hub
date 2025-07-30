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
}

const connectedDeviceSchema = new Schema<IConnectedDevice>(
  {
   userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ip: String,
    userAgent: String,
    deviceName: String,
    os: String,
    browser: String,
    location: String,
    isCurrent: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ConnectedDevice = model<IConnectedDevice>("ConnectedDevice", connectedDeviceSchema);

