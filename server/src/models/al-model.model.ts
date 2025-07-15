import mongoose, { Schema, Document } from "mongoose";

export interface IAiModel extends Document {
  name: string;
  isUserCreated?: boolean;
  creator?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AiModelSchema: Schema<IAiModel> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    isUserCreated: { type: Boolean, default: false },
    creator: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const AiModel = mongoose.model<IAiModel>("AiModel", AiModelSchema);
