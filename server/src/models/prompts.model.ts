import mongoose, { Schema, Document, Types } from "mongoose";

export type ResultType = "text" | "image" | "video";

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
  isPaid: boolean;
  creator: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  buyers: Types.ObjectId[];
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
    isPaid: { type: Boolean, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    buyers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Prompt = mongoose.model<IPrompt>("Prompt", promptSchema);
