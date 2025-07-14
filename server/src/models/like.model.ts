import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILike extends Document {
  user: Types.ObjectId;
  prompt?: Types.ObjectId;
  comment?: Types.ObjectId;
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
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, prompt: 1 }, { unique: true });

export const Like = mongoose.model<ILike>("Like", likeSchema);
