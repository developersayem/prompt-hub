"use client";

import {
  Clipboard,
  Coins,
  EllipsisVertical,
  Eye,
  Heart,
  MessageCircle,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { IPrompt } from "@/types/prompts.type";
import { toast } from "sonner";
import countAllComments from "@/helper/count-all-nested-comments";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useSWR from "swr";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";
import isValidUrl from "@/helper/check-url";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import LoadingCom from "@/components/shared/loading-com";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShareDialog } from "@/components/shared/share-dialog";
import { fetcher } from "@/utils/fetcher";
import { useAuth } from "@/contexts/auth-context";

export default function MyPromptsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    categories: [] as string[],
    paymentStatus: [] as string[],
    resultType: [] as string[],
  });

  const [sortBy, setSortBy] = useState<"createdAt" | "likes" | "views">(
    "createdAt"
  );

  const { data: purchasedPrompts = [], isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/purchase-history`,
    fetcher
  );

  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      setIsSearching(true);
      const timeout = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPrompts = purchasedPrompts
    .filter((prompt: IPrompt) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        prompt.title?.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.tags?.some((tag) => tag.toLowerCase().includes(query));

      const matchCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(prompt.category);

      const matchPayment =
        filters.paymentStatus.length === 0 ||
        filters.paymentStatus.includes(prompt.paymentStatus);

      const matchResultType =
        filters.resultType.length === 0 ||
        filters.resultType.includes(prompt.resultType);

      return matchSearch && matchCategory && matchPayment && matchResultType;
    })
    .sort((a: IPrompt, b: IPrompt) => {
      if (sortBy === "createdAt") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "likes") {
        return b.likes.length - a.likes.length;
      }
      if (sortBy === "views") {
        return b.views - a.views;
      }
      return 0;
    });

  const handleCopyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt) return;

      const isOwner = prompt.creator?._id === user?._id;
      const isFree = prompt.paymentStatus === "free";
      const isPurchased = user?.purchasedPrompts?.includes(prompt._id);

      // Copy directly if allowed
      if (isFree || isOwner || isPurchased) {
        await navigator.clipboard.writeText(prompt.promptText);
        toast.success("Prompt copied to clipboard");
        return;
      }

      // Copy prompt after purchase
      await navigator.clipboard.writeText(prompt.promptText);
      toast.success("Prompt purchased and copied to clipboard");
    } catch (error) {
      console.error("Error using prompt:", error);
      toast.error("Failed to use this prompt");
    }
  };

  // Function for rendering prompt card
  const renderPromptCard = (prompt: IPrompt) => (
    <Card
      key={prompt._id}
      className="hover:shadow-lg transition-shadow w-full max-w-full mb-4 py-0 my-0"
    >
      <CardContent className="p-4 space-y-4 flex flex-col w-full max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="flex-shrink-0">
              <AvatarImage
                src={prompt.creator.avatar || "/placeholder.svg"}
                alt={prompt.creator.name || "User avatar"}
              />
              <AvatarFallback className="uppercase text-xs bold">
                {prompt.creator.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">
                {prompt.creator?.name ?? "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }).format(new Date(prompt.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="capitalize text-xs">
              {prompt.category}
            </Badge>
            {prompt.paymentStatus === "paid" ? (
              <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 text-xs">
                <Coins className="w-3 h-3" /> Paid
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Free
              </Badge>
            )}
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
                    <li className="hover:bg-neutral-50 hover:text-black rounded px-2 cursor-pointer">
                      <ShareDialog
                        shareUrl={`${window.location.origin}/feed/${prompt?.slug}`}
                      />
                    </li>
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-xl font-semibold mb-1 capitalize break-words">
            {prompt.title}
          </h3>
          <div className="text-gray-600 text-sm whitespace-pre-wrap capitalize break-words">
            {expandedDescriptions[prompt._id]
              ? prompt.description
              : (prompt.description ?? "").length > 150
              ? `${(prompt.description ?? "").slice(0, 150)}...`
              : prompt.description}
            {(prompt.description ?? "").length > 150 && (
              <button
                onClick={() => toggleDescription(prompt._id)}
                className="text-blue-500 hover:underline ml-1"
              >
                {expandedDescriptions[prompt._id] ? "See less" : "See more"}
              </button>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div
          className={`${
            prompt?.resultType === "text" ? "bg-gray-200 dark:bg-gray-50" : ""
          } rounded-lg p-4 w-full overflow-hidden`}
        >
          {prompt?.resultType === "image" ? (
            isValidUrl(prompt.resultContent) ? (
              isWhitelistedDomain(prompt.resultContent) ? (
                <Image
                  width={700}
                  height={300}
                  src={prompt.resultContent}
                  alt={prompt.title || "Prompt image"}
                  className="w-full rounded-lg object-contain"
                  loading="lazy"
                  style={{ height: "auto" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prompt.resultContent}
                  alt={prompt.title || "Prompt image"}
                  className="w-full rounded-lg object-contain"
                  loading="lazy"
                  decoding="async"
                  style={{ height: "auto" }}
                />
              )
            ) : (
              <p className="text-center text-sm text-gray-500">
                Invalid image URL
              </p>
            )
          ) : prompt?.resultType === "video" ? (
            <div className="w-full relative overflow-hidden rounded-lg">
              {(() => {
                const embed = getEmbeddableVideoUrl(
                  isValidUrl(prompt.resultContent) ? prompt.resultContent : ""
                );

                if (!embed) {
                  return (
                    <div className="flex items-center justify-center bg-gray-100 aspect-video">
                      <p className="text-center text-sm text-gray-500">
                        Unsupported or private media URL
                      </p>
                    </div>
                  );
                }

                if (embed.type === "video") {
                  return (
                    <video
                      controls
                      preload="metadata"
                      className="w-full aspect-video rounded-lg object-cover bg-black"
                      src={prompt.resultContent}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                }

                // embed.type === "iframe"
                return (
                  <iframe
                    src={embed.url}
                    className="w-full aspect-video rounded-lg"
                    allowFullScreen
                    title={prompt.title || "Embedded video"}
                  />
                );
              })()}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap text-black capitalize break-words">
              {expandedPrompts[prompt._id]
                ? prompt.resultContent
                : prompt.resultContent.length > 200
                ? `${prompt.resultContent.slice(0, 200)}...`
                : prompt.resultContent}
              {prompt.resultContent.length > 200 && (
                <button
                  onClick={() => toggleExpand(prompt._id)}
                  className="text-blue-500 hover:underline mt-2 text-sm block"
                >
                  {expandedPrompts[prompt._id] ? "See less" : "See more"}
                </button>
              )}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" /> {prompt.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" /> {prompt.likes.length}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {countAllComments(prompt.comments)}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => handleCopyPrompt(prompt)}
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Clipboard />
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <LoadingCom displayText="Loading your prompts..." />;
  if (!isLoading && purchasedPrompts.length === 0) {
    return (
      <div className="w-full max-w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven’t any prompts yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {/* Search & Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild className="cursor-pointer">
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-4 ">
              <div className="grid grid-cols-2 gap-4">
                {/* categories */}
                <div>
                  <Label className="mb-2">Category</Label>
                  {["ai", "code", "design"].map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        className="cursor-pointer"
                        checked={filters.categories.includes(cat)}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            categories: checked
                              ? [...prev.categories, cat]
                              : prev.categories.filter((c) => c !== cat),
                          }));
                        }}
                      />
                      <span className="capitalize">{cat}</span>
                    </div>
                  ))}
                </div>
                {/* result type */}
                <div>
                  <Label className="mb-2">Result Type</Label>
                  {["text", "image", "video"].map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        className="cursor-pointer"
                        checked={filters.resultType.includes(type)}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            resultType: checked
                              ? [...prev.resultType, type]
                              : prev.resultType.filter((t) => t !== type),
                          }));
                        }}
                      />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                </div>
                {/* payment status */}
                <div className="col-span-2">
                  <Label className="mb-2">Payment Status</Label>
                  {["paid", "free"].map((status) => (
                    <div key={status} className="flex items-center gap-2">
                      <Checkbox
                        className="cursor-pointer"
                        checked={filters.paymentStatus.includes(status)}
                        onCheckedChange={(checked) => {
                          setFilters((prev) => ({
                            ...prev,
                            paymentStatus: checked
                              ? [...prev.paymentStatus, status]
                              : prev.paymentStatus.filter((s) => s !== status),
                          }));
                        }}
                      />
                      <span className="capitalize">{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="text-red-500 hover:text-red-600 w-full cursor-pointer"
                  onClick={() =>
                    setFilters({
                      categories: [],
                      paymentStatus: [],
                      resultType: [],
                    })
                  }
                >
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2 space-y-2">
              {(["createdAt", "likes", "views"] as const).map((val) => (
                <Button
                  key={val}
                  variant={sortBy === val ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start cursor-pointer"
                  onClick={() => setSortBy(val)}
                >
                  {val === "createdAt" && "Newest"}
                  {val === "likes" && "Most Liked"}
                  {val === "views" && "Most Viewed"}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Loading */}
      {isSearching && <LoadingCom displayText="Searching..." />}

      {/* No results but user has prompts */}
      {!isSearching &&
        filteredPrompts.length === 0 &&
        purchasedPrompts.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No prompts match your search.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Prompts Layout - Masonry Only */}
      {filteredPrompts.length > 0 && (
        <div className="w-full max-w-full overflow-hidden">
          <ResponsiveMasonry
            columnsCountBreakPoints={{
              350: 1,
              768: 2,
              1280: 3,
            }}
          >
            <Masonry gutter="10px">
              {filteredPrompts.map(renderPromptCard)}
            </Masonry>
          </ResponsiveMasonry>
        </div>
      )}
    </div>
  );
}
