"use client";

import {
  Coins,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { IPrompt } from "@/types/prompts.type";
import { toast } from "sonner";
import countAllComments from "@/helper/count-all-nested-comments";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import useSWR, { mutate } from "swr";
import Masonry from "react-masonry-css";
import { getEmbeddableVideoUrl } from "@/helper/getEmbeddableVideoUrl";
import isValidUrl from "@/helper/check-url";
import isWhitelistedDomain from "@/helper/isWhiteListedDomain";
import LoadingCom from "@/components/shared/loading-com";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditPromptModal from "@/components/dashboard/my-prompts/EditPromptModal";
import CreatePromptModal from "@/components/shared/create-prompt-modal";
import { Input } from "@/components/ui/input";

const breakpointColumnsObj = {
  default: 3,
  1024: 2,
  768: 1,
};

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data?.data) ? json.data.data : [];
};

export default function MyPromptsPage() {
  const { data: myPrompts = [], isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/my-prompts`,
    fetcher
  );

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [openCreateModal, setOpenCreateModal] = useState(false);
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

  const openEdit = (prompt: IPrompt) => {
    setSelectedPrompt(prompt);
    setIsEditOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deletePrompt = async (prompt: IPrompt) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/${prompt._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      toast.success(data.message || "Prompt deleted successfully");

      await mutate(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/my-prompts`
      );
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    }
  };

  const filteredPrompts = myPrompts.filter((prompt: IPrompt) => {
    const query = searchQuery.toLowerCase();
    return (
      prompt.title?.toLowerCase().includes(query) ||
      prompt.description?.toLowerCase().includes(query) ||
      prompt.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  if (isLoading) return <LoadingCom displayText="Loading your prompts..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Sort
          </Button>
        </div>
      </div>

      {isSearching && <LoadingCom displayText="Searching..." />}

      {!isSearching && filteredPrompts.length === 0 && myPrompts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No prompts match your search.
              </p>
              <Button onClick={() => setOpenCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredPrompts.length === 0 && myPrompts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No prompts found.</p>
              <Button onClick={() => setOpenCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-6"
        columnClassName="flex flex-col gap-6"
      >
        {filteredPrompts.map((prompt: IPrompt) => (
          <Card key={prompt._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="space-y-4 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={prompt.creator.avatar || "/placeholder.svg"}
                      alt={prompt.creator.name || "User avatar"}
                    />
                    <AvatarFallback>
                      {prompt.creator.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
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
                <div className="flex items-center gap-2 capitalize">
                  <Badge variant="secondary">{prompt.category}</Badge>
                  {prompt.paymentStatus === "paid" ? (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-xl font-semibold mb-1 capitalize">
                  {prompt.title}
                </h3>
                <div className="text-gray-600 text-sm whitespace-pre-wrap capitalize break-words w-full overflow-hidden">
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
                      {expandedDescriptions[prompt._id]
                        ? "See less"
                        : "See more"}
                    </button>
                  )}
                </div>
              </div>

              {/* Content Preview */}
              <div
                className={`${
                  prompt?.resultType === "text"
                    ? "bg-gray-200 dark:bg-gray-50"
                    : ""
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
                        loading="lazy"
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
                      isValidUrl(prompt.resultContent)
                        ? prompt.resultContent
                        : ""
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
                        className="text-blue-500 hover:underline mt-2 text-sm"
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
              <div className="flex justify-between items-center gap-4 text-sm text-muted-foreground mt-auto">
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
                <div className="space-x-2">
                  <Button
                    onClick={() => openEdit(prompt)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your prompt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePrompt(prompt)}
                          className="bg-red-500 text-white hover:bg-transparent hover:text-red-500 border border-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </Masonry>

      {isEditOpen && selectedPrompt && (
        <EditPromptModal
          open={isEditOpen}
          prompt={selectedPrompt}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() =>
            mutate(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/my-prompts`
            )
          }
        />
      )}

      <CreatePromptModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={() =>
          mutate(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/my-prompts`
          )
        }
      />
    </div>
  );
}
