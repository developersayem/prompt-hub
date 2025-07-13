import { IComment } from "@/types/comments.type";

export function replaceTempReplyWithReal(
  comments: IComment[],
  parentCommentId: string,
  realReply: IComment
): IComment[] {
  return comments.map(comment => {
    if (comment._id === parentCommentId) {
      // Replace the reply with the real one:
      return {
        ...comment,
        replies: comment.replies.map(reply => 
          reply._id.startsWith("temp-id-") ? realReply : reply
        )
      };
    }

    // Recurse deeper if replies exist
    if (comment.replies.length) {
      return {
        ...comment,
        replies: replaceTempReplyWithReal(comment.replies, parentCommentId, realReply),
      };
    }

    return comment;
  });
}
