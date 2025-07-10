"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Filter,
  Plus,
  Sparkles,
  Eye,
  Send,
  Coins,
  Clipboard,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { CommentThread } from "@/components/feed/CommentThread";
import { IPrompt } from "@/types/prompts.type";
import { IComment } from "@/types/comments.type";
import countAllComments from "@/utils/count-all-nested-comments";
import { PublicProfileModal } from "@/components/shared/public-profile-modal";
import { IPublicUser } from "@/types/publicUser.type";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePrompts } from "@/hooks/usePrompts";

export default function FeedPage() {
  const { user, updateUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    aiModels: [] as string[],
    priceRange: [0, 100],
    sortBy: "newest",
    resultType: "all",
    tags: [] as string[],
  });

  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [publicUserData, setPublicUserData] = useState<IPublicUser>();
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});

  const { prompts, isLoading, error, mutate } = usePrompts(
    filters,
    selectedCategory
  );

  const toggleExpand = (id: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Function for recursive comment updater
  function addReplyRecursively(
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
  // Function for recursive like updater
  function updateCommentLikeRecursively(
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
  // Helper to recursively remove comment or nested reply
  const removeCommentRecursive = (
    comments: IComment[],
    commentId: string
  ): IComment[] => {
    return comments
      .map((comment) => {
        if (comment._id === commentId) {
          return null; // remove it
        }

        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeCommentRecursive(comment.replies, commentId),
          };
        }
        return comment;
      })
      .filter(Boolean) as IComment[];
  };

  //Function for handling like
  const handleLikePrompt = async (promptId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/like`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to like prompt");

      const updatedPrompts = prompts.map((prompt: IPrompt) =>
        prompt._id === promptId
          ? {
              ...prompt,
              likes: prompt.likes.includes(user?._id ?? "")
                ? prompt.likes.filter((id) => id !== user?._id)
                : [...prompt.likes, user?._id ?? ""],
            }
          : prompt
      );

      mutate(updatedPrompts, false); // Optimistic UI update

      // 🔥 ALSO update the selectedPrompt if it's the one being liked
      if (selectedPrompt && selectedPrompt._id === promptId) {
        const updatedPrompt = updatedPrompts.find(
          (p: IPrompt) => p._id === promptId
        );
        if (updatedPrompt) {
          setSelectedPrompt(updatedPrompt);
        }
      }
    } catch (err) {
      console.error("Like failed:", err);
      toast.error("Something went wrong");
    }
  };
  // Function for adding comment
  const handleAddComment = async (promptId: string, commentText: string) => {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ promptId, text: commentText }),
        }
      );

      if (!res.ok) throw new Error("Failed to comment");

      const result = await res.json();
      console.log(result);

      // Update UI optimistically or re-fetch prompts
      const updatedPrompts = prompts.map((prompt: IPrompt) =>
        prompt._id === promptId
          ? {
              ...prompt,
              comments: [
                ...prompt.comments,
                {
                  ...result.data.comment,
                  user: {
                    _id: user?._id,
                    name: user?.name,
                    avatar: user?.avatar,
                  },
                },
              ],
            }
          : prompt
      );
      mutate(updatedPrompts, false); // Optimistic update

      setNewComment((prev) => ({ ...prev, [promptId]: "" }));
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Something went wrong");
    }
  };

  // Function for updating comment
  const handleUpdateComment = async (commentId: string, newText: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/comment/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: newText }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      // Optimistically update comment in UI
      const updatedPrompts = prompts.map((prompt: IPrompt) => ({
        ...prompt,
        comments: prompt.comments.map((comment) =>
          comment._id === commentId ? { ...comment, text: newText } : comment
        ),
      }));
      mutate(updatedPrompts, false);
    } catch (err) {
      console.error("Error updating comment:", err);
      toast.error("Failed to update comment");
    }
  };

  // Function for deleting comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/comment/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete");

      // Recursively remove the comment from all prompts
      const updatedPrompts = prompts.map((prompt: IPrompt) => ({
        ...prompt,
        comments: removeCommentRecursive(prompt.comments, commentId),
      }));
      mutate(updatedPrompts, false);
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete comment");
    }
  };

  // Function for liking a comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/comment/like`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commentId }),
        }
      );

      if (res.ok) {
        const updatedPrompts = prompts.map((prompt: IPrompt) => ({
          ...prompt,
          comments: updateCommentLikeRecursively(
            prompt.comments,
            commentId,
            user?._id as string
          ),
        }));
        mutate(updatedPrompts, false);
      }
    } catch (err) {
      console.error(err);
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

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/comment/reply`,
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

      // Update state: find the prompt, then find the comment, then add the new reply
      const updatedPrompts = prompts.map((prompt: IPrompt) =>
        prompt._id === promptId
          ? {
              ...prompt,
              comments: addReplyRecursively(
                prompt.comments,
                commentId,
                result.data.comment
              ),
            }
          : prompt
      );
      mutate(updatedPrompts, false);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleFilterChange = (
    key: string,
    value: string | number | number[] // Accepts string, number, or number[] for filters
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAIModelToggle = (model: string) => {
    setFilters((prev) => ({
      ...prev,
      aiModels: prev.aiModels.includes(model)
        ? prev.aiModels.filter((m) => m !== model)
        : [...prev.aiModels, model],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      aiModels: [],
      priceRange: [0, 100],
      sortBy: "newest",
      resultType: "all",
      tags: [],
    });
  };

  //Function for copy prompt
  const handleCopyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt) return;
      if (prompt.paymentStatus === "free") {
        console.log("promptId:", prompt._id);
        await navigator.clipboard.writeText(prompt.promptText);
        toast.success("Prompt copied to clipboard");
      }
    } catch (error) {
      console.error("Error copying prompt", error);
    }
  };
  // Function for buying prompt
  const handleBuyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt || prompt.paymentStatus !== "paid") return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/${prompt._id}/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // cookies for auth
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const serverMessage =
          (data as { message?: string })?.message ||
          "Purchase failed. Try again.";
        throw new Error(serverMessage);
      }

      // ✅ Update user credits
      updateUser({ credits: data.data.updatedCredits });

      // ✅ Copy prompt text to clipboard
      await navigator.clipboard.writeText(prompt.promptText);

      toast.success("Prompt purchased and copied to clipboard");
    } catch (error: unknown) {
      console.error("Buy Prompt Error:", error);
      if (error instanceof Error) {
        toast.error("Failed to purchase the prompt");
      } else {
        toast.error("Failed to purchase the prompt");
      }
    }
  };

  // Function for public profile
  const handlePublicProfile = async (userId: string) => {
    console.log(userId);

    try {
      setIsLoadingPublicProfile(true);
      setShowPublicProfile(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/basic/${userId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log(data.data.profile);
      setPublicUserData(data.data.profile);
      setIsLoadingPublicProfile(false);
    } catch (error) {
      console.error("Error copying prompt", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-3">
        <div className="">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "marketing" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("marketing")}
                  >
                    Marketing
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "design" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("design")}
                  >
                    Design
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "programming" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("programming")}
                  >
                    Programming
                  </Button>
                  <Dialog
                    open={showFiltersModal}
                    onOpenChange={setShowFiltersModal}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                        {(filters.aiModels.length > 0 ||
                          filters.tags.length > 0 ||
                          filters.resultType !== "all") && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {filters.aiModels.length +
                              filters.tags.length +
                              (filters.resultType !== "all" ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Filter Prompts</DialogTitle>
                        <DialogDescription>
                          Refine your search to find the perfect AI prompts
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* AI Models */}
                        <div className="space-y-3">
                          <h4 className="font-medium">AI Models</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "GPT-4",
                              "GPT-3.5",
                              "Claude",
                              "DALL-E 3",
                              "DALL-E 2",
                              "Midjourney",
                              "Stable Diffusion",
                              "Gemini",
                            ].map((model) => (
                              <div
                                key={model}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={model}
                                  checked={filters.aiModels.includes(model)}
                                  onCheckedChange={() =>
                                    handleAIModelToggle(model)
                                  }
                                />
                                <Label htmlFor={model} className="text-sm">
                                  {model}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Result Type */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Result Type</h4>
                          <RadioGroup
                            value={filters.resultType}
                            onValueChange={(value: string) =>
                              handleFilterChange("resultType", value)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="all" />
                              <Label htmlFor="all">All Types</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="text" id="text" />
                              <Label htmlFor="text">Text Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="image" id="image" />
                              <Label htmlFor="image">Images Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="video" id="video" />
                              <Label htmlFor="video">Videos Only</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <Separator />

                        {/* Price Range */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Price Range</h4>
                          <div className="px-3">
                            <Slider
                              value={filters.priceRange}
                              onValueChange={(value: number[]) =>
                                handleFilterChange("priceRange", value)
                              }
                              max={1000}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-2">
                              <span>Free</span>
                              <span>
                                ${filters.priceRange[0]} - $
                                {filters.priceRange[1]}+
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Popular Tags */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Popular Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "marketing",
                              "design",
                              "coding",
                              "writing",
                              "business",
                              "education",
                              "social-media",
                              "copywriting",
                              "logo",
                              "branding",
                              "productivity",
                              "automation",
                            ].map((tag) => (
                              <Badge
                                key={tag}
                                variant={
                                  filters.tags.includes(tag)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => handleTagToggle(tag)}
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Sort By */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Sort By</h4>
                          <RadioGroup
                            value={filters.sortBy}
                            onValueChange={(value: string) =>
                              handleFilterChange("sortBy", value)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="newest" id="newest" />
                              <Label htmlFor="newest">Newest First</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="popular" id="popular" />
                              <Label htmlFor="popular">Most Popular</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="price-low"
                                id="price-low"
                              />
                              <Label htmlFor="price-low">
                                Price: Low to High
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="price-high"
                                id="price-high"
                              />
                              <Label htmlFor="price-high">
                                Price: High to Low
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="rating" id="rating" />
                              <Label htmlFor="rating">Highest Rated</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={clearAllFilters}>
                          Clear All
                        </Button>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowFiltersModal(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => setShowFiltersModal(false)}>
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading prompts...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">
                      {typeof error === "string"
                        ? error
                        : error?.message || "Something went wrong"}
                    </p>
                    <Button onClick={() => mutate()}>Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && prompts.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No prompts found.</p>
                    <Link href="/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Prompt
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* public profile model */}
            {showPublicProfile && publicUserData && (
              <PublicProfileModal
                user={publicUserData}
                open={showPublicProfile}
                onOpenChange={setShowPublicProfile}
                isLoading={isLoadingPublicProfile}
              />
            )}

            {/* Prompt Cards */}
            {!isLoading &&
              !error &&
              prompts.length > 0 &&
              prompts.map((prompt: IPrompt) => (
                <Card
                  key={prompt._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() =>
                          handlePublicProfile(prompt?.creator?._id)
                        }
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
                            {prompt?.paymentStatus}
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
                          ? prompt?.description
                          : prompt?.description.length > 150
                          ? `${prompt?.description.slice(0, 150)}...`
                          : prompt?.description}
                        {prompt?.description.length > 150 && (
                          <button
                            onClick={() => toggleDescription(prompt?._id)}
                            className="text-white hover:underline ml-1"
                          >
                            {expandedDescriptions[prompt?._id]
                              ? "See less"
                              : "See more"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {prompt?.resultType === "image" ? (
                        <Image
                          width={400}
                          height={400}
                          src={prompt?.resultContent || "/placeholder.svg"}
                          alt="Prompt result"
                          className="w-full rounded-lg"
                        />
                      ) : prompt?.resultType === "video" ? (
                        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                          <video
                            controls
                            preload="metadata"
                            className="w-full h-auto max-h-[500px] rounded-xl bg-black"
                            poster="/video-thumbnail.png" // optional placeholder
                          >
                            <source
                              src={prompt?.resultContent || ""}
                              type="video/mp4"
                            />
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
                              {expandedPrompts[prompt?._id]
                                ? "See less"
                                : "See more"}
                            </button>
                          )}
                        </div>
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

                    {/* AI Model */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generated with {prompt?.aiModel}
                    </div>
                    <Separator />

                    {/* Actions */}
                    <div className="flex w-full">
                      {/* Each button gets flex-1 to take equal width */}
                      <Button
                        onClick={() => handleLikePrompt(prompt?._id)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                        title="Like this prompt"
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

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [prompt?._id]: !prev[prompt?._id],
                          }))
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {countAllComments(prompt?.comments)}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {prompt?.views}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      {prompt?.paymentStatus === "free" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center justify-center"
                          onClick={() => handleCopyPrompt(prompt)}
                        >
                          <Clipboard className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      )}
                      {prompt?.paymentStatus === "paid" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 flex items-center justify-center"
                            >
                              <Coins className="h-4 w-4 mr-2" />
                              {prompt.price}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your account and remove your
                                data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => {
                                  toast.error("Action cancelled");
                                }}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  handleBuyPrompt(prompt);
                                }}
                              >
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <>
                      {openComments[prompt?._id] && (
                        <div className="mt-4 space-y-3 transition-all duration-500 ease-in-out">
                          {/* Add New Comment */}
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage
                                src={user?.avatar || "/placeholder.svg"}
                              />
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
                                    prompt?._id,
                                    newComment[prompt?._id] || ""
                                  );
                                }}
                              >
                                <input
                                  type="text"
                                  value={newComment[prompt?._id] || ""}
                                  onChange={(e) =>
                                    setNewComment((prev) => ({
                                      ...prev,
                                      [prompt?._id]: e.target.value,
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

                          {/* Show Existing Comments */}
                          <div className="space-y-2 ">
                            {prompt?.comments?.length === 0 && (
                              <p className="text-sm text-gray-400">
                                No comments yet.
                              </p>
                            )}
                            {prompt?.comments.map((comment) => (
                              <CommentThread
                                key={comment?._id}
                                comment={comment}
                                currentUserId={user?._id as string}
                                promptId={prompt?._id}
                                onLike={handleLikeComment}
                                onReply={handleReply}
                                onDelete={handleDeleteComment}
                                onEdit={handleUpdateComment}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
