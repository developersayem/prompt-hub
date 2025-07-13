import { IComment } from "@/types/comments.type";

export function removeCommentRecursive(
  comments: IComment[],
  commentId: string
): IComment[] {
  return comments
    .filter((comment) => comment._id !== commentId) // Remove current level comment
    .map((comment) => ({
      ...comment,
      replies: comment.replies
        ? removeCommentRecursive(comment.replies, commentId)
        : [],
    }));
}
