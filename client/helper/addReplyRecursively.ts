import { IComment } from "@/types/comments.type";

 // Function for recursive comment updater
  export function addReplyRecursively(
    comments: IComment[],
    parentId: string,
    newReply: IComment
  ): IComment[] {
    return comments.map((comment) => {
      if (comment._id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }

      return {
        ...comment,
        replies: addReplyRecursively(comment.replies || [], parentId, newReply),
      };
    });
  }