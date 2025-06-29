// models/comment.model.ts
import { Schema, Types, model, models } from "mongoose";


interface IComment {
  user: Types.ObjectId;
  prompt: Types.ObjectId;
  text: string;
  replies: Types.ObjectId[];
  parentComment?: Types.ObjectId | null;
  likes: Types.ObjectId[];
}

const commentSchema = new Schema<IComment>(
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
    text: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  {
    timestamps: true,
  }
);


export const Comment = models.Comment || model<IComment>("Comment", commentSchema);
