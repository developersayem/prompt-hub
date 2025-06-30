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
import { IPrompt } from "@/types/prompts-type";
import { toast } from "sonner";

const MyPromptsTab = ({ value }: { value: string }) => {
  const [myPrompts, setMyPrompts] = useState<IPrompt[]>([]);
  console.log("myPrompts:", myPrompts);

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
      toast.success("Prompts fetched successfully!");
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setMyPrompts([]);
      toast.error("Failed to fetch prompts.");
    }
  }, []);

  // fetch prompts from database
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // const handleSave = async (updated: Prompt) => {
  //   // optional: send PATCH request to backend
  //   console.log("Saving updated prompt:", updated);
  // };

  return (
    <TabsContent value={value} className="space-y-6">
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
                      <span>999 views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{prompt.likes.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{prompt.comments.length}</span>
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
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );
};

export default MyPromptsTab;
