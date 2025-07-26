import mongoose, { Schema, Document, Types } from "mongoose";
import slugify from "slugify";
import { customAlphabet } from "nanoid";

// 🔑 Nanoid setup for 8-character random string
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 8);

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
  isDraft: boolean;
  paymentStatus: PaymentStatus;
  creator: Types.ObjectId;
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  views: number;
  viewedBy: Types.ObjectId[];
  viewedIPs: string[];
  purchasedBy: Types.ObjectId[];
  slug: string;
  isPublic: boolean;
  shareCount: number;
  sharedBy: {
    users: Types.ObjectId[];
    ips: string[];
  };
  createdAt: Date;
  updatedAt: Date;
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
    isDraft: { type: Boolean, default: false },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    viewedIPs: [{ type: String }],
    purchasedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    shareCount: { type: Number, default: 0 },
    sharedBy: {
      users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
      ips: { type: [String], default: [] },
    },
    slug: {
      type: String,
      unique: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔁 Pre-save hook to generate unique slug using nanoid
promptSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    const randomStr = nanoid();
    this.slug = `${baseSlug}-${randomStr}`; // e.g. cool-title-3k7x9ab1
  }
  next();
});

export const Prompt = mongoose.model<IPrompt>("Prompt", promptSchema);
