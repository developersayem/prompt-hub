"use client";

import { FC, useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Eye,
  Heart,
  MessageCircle,
  Clipboard,
  Sparkles,
  Send,
  BookmarkCheck,
  BookmarkPlus,
  EllipsisVertical,
  Flag,
  Bookmark,
  User,
  Copy,
} from "lucide-react";
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
import { toast } from "sonner";
import type { KeyedMutator } from "swr";
import {
  optimisticAddComment,
  optimisticUpdatePromptLike,
} from "@/utils/swrOptimisticUpdate";
import countAllComments from "@/helper/count-all-nested-comments";
import { useAuth } from "@/contexts/auth-context";
import { ShareDialogButton } from "./share-dialog";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";
import isValidUrl from "@/helper/check-url";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import Image from "next/image";
import { useLoginPrompt } from "@/contexts/login-prompt-context";
import { useTrackPromptView } from "@/hooks/useTrackPromptView";
import { useRouter } from "next/navigation";
import ReportModal from "./report-modal";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface PromptCardProps {
  prompt: IPrompt;
  mutatePrompts: KeyedMutator<IPrompt[] | undefined>;
  handleCopyPrompt: (prompt: IPrompt) => void;
  index?: number; // 👈 add this
}

const PromptCard: FC<PromptCardProps> = ({
  prompt,
  mutatePrompts,
  handleCopyPrompt,
  index,
}) => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  // Track view
  const { trackView } = useTrackPromptView(prompt._id);
  // All States
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const { triggerLoginModal } = useLoginPrompt();
  const commentRef = useRef<HTMLDivElement | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Function for handling comments
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOpen = openComments[prompt._id];
      if (
        isOpen &&
        commentRef.current &&
        !commentRef.current.contains(event.target as Node)
      ) {
        setOpenComments((prev) => ({
          ...prev,
          [prompt._id]: false,
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openComments, prompt._id]);
  // Function for handling protected action
  const handleProtectedAction = () => {
    if (!user?._id) {
      triggerLoginModal();
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
    // Track view
    trackView();
    setExpandedDescriptions((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  //Function for handling like
  const handleLikePrompt = async () => {
    // Track view
    trackView();
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
    // Track view
    trackView();
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
  // Function for bookmark prompt
  const handleBookmarkPrompt = async (promptId: string) => {
    // Track view
    trackView();
    if (!user) return toast.error("You must be logged in to bookmark");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/bookmarks`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      // Update local bookmarks based on toggle response
      if (data.data?.added) {
        const updatedBookmarks = [...(user.bookmarks || []), promptId];
        updateUser({ bookmarks: updatedBookmarks });
        toast.success("Bookmark added successfully");
      } else if (data.data?.removed) {
        const updatedBookmarks = (user.bookmarks || []).filter(
          (id) => id !== promptId
        );
        updateUser({ bookmarks: updatedBookmarks });
        toast.info("Bookmark removed");
      }

      // Optional: re-fetch prompt list or update UI
      mutatePrompts?.();
    } catch (err) {
      console.error("Error bookmarking prompt:", err);
      toast.error("Something went wrong");
    }
  };
  // Function for seeing public profile
  const seePublicProfile = (slug: string) => {
    router.push(`/feed/profile/${slug}`);
  };
  // Function for seeing public prompt
  const handleOpenReportModal = () => {
    setIsReportOpen(true);
  };

  return (
    <>
      <Card
        onClick={() => trackView()}
        className="hover:shadow-lg transition-shadow"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div
              onClick={() => seePublicProfile(prompt?.creator?.slug)}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <Avatar>
                <AvatarImage
                  src={prompt?.creator?.avatar || "/placeholder.svg"}
                />
                <AvatarFallback className="text-xs uppercase">
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
                <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs">
                  <Coins className="w-3 h-3" /> Paid
                </Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>
            {/* Three dot menu Dropdown */}
            <div className="">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer">
                    <EllipsisVertical />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1">
                  <ul className="space-y-1">
                    <li
                      onClick={() => seePublicProfile(prompt?.creator?.slug)}
                      className="hover:bg-neutral-50 flex items-center hover:text-black rounded px-2 cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Profile
                    </li>
                    <li
                      onClick={() => handleCopyPrompt(prompt)}
                      className="hover:bg-neutral-50 flex items-center hover:text-black rounded px-2 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </li>
                    <li
                      onClick={() => handleBookmarkPrompt(prompt?._id || "")}
                      className="hover:bg-neutral-50 flex items-center hover:text-black rounded px-2 cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 mr-1" />
                      Bookmark
                    </li>
                    <li
                      onClick={() => handleOpenReportModal()}
                      className="hover:bg-neutral-50 flex items-center hover:text-black rounded px-2 cursor-pointer"
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Report Post
                    </li>
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt title and description */}
          <div>
            <h3 className="text-xl font-semibold mb-2 capitalize">
              {prompt?.title}
            </h3>
            <div className="text-gray-600 text-sm whitespace-pre-wrap capitalize break-words w-full overflow-hidden">
              {expandedDescriptions[prompt._id]
                ? prompt?.description ?? ""
                : (prompt?.description ?? "").length > 150
                ? `${(prompt?.description ?? "").slice(0, 150)}...`
                : prompt?.description ?? ""}
              {prompt?.description && prompt.description.length > 150 && (
                <button
                  onClick={() => toggleDescription(prompt?._id)}
                  className="text-white hover:underline ml-1 text-sm cursor-pointer"
                >
                  {expandedDescriptions[prompt?._id] ? "See less" : "See more"}
                </button>
              )}
            </div>
          </div>
          {/* content preview section */}
          <div
            className={`${
              prompt?.resultType === "text" ? "bg-gray-200 dark:bg-gray-50" : ""
            } rounded-lg p-4 `}
          >
            {prompt?.resultType === "image" ? (
              isValidUrl(prompt.resultContent) ? (
                isWhitelistedDomain(prompt.resultContent) ? (
                  <Image
                    width={700}
                    height={300}
                    src={prompt.resultContent}
                    alt={prompt.title || "Prompt image"}
                    className="mx-auto rounded-lg object-contain max-h-[500px]"
                    priority={index !== undefined && index < 2}
                  />
                ) : (
                  // fallback img for non-whitelisted domains
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prompt.resultContent}
                    alt={prompt.title || "Prompt image"}
                    className="mx-auto rounded-lg object-contain max-h-[500px]"
                    loading="lazy"
                    decoding="async"
                  />
                )
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Invalid image URL
                </p>
              )
            ) : prompt?.resultType === "video" ? (
              (() => {
                const embed = getEmbeddableVideoUrl(
                  isValidUrl(prompt.resultContent) ? prompt.resultContent : ""
                );

                if (!embed) {
                  return (
                    <p className="text-center text-sm text-gray-500">
                      Unsupported or private media URL
                    </p>
                  );
                }

                if (embed.type === "video") {
                  return (
                    <div
                      className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <video
                        controls
                        preload="metadata"
                        className="absolute inset-0 w-full h-full rounded-xl object-cover bg-black"
                        src={prompt.resultContent}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  );
                }

                // embed.type === "iframe"
                return (
                  <div
                    className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <iframe
                      src={embed.url}
                      className="absolute inset-0 w-full h-full rounded-xl"
                      allowFullScreen
                      title={prompt.title || "Embedded video"}
                    />
                  </div>
                );
              })()
            ) : (
              <p className="text-sm whitespace-pre-wrap text-black capitalize">
                {expandedPrompts[prompt._id]
                  ? prompt.resultContent
                  : prompt.resultContent.length > 200
                  ? `${prompt.resultContent.slice(0, 200)}...`
                  : prompt.resultContent}
                {prompt.resultContent.length > 200 && (
                  <button
                    onClick={() => toggleExpand(prompt._id)}
                    className="text-blue-500 hover:underline mt-2 text-sm cursor-pointer"
                  >
                    {expandedPrompts[prompt._id] ? "See less" : "See more"}
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Tags */}
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
          {/* AI model */}
          <div className="flex items-center text-sm text-gray-500">
            <Sparkles className="h-4 w-4 mr-1" />
            Generated with {prompt?.aiModel}
          </div>

          <Separator />
          {/* Actions buttons section */}
          <div className="flex w-full flex-wrap gap-1">
            {/* Like button */}
            <button
              className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer"
              onClick={() => {
                if (handleProtectedAction()) return;
                handleLikePrompt();
              }}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${
                  prompt?.likes.includes(user?._id ?? "")
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              />
              {prompt?.likes.length}
            </button>
            {/* Comment button */}
            <button
              className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer"
              onClick={() => {
                if (handleProtectedAction()) return;
                setOpenComments((prev) => ({
                  ...prev,
                  [prompt?._id]: !prev[prompt?._id],
                }));
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {countAllComments(prompt?.comments)}
            </button>
            {/* Share button */}
            <ShareDialogButton
              trackView={trackView}
              shareUrl={`${window.location.origin}/feed/${prompt?.slug}`}
            />
            {/* View button */}
            <button className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer">
              <Eye className="h-4 w-4 mr-2" />
              {prompt?.views}
            </button>
            {/* Bookmark button */}
            <button
              className="flex-1 flex items-center justify-center min-w-[60px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-md cursor-pointer"
              onClick={() => {
                if (handleProtectedAction()) return;
                handleBookmarkPrompt(prompt?._id);
              }}
            >
              {user?.bookmarks?.includes(prompt?._id) ? (
                <BookmarkCheck className="text-red-500" />
              ) : (
                <BookmarkPlus />
              )}
            </button>
            {/*Copy button */}
            {prompt?.paymentStatus === "free" ||
            prompt.creator._id === user?._id ||
            user?.purchasedPrompts?.includes(prompt._id) ? (
              <Button
                variant="outline"
                size="icon"
                className="flex-1 flex items-center justify-center min-w-[60px] cursor-pointer"
                onClick={() => handleCopyPrompt(prompt)}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild className="cursor-pointer">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 flex items-center justify-center min-w-[60px]"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    {prompt.price}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-96 bg-neutral-900">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Buy this prompt?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You’ll be charged and the prompt will be copied after
                      purchase.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        // Track view
                        trackView();
                        handleCopyPrompt(prompt);
                      }}
                      className="cursor-pointer"
                    >
                      Buy & Copy
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Comments Section */}
          {openComments[prompt?._id] && (
            <div
              ref={commentRef}
              className="mt-4 space-y-3 transition-all duration-500 ease-in-out"
            >
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
                    <Button size="lg" type="submit" className="cursor-pointer">
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

      {/* report modal */}
      <ReportModal
        isOpen={isReportOpen}
        onOpenChange={setIsReportOpen}
        postId={prompt._id}
        postAuthorId={prompt.creator._id}
        postAuthorName={prompt.creator.name}
      />
    </>
  );
};

export default PromptCard;
