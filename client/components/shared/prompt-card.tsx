"use client";

import { FC, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Clipboard,
  Sparkles,
  Send,
} from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { IPrompt } from "@/types/prompts.type";
import { CommentThread } from "./comment-thread";
// import { IComment } from "@/types/comments.type";
import { toast } from "sonner";
import LoginPromptModal from "../feed/LoginPromptModal";
import type { KeyedMutator } from "swr";
import {
  optimisticAddComment,
  optimisticUpdatePromptLike,
} from "@/utils/swrOptimisticUpdate";
import countAllComments from "@/helper/count-all-nested-comments";
import { useAuth } from "@/contexts/auth-context";
import { ShareDialog } from "./share-dialog";

interface PromptCardProps {
  prompt: IPrompt;
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>;
  handleCopyPrompt: (prompt: IPrompt) => void;
  handlePublicProfile: (userId: string) => void;
}

const PromptCard: FC<PromptCardProps> = ({
  prompt,
  mutatePrompts,
  handleCopyPrompt,
  handlePublicProfile,
}) => {
  const { user } = useAuth();
  // All States
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleProtectedAction = () => {
    if (!user?._id) {
      setShowLoginModal(true);
      return true; // Block action
    }
    return false; // Allow action
  };
  // Function for toggle prompt text
  const toggleExpand = (id: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  // Function for toggle description text
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  //Function for handling like
  const handleLikePrompt = async () => {
    if (!user?._id || !prompt?._id) return;

    const liked = prompt.likes.includes(user._id);
    const updatedPrompt: IPrompt = {
      ...prompt,
      likes: liked
        ? prompt.likes.filter((id) => id !== user._id)
        : [...prompt.likes, user._id],
    };

    try {
      // Optimistically update UI before server confirmation
      await optimisticUpdatePromptLike(
        mutatePrompts,
        prompt._id,
        updatedPrompt
      );

      // Send like request to backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/like`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: prompt._id }),
        }
      );

      if (!res.ok) throw new Error("Failed to update like");
    } catch (err) {
      toast.error("Something went wrong");
      console.log(err);
    } finally {
    }
  };
  // Function for adding comment
  const handleAddComment = async (promptId: string, commentText: string) => {
    if (!commentText.trim()) return;

    try {
      // Send comment request to backend
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ promptId, text: commentText }),
        }
      );

      if (!res.ok) throw new Error("Failed to comment");

      const result = await res.json();

      const newComment = {
        ...result.data.comment,
        user: {
          _id: user?._id,
          name: user?.name,
          avatar: user?.avatar,
        },
      };
      // Optimistically update UI before server confirmation
      await optimisticAddComment(mutatePrompts, promptId, newComment);
      setNewComment((prev) => ({ ...prev, [promptId]: "" }));
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div
              onClick={() => handlePublicProfile(prompt?.creator?._id)}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <Avatar>
                <AvatarImage
                  src={prompt?.creator?.avatar || "/placeholder.svg"}
                />
                <AvatarFallback>
                  {prompt?.creator?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "NA"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold capitalize">
                  {prompt?.creator?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(prompt?.createdAt))}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 capitalize">
              <Badge variant="secondary">{prompt?.category}</Badge>
              {prompt.paymentStatus === "paid" ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  Paid
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2 capitalize">
              {prompt?.title}
            </h3>
            <div className="text-gray-600 text-sm whitespace-pre-wrap capitalize">
              {expandedDescriptions[prompt._id]
                ? prompt?.description ?? ""
                : (prompt?.description ?? "").length > 150
                ? `${(prompt?.description ?? "").slice(0, 150)}...`
                : prompt?.description ?? ""}

              {prompt?.description && prompt.description.length > 150 && (
                <button
                  onClick={() => toggleDescription(prompt?._id)}
                  className="text-white hover:underline ml-1 text-sm"
                >
                  {expandedDescriptions[prompt?._id] ? "See less" : "See more"}
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            {prompt?.resultType === "image" ? (
              <Image
                width={400}
                height={400}
                src={prompt?.resultContent || "/placeholder.svg"}
                alt="Prompt result"
                className="w-full rounded-lg"
                priority
              />
            ) : prompt?.resultType === "video" ? (
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                <video
                  controls
                  preload="metadata"
                  className="w-full h-auto max-h-[500px] rounded-xl bg-black"
                  poster="/video-thumbnail.png"
                >
                  <source src={prompt?.resultContent || ""} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div>
                <p className="text-sm whitespace-pre-wrap text-black capitalize">
                  {expandedPrompts[prompt?._id]
                    ? prompt?.resultContent
                    : prompt?.resultContent.length > 200
                    ? `${prompt?.resultContent.slice(0, 200)}...`
                    : prompt?.resultContent}
                </p>
                {prompt?.resultContent.length > 200 && (
                  <button
                    onClick={() => toggleExpand(prompt?._id)}
                    className="text-blue-500 hover:underline mt-2 text-sm"
                  >
                    {expandedPrompts[prompt?._id] ? "See less" : "See more"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt?.tags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="outline"
                className="text-xs"
              >
                #{tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Sparkles className="h-4 w-4 mr-1" />
            Generated with {prompt?.aiModel}
          </div>

          <Separator />

          <div className="flex w-full flex-wrap gap-1">
            {/* Like button */}
            <Button
              onClick={() => {
                if (handleProtectedAction()) return;
                handleLikePrompt();
              }}
              variant="ghost"
              size="sm"
              className="flex-1 flex items-center justify-center min-w-[60px]"
            >
              <Heart
                className={`h-4 w-4 mr-2 ${
                  prompt?.likes.includes(user?._id ?? "")
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              />
              {prompt?.likes.length}
            </Button>
            {/*            Comment button */}
            <Button
              onClick={() => {
                if (handleProtectedAction()) return;
                setOpenComments((prev) => ({
                  ...prev,
                  [prompt?._id]: !prev[prompt?._id],
                }));
              }}
              variant="ghost"
              size="sm"
              className="flex-1 flex items-center justify-center min-w-[60px]"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {countAllComments(prompt?.comments)}
            </Button>
            {/* Share button */}
            <ShareDialog
              shareUrl={`${window.location.origin}/feed/${prompt?.slug}`}
            />
            {/* View button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 flex items-center justify-center min-w-[60px]"
            >
              <Eye className="h-4 w-4 mr-2" />
              {prompt?.views}
            </Button>
            {/* Bookmark button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 flex items-center justify-center min-w-[60px]"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            {/*Copy button */}
            {prompt?.paymentStatus === "free" ||
            prompt.creator._id === user?._id ||
            user?.purchasedPrompts?.includes(prompt._id) ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 flex items-center justify-center min-w-[60px]"
                onClick={() => handleCopyPrompt(prompt)}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 flex items-center justify-center min-w-[60px]"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    {prompt.price}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Buy this prompt?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You’ll be charged and the prompt will be copied after
                      purchase.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCopyPrompt(prompt)}>
                      Buy & Copy
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Comments Section */}
          {openComments[prompt?._id] && (
            <div className="mt-4 space-y-3 transition-all duration-500 ease-in-out">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <form
                    className="flex items-center space-x-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment(
                        prompt._id,
                        newComment[prompt._id] || ""
                      );
                    }}
                  >
                    <input
                      type="text"
                      value={newComment[prompt._id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [prompt._id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                    <Button size="lg" type="submit">
                      <Send />
                    </Button>
                  </form>
                </div>
              </div>

              <div className="space-y-2">
                {prompt?.comments.length === 0 && (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                )}
                {prompt?.comments.map((comment) => (
                  <CommentThread
                    key={comment._id}
                    comment={comment}
                    currentUserId={user?._id ?? ""}
                    promptId={prompt._id}
                    mutatePrompts={mutatePrompts}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Login Prompt Modal */}
      {/* Show login modal if user is not logged in */}
      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default PromptCard;
