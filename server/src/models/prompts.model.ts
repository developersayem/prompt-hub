import mongoose, { Schema, Document, Types } from "mongoose";

export type ResultType = "text" | "image" | "video";
export type PaymentStatus = "free" | "paid";

export interface IPrompt extends Document {
  title: string;
  description?: string;
  tags: string[];
  category: string;
  promptText: string;
  resultType: ResultType;
  resultContent: string;
  aiModel: string;
  price?: number;
  paymentStatus: PaymentStatus;
  creator: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  views: number;
  viewedBy: mongoose.Types.ObjectId[];
  viewedIPs: string[];
  purchasedBy: mongoose.Types.ObjectId[];
}

const promptSchema = new Schema<IPrompt>(
  {
    title: { type: String, required: true },
    description: { type: String },
    tags: { type: [String], required: true },
    category: { type: String, required: true },
    promptText: { type: String, required: true },
    resultType: {
      type: String,
      enum: ["text", "image", "video"],
      required: true,
    },
    resultContent: { type: String, required: true },
    aiModel: { type: String, required: true },
    price: { type: Number },
    paymentStatus: {
      type: String,
      enum: ["free", "paid"],
      required: true,
      default: "free",
    },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    viewedIPs: [{ type: String }],
    purchasedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Prompt = mongoose.model<IPrompt>("Prompt", promptSchema);
