// models/security-event.model.ts
import mongoose, { Schema, Types, Document } from "mongoose";

export interface ISecurityEvent extends Document {
  userId: Types.ObjectId;
  type: "PASSWORD_CHANGED" | "2FA_ENABLED" | "2FA_DISABLED" | "NEW_DEVICE_LOGIN";
  message: string;
  date: Date;
}

const schema = new Schema<ISecurityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SecurityEvent = mongoose.model<ISecurityEvent>("SecurityEvent", schema);
