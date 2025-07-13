import type { IComment } from "@/types/comments.type";

export function updateNestedComment(
  comments: IComment[],
  commentId: string,
  newText: string
): IComment[] {
  return comments.map((comment) => {
    if (comment._id === commentId) {
      return { ...comment, text: newText, updatedAt: new Date().toISOString() };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateNestedComment(comment.replies, commentId, newText),
      };
    }

    return comment;
  });
}
