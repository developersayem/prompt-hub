import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILike extends Document {
  user: Types.ObjectId;
  prompt: Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: Schema.Types.ObjectId,
      ref: "Prompt",
      required: true,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model<ILike>("Like", likeSchema);
