import {
  Coins,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TabsContent } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { useCallback, useEffect, useState } from "react";
import { IPrompt } from "@/types/prompts.type";
import { toast } from "sonner";
import { EditPromptModal } from "./components/prompt/EditPromptModal";
import countAllComments from "@/utils/count-all-nested-comments";

const MyPromptsTab = ({ value }: { value: string }) => {
  const [myPrompts, setMyPrompts] = useState<IPrompt[]>([]);
  console.log("myPrompts:", myPrompts);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const openEdit = (prompt: IPrompt) => {
    setSelectedPrompt(prompt);
    setIsEditOpen(true);
  };

  // Function for handling fetch prompts
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
  // Function for delete prompt
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

      // Option 1: Refetch all prompts
      // await fetchPrompts();

      // Option 2: Remove from state directly (faster UI update)
      setMyPrompts((prev) => prev.filter((p) => p._id !== prompt._id));
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt.");
    }
  };

  // fetch prompts from database
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      console.log(e.key);
      setIsEditOpen(false);
    }
  };

  return (
    <TabsContent
      onKeyDown={handleKeyPress}
      tabIndex={-1} // ✅ This makes the div focusable so it can receive keyboard events
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

      <div className="grid gap-6">
        {myPrompts.map((prompt) => (
          <Card key={prompt._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{prompt.title}</h3>
                    {/* <Badge
                      variant={
                        prompt.status === "published" ? "default" : "secondary"
                      }
                    >
                      {prompt.status}
                    </Badge> */}
                    <Badge variant="outline">{prompt.category}</Badge>
                    {prompt.isPaid === true ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Coins className="h-3 w-3 mr-1" />
                        {prompt.price}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{prompt.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{prompt.likes.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span> {countAllComments(prompt.comments)}</span>
                    </div>
                    {prompt.isPaid === true && (
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4" />
                        <span>{prompt?.price} earned</span>
                      </div>
                    )}
                    <span>
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(prompt.createdAt))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => openEdit(prompt)}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => deletePrompt(prompt)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {isEditOpen && selectedPrompt && (
        <EditPromptModal
          prompt={selectedPrompt}
          onClose={() => setIsEditOpen(false)}
          fetchPrompts={fetchPrompts}
        />
      )}
    </TabsContent>
  );
};

export default MyPromptsTab;
