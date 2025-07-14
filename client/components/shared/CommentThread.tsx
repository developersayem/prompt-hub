// components/CommentThread.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import formatShortTimeAgo from "@/helper/formate-time-ago";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Send, XIcon } from "lucide-react";
import { useState } from "react";
import { IComment } from "@/types/comments.type";
import {
  optimisticAddReply,
  optimisticDeleteComment,
  optimisticUpdateComment,
  optimisticUpdateCommentLike,
} from "@/utils/swrOptimisticUpdate";
import { toast } from "sonner";
import { IUser } from "@/types/users.type";
import { IPrompt } from "@/types/prompts.type";
import { KeyedMutator } from "swr";
import { replaceTempReplyWithReal } from "@/helper/replaceTempReplyWithReal";

interface CommentThreadProps {
  comment: IComment;
  currentUserId: string;
  promptId: string;
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>;
  user: IUser | null;
}

export const CommentThread = ({
  comment,
  currentUserId,
  promptId,
  mutatePrompts,
  user,
}: CommentThreadProps) => {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Function for liking a comment
  const handleLikeComment = async (commentId: string) => {
    if (!user?._id) {
      toast.error("You must be logged in to like comments.");
      return;
    }
    try {
      await optimisticUpdateCommentLike(mutatePrompts, commentId, user._id);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/comment/like`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commentId }),
        }
      );

      if (!res.ok) throw new Error("Failed to like comment");
    } catch (err) {
      console.error(err);
      toast.error("Failed to like comment");
    }
  };
  // Function for updating comment
  const handleUpdateComment = async (commentId: string, newText: string) => {
    // 🔁 Immediately update UI without waiting for the server
    optimisticUpdateComment(mutatePrompts, commentId, newText);

    try {
      // ✅ Now make the request (async but we already updated the UI)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/comment/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: newText }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
    } catch (err) {
      console.error("Error updating comment:", err);
      toast.error("Failed to update comment");

      // Optional: rollback to previous data or re-fetch if failed
      mutatePrompts(); // Revalidate from server if needed
    }
  };
  // Function for deleting comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await optimisticDeleteComment(mutatePrompts, commentId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/comment/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete comment");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete comment");
    }
  };
  // Function for replying to a comment
  const handleReply = async (
    promptId: string,
    commentId: string,
    text: string
  ) => {
    if (!text.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to reply.");
      return;
    }

    try {
      // Optimistically update UI with temporary reply
      await optimisticAddReply(mutatePrompts, promptId, commentId, text, {
        _id: "temp-id-" + Date.now(), // Important: use a unique temp id here!
        name: user.name,
        avatar: user.avatar || "",
      });

      // Call backend to add reply
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/comment/reply`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, text, parentComment: commentId }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to post reply");
        return;
      }

      const result = await res.json();

      // Replace temporary reply with real reply from backend
      mutatePrompts(
        (currentPrompts) => {
          if (!currentPrompts) return currentPrompts;

          return currentPrompts.map((prompt) => {
            if (prompt._id !== promptId) return prompt;

            return {
              ...prompt,
              comments: replaceTempReplyWithReal(
                prompt.comments,
                commentId,
                result.data.comment
              ),
            };
          });
        },
        { revalidate: false }
      );
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment?.user?.avatar || "/placeholder.svg"} />
          <AvatarFallback>
            {comment?.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        {/* Comment content */}
        <div>
          <div className="bg-gray-100 rounded-xl px-4 py-2 max-w-md w-full">
            <p className="text-xs text-gray-500 dark:text-accent">
              {comment?.user?.name}
            </p>

            {editing ? (
              <form
                className="flex items-center space-x-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateComment(comment._id, editedText);
                  setEditing(false);
                }}
              >
                <input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full px-3 py-1 text-sm border rounded-md text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Button size="lg" type="submit">
                  <Send />
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setEditing(false)}
                >
                  <XIcon />
                </Button>
              </form>
            ) : (
              <p className="text-sm font-medium text-gray-700">
                {comment.text}
              </p>
            )}
          </div>

          <div className="pl-5 mt-1 flex items-center space-x-4">
            <p className="text-xs text-gray-500">
              {formatShortTimeAgo(new Date(comment.createdAt))}
            </p>

            <button
              className={`text-xs font-semibold ${
                comment.likes?.includes(currentUserId)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
              onClick={() => handleLikeComment(comment._id)}
            >
              Like {comment.likes?.length > 0 && `(${comment.likes.length})`}
            </button>

            <button
              className="text-xs text-gray-500"
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </button>
          </div>
        </div>

        {/* 3-dot menu */}
        {comment.user?._id === currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteComment(comment._id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Reply input */}
      {isReplying && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleReply(promptId, comment._id, replyText);
            setReplyText("");
            setIsReplying(false);
          }}
          className="ml-12 mt-2 space-x-2 flex"
        >
          <input
            value={replyText}
            autoFocus
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full px-3 py-1 text-sm border rounded-md text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <Button size="lg" type="submit">
            <Send />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsReplying(false)}
          >
            <XIcon />
          </Button>
        </form>
      )}

      {/* Render Replies */}
      {comment.replies?.map((reply) => (
        <div key={reply._id} className="ml-12 mt-2">
          <CommentThread
            comment={reply}
            currentUserId={currentUserId}
            promptId={promptId}
            mutatePrompts={mutatePrompts}
            user={user}
          />
        </div>
      ))}
    </div>
  );
};
