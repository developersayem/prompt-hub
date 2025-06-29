// utils/populateRepliesRecursively.ts

import { Comment } from "../models/comments.model";

export const populateRepliesRecursively = async (comment: any) => {
  await Comment.populate(comment, {
    path: "user",
    select: "name avatar",
  });

  await Comment.populate(comment, {
    path: "replies",
    select: "text createdAt user replies likes",
  });

  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      await populateRepliesRecursively(reply);
    }
  }

  return comment;
};
