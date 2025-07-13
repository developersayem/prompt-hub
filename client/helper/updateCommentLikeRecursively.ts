import { IComment } from "@/types/comments.type";

// Function for recursive like updater
 export function updateCommentLikeRecursively(
    comments: IComment[],
    commentId: string,
    userId: string
  ): IComment[] {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        const alreadyLiked = comment.likes.includes(userId);
        return {
          ...comment,
          likes: alreadyLiked
            ? comment.likes.filter((id) => id !== userId)
            : [...comment.likes, userId],
        };
      }

      return {
        ...comment,
        replies: updateCommentLikeRecursively(
          comment.replies || [],
          commentId,
          userId
        ),
      };
    });
  }