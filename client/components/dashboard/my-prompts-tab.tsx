"use client";

import {
  Coins,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TabsContent } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { useCallback, useEffect, useState } from "react";
import { IPrompt } from "@/types/prompts.type";
import { toast } from "sonner";
import countAllComments from "@/utils/count-all-nested-comments";
import Link from "next/link";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import EditPromptModal from "./EditPromptModal";
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
} from "../ui/alert-dialog";

const breakpointColumnsObj = {
  default: 2,
  700: 1,
};

const MyPromptsTab = ({ value }: { value: string }) => {
  const [myPrompts, setMyPrompts] = useState<IPrompt[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});

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

  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/my-prompts`,
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
      setMyPrompts(promptsData);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setMyPrompts([]);
      toast.error("Failed to fetch prompts.");
    }
  }, []);

  const deletePrompt = async (prompt: IPrompt) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompt/${prompt._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast.success(data.message || "Prompt deleted successfully");

      setMyPrompts((prev) => prev.filter((p) => p._id !== prompt._id));
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsEditOpen(false);
    }
  };

  return (
    <TabsContent
      onKeyDown={handleKeyPress}
      tabIndex={-1}
      value={value}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Prompts</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Sort
          </Button>
        </div>
      </div>

      {myPrompts.length === 0 && (
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

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-6"
        columnClassName="flex flex-col gap-6"
      >
        {myPrompts.map((prompt) => (
          <Card key={prompt._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="space-y-4">
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
                      <Coins className="w-3 h-3" />
                      {prompt.paymentStatus}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-1 capitalize">
                  {prompt.title}
                </h3>
                <div className="text-gray-600 text-sm whitespace-pre-wrap capitalize">
                  {expandedDescriptions[prompt._id]
                    ? prompt.description
                    : prompt.description.length > 150
                    ? `${prompt.description.slice(0, 150)}...`
                    : prompt.description}
                  {prompt.description.length > 150 && (
                    <button
                      onClick={() => toggleDescription(prompt._id)}
                      className="text-white hover:underline ml-1"
                    >
                      {expandedDescriptions[prompt._id]
                        ? "See less"
                        : "See more"}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                {prompt.resultType === "image" ? (
                  <Image
                    width={500}
                    height={500}
                    src={prompt.resultContent || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                ) : prompt.resultType === "video" ? (
                  <video
                    controls
                    preload="metadata"
                    className="w-full h-auto max-h-[500px] rounded-xl bg-black"
                  >
                    <source src={prompt.resultContent || ""} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div>
                    <p className="text-sm whitespace-pre-wrap text-black capitalize">
                      {expandedPrompts[prompt._id]
                        ? prompt.resultContent
                        : prompt.resultContent.length > 200
                        ? `${prompt.resultContent.slice(0, 200)}...`
                        : prompt.resultContent}
                    </p>
                    {prompt.resultContent.length > 200 && (
                      <button
                        onClick={() => toggleExpand(prompt._id)}
                        className="text-blue-500 hover:underline mt-2 text-sm"
                      >
                        {expandedPrompts[prompt._id] ? "See less" : "See more"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {prompt.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {prompt.likes.length}
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
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
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
                        <AlertDialogCancel
                          onClick={() => {
                            toast.error("Action cancelled");
                          }}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deletePrompt(prompt);
                          }}
                          className="bg-red-500 text-white border border-red-500 hover:border hover:bg-transparent hover:text-red-500 transition-colors ease-in-out duration-500"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
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
          onSuccess={fetchPrompts} // to refresh after successful update
        />
      )}
    </TabsContent>
  );
};

export default MyPromptsTab;
