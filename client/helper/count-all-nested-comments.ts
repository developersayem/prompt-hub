import { IComment } from "@/types/comments.type";

//helper function for count all nested comments
const countAllComments = (comments: IComment[]) => {
    let count = 0;
    for (const comment of comments) {
      count += 1;
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies);
      }
    }
    return count;
  };

  export default countAllComments