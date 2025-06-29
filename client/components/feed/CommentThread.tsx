// components/CommentThread.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import formatShortTimeAgo from "@/utils/formate-time-ago";
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

interface CommentThreadProps {
  comment: IComment;
  currentUserId: string;
  promptId: string;
  onLike: (commentId: string) => void;
  onReply: (promptId: string, commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newText: string) => void;
}

export const CommentThread = ({
  comment,
  currentUserId,
  promptId,
  onLike,
  onReply,
  onDelete,
  onEdit,
}: CommentThreadProps) => {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

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
                  onEdit(comment?._id, editedText);
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
                {comment?.text}
              </p>
            )}
          </div>

          <div className="pl-5 mt-1 flex items-center space-x-4">
            <p className="text-xs text-gray-500">
              {formatShortTimeAgo(new Date(comment?.createdAt))}
            </p>

            <button
              className={`text-xs font-semibold ${
                comment?.likes?.includes(currentUserId)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
              onClick={() => onLike(comment?._id)}
            >
              Like {comment.likes?.length > 0 && `(${comment?.likes?.length})`}
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
        {comment?.user?._id === currentUserId && (
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
              <DropdownMenuItem onClick={() => onDelete(comment._id)}>
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
            onReply(promptId, comment._id, replyText);
            setReplyText("");
            setIsReplying(false);
          }}
          className="ml-12 mt-2 space-x-2 flex"
        >
          <input
            value={replyText}
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
        <div key={reply._id || Math.random()} className="ml-12 mt-2">
          <CommentThread
            comment={reply}
            currentUserId={currentUserId}
            promptId={promptId}
            onLike={onLike}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  );
};
