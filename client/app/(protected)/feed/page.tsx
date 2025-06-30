"use client";

import { useEffect, useState } from "react";
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
  Lock,
  Send,
  Coins,
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
import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { CommentThread } from "@/components/feed/CommentThread";
import { IPrompt } from "@/types/prompts-type";
import { IComment } from "@/types/comments.type";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FeedPage() {
  const { user } = useAuth();
  // Initialize prompts as an empty array to prevent the map error
  const [prompts, setPrompts] = useState<IPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

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

  // Function for handling fetch prompts
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      if (selectedCategory !== "all") {
        queryParams.append("category", selectedCategory);
      }

      if (filters.resultType !== "all") {
        queryParams.append("searchString", filters.resultType);
      }

      // If price range starts above 0, assume paid prompts
      if (filters.priceRange[0] > 0) {
        queryParams.append("isPaid", "true");
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/v1/prompt?${queryParams.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const promptsData = Array.isArray(data.data.data) ? data.data.data : [];
      setPrompts(promptsData);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setError("Failed to fetch prompts. Please try again.");
      setPrompts([]);
      toast.error("Failed to fetch prompts.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, filters]);

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

      const updatedPrompts = prompts.map((prompt) =>
        prompt._id === promptId
          ? {
              ...prompt,
              likes: prompt.likes.includes(user?._id ?? "")
                ? prompt.likes.filter((id) => id !== user?._id)
                : [...prompt.likes, user?._id ?? ""],
            }
          : prompt
      );

      setPrompts(updatedPrompts);

      // 🔥 ALSO update the selectedPrompt if it's the one being liked
      if (selectedPrompt && selectedPrompt._id === promptId) {
        const updatedPrompt = updatedPrompts.find((p) => p._id === promptId);
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
      const updatedPrompts = prompts.map((prompt) =>
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
      setPrompts(updatedPrompts);
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
      const updatedPrompts = prompts.map((prompt) => ({
        ...prompt,
        comments: prompt.comments.map((comment) =>
          comment._id === commentId ? { ...comment, text: newText } : comment
        ),
      }));
      setPrompts(updatedPrompts);
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
      const updatedPrompts = prompts.map((prompt) => ({
        ...prompt,
        comments: removeCommentRecursive(prompt.comments, commentId),
      }));

      setPrompts(updatedPrompts);
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
        const updatedPrompts = prompts.map((prompt) => ({
          ...prompt,
          comments: updateCommentLikeRecursively(
            prompt.comments,
            commentId,
            user?._id as string
          ),
        }));
        setPrompts(updatedPrompts);
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
      const updatedPrompts = prompts.map((prompt) =>
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

      setPrompts(updatedPrompts);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // fetch prompts from database
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

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
  // Function for counting view and view the prompt
  const handleViewPrompt = async (prompt: IPrompt) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/${prompt._id}`,
        {
          method: "GET",
          credentials: "include", // if using cookies
        }
      );

      // Optional: open modal or navigate
      // 1. If showing in modal:
      setSelectedPrompt(prompt);
      setShowPromptModal(true);

      // 2. Or redirect to a full view page:
      // router.push(`/prompt/${prompt._id}`);
    } catch (error) {
      console.error("Error counting view", error);
    }
  };

  //Function for copy prompt
  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard");
    } catch (error) {
      console.error("Error copying prompt", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-6">
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
            {loading && (
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
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={fetchPrompts}>Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && prompts.length === 0 && (
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

            {/* Prompt Cards */}
            {!loading &&
              !error &&
              prompts.length > 0 &&
              prompts.map((prompt) => (
                <Card
                  key={prompt._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={prompt.creator.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {prompt.creator.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{prompt.creator.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(prompt.createdAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{prompt.category}</Badge>
                        {prompt.price ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="bg-green-100 text-green-800">
                                <Coins className="h-3 w-3 mr-1" />
                                {prompt.price}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Credits</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2 capitalize">
                        {prompt.title}
                      </h3>
                      <p className="text-gray-600 capitalize">
                        {prompt.description}
                      </p>
                    </div>

                    {/* Preview Content */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {prompt.price ? (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <Lock className="h-8 w-8 mr-2" />
                          <span>Preview available after purchase</span>
                        </div>
                      ) : (
                        <div>
                          {prompt.resultType === "image" ? (
                            <Image
                              width={400}
                              height={400}
                              src={prompt.resultContent || "/placeholder.svg"}
                              alt="Prompt result"
                              className="w-full rounded-lg"
                            />
                          ) : prompt.resultType === "video" ? (
                            <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                              <video
                                controls
                                preload="metadata"
                                className="w-full h-auto max-h-[500px] rounded-xl bg-black"
                                poster="/video-thumbnail.png" // optional placeholder
                              >
                                <source
                                  src={prompt.resultContent || ""}
                                  type="video/mp4"
                                />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap text-black capitalize">
                              {prompt.resultContent}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.map((tag, index) => (
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
                      Generated with {prompt.aiModel}
                    </div>
                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* LIKES BUTTON */}
                        <Button
                          onClick={() => handleLikePrompt(prompt._id)}
                          variant="ghost"
                          size="sm"
                          title="Like this prompt"
                        >
                          <Heart
                            className={`h-4 w-4 mr-2 ${
                              prompt.likes.includes(user?._id ?? "")
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                          />
                          {prompt.likes.length}
                        </Button>
                        {/* COMMENTS BUTTON */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [prompt._id]: !prev[prompt._id],
                            }))
                          }
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {Array.isArray(prompt.comments)
                            ? prompt.comments.length
                            : 0}
                        </Button>
                        {/* SHARE BUTTON */}
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        {/* view count show  */}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          {prompt.views}
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        {prompt.price ? (
                          <Button
                            size="sm"
                            onClick={() => handleViewPrompt(prompt)}
                          >
                            Buy for ${prompt.price}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPrompt(prompt)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full
                          </Button>
                        )}
                      </div>
                    </div>
                    <>
                      {openComments[prompt._id] && (
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

                          {/* Show Existing Comments */}
                          <div className="space-y-2 ">
                            {prompt.comments?.length === 0 && (
                              <p className="text-sm text-gray-400">
                                No comments yet.
                              </p>
                            )}
                            {prompt.comments.map((comment) => (
                              <CommentThread
                                key={comment._id}
                                comment={comment}
                                currentUserId={user?._id as string}
                                promptId={prompt._id}
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
      {/* Prompt Detail Modal */}
      <Dialog open={showPromptModal} onOpenChange={setShowPromptModal}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-xl p-6">
          {selectedPrompt && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={
                          selectedPrompt.creator.avatar || "/placeholder.svg"
                        }
                      />
                      <AvatarFallback>
                        {selectedPrompt.creator.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-left">
                        {selectedPrompt.title}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        by {selectedPrompt.creator.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt- mr-8">
                    <Badge variant="secondary">{selectedPrompt.category}</Badge>
                    {selectedPrompt.price ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className="bg-green-100 text-green-800">
                            <Coins className="h-3 w-3 mr-1" />
                            {selectedPrompt.price}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Credits</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>
                </div>
                <DialogDescription className="text-left mt-4">
                  {selectedPrompt.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Prompt Content */}
                <div className="space-y-4">
                  <h4 className="font-medium">The Prompt</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm font-mono">
                      {selectedPrompt.price
                        ? "🔒 Full prompt available after purchase. This is a premium prompt that generates high-quality results for professional use."
                        : selectedPrompt.promptText}
                    </p>
                  </div>
                </div>
                {/* 👈 CLOSE the “Prompt” wrapper */}
                {/* Generated Result */}
                <div className="space-y-4">
                  <h4 className="font-medium">Generated Result</h4>
                  <div className="bg-muted rounded-lg p-4 max-w-full">
                    {selectedPrompt.resultType === "image" ? (
                      <div className="relative w-full h-[400px]">
                        <Image
                          fill
                          src={
                            selectedPrompt.resultContent || "/placeholder.svg"
                          }
                          alt="Generated result"
                          className="rounded-lg object-contain"
                        />
                      </div>
                    ) : selectedPrompt.resultType === "video" ? (
                      <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
                        <video
                          controls
                          preload="metadata"
                          className="w-full h-auto max-h-[500px] rounded-xl bg-black"
                          poster="/video-thumbnail.png" // optional placeholder
                        >
                          <source
                            src={selectedPrompt.resultContent || ""}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm leading-relaxed">
                          {selectedPrompt.resultContent}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <p>
                            This is the complete generated result. You can copy
                            and use this content freely.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Model:</span>
                        <span className="font-medium">
                          {selectedPrompt.aiModel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(selectedPrompt.createdAt))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">
                          {selectedPrompt.category}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Author:</span>
                        <span className="font-medium">
                          {selectedPrompt.creator.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Engagement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Likes:</span>
                        <span className="font-medium">
                          {selectedPrompt.likes.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comments:</span>
                        <span className="font-medium">
                          {selectedPrompt.comments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shares:</span>
                        <span className="font-medium">
                          {/* TODO: add share functionality */}
                          {/* {selectedPrompt.shares.length} */}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views:</span>
                        <span className="font-medium">
                          {selectedPrompt.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tags */}
                <div className="space-y-3">
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => handleLikePrompt(selectedPrompt._id)}
                      variant="ghost"
                      size="sm"
                      title="Like this prompt"
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${
                          selectedPrompt.likes.includes(user?._id ?? "")
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      />
                      {selectedPrompt.likes.length}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {selectedPrompt?.comments?.map((comment) => (
                        <>{comment.text}</>
                      ))}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      {selectedPrompt.views}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    {selectedPrompt.price ? (
                      <Button className="bg-primary ">
                        Buy for <Coins className="h-4 w-4" />
                        {selectedPrompt.price}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleCopyPrompt(selectedPrompt.promptText)
                        }
                      >
                        Copy Prompt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
