import type { KeyedMutator } from "swr";
import type { IPrompt } from "@/types/prompts.type";
import { IComment } from "@/types/comments.type";
import { updateNestedComment } from "../helper/updateNestedComment";
import { removeCommentRecursive } from "@/helper/removeCommentRecursive";
import { updateCommentLikeRecursively } from "@/helper/updateCommentLikeRecursively";
import { addReplyRecursively } from "@/helper/addReplyRecursively";


// Function for updating like
export async function optimisticUpdatePromptLike(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  promptId: string,
  updatedPrompt: IPrompt
) {
  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;
      return currentPrompts.map((p) => (p._id === promptId ? updatedPrompt : p));
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((p) => (p._id === promptId ? updatedPrompt : p));
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}
// Function for adding comment
export async function optimisticAddComment(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  promptId: string,
  newComment: IComment
) {
  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;
      return currentPrompts.map((p) =>
        p._id === promptId
          ? {
              ...p,
              comments: [...p.comments, newComment],
            }
          : p
      );
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((p) =>
          p._id === promptId
            ? {
                ...p,
                comments: [...p.comments, newComment],
              }
            : p
        );
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}
// Function for updating comment
export async function optimisticUpdateComment(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  commentId: string,
  newText: string
) {
//   const now = new Date().toISOString();

  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;

      return currentPrompts.map((prompt) => ({
        ...prompt,
        comments: updateNestedComment(prompt.comments, commentId, newText),
      }));
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;

        return currentData.map((prompt) => ({
          ...prompt,
          comments: updateNestedComment(prompt.comments, commentId, newText),
        }));
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}
// Function for deleting comment
export async function optimisticDeleteComment(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  commentId: string
) {
  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;

      return currentPrompts.map((prompt) => ({
        ...prompt,
        comments: removeCommentRecursive(prompt.comments, commentId),
      }));
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;

        return currentData.map((prompt) => ({
          ...prompt,
          comments: removeCommentRecursive(prompt.comments, commentId),
        }));
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}
// Function for updating comment like
export async function optimisticUpdateCommentLike(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  commentId: string,
  userId: string
) {
  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;

      return currentPrompts.map((prompt) => ({
        ...prompt,
        comments: updateCommentLikeRecursively(prompt.comments, commentId, userId),
      }));
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;

        return currentData.map((prompt) => ({
          ...prompt,
          comments: updateCommentLikeRecursively(prompt.comments, commentId, userId),
        }));
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}
// Function for adding reply
export async function optimisticAddReply(
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>,
  promptId: string,
  commentId: string,
  replyText: string,
  currentUser: { _id: string; name: string; avatar?: string }
) {
  const tempReply: IComment = {
    _id: "temp-id-" + Date.now(),
    text: replyText,
    user: {
      _id: currentUser._id,
      name: currentUser.name,
      avatar: currentUser.avatar || "",
    },
    createdAt: new Date().toISOString(),
    likes: [],
    replies: [],
  };

  return mutatePrompts(
    (currentPrompts) => {
      if (!currentPrompts) return currentPrompts;
      return currentPrompts.map((prompt) =>
        prompt._id === promptId
          ? {
              ...prompt,
              comments: addReplyRecursively(prompt.comments, commentId, tempReply),
            }
          : prompt
      );
    },
    {
      optimisticData: (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((prompt) =>
          prompt._id === promptId
            ? {
                ...prompt,
                comments: addReplyRecursively(prompt.comments, commentId, tempReply),
              }
            : prompt
        );
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}