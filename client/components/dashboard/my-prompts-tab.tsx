import {
  DollarSign,
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

const MyPromptsTab = ({ value }: { value: string }) => {
  const myPrompts = [
    {
      id: 1,
      title: "Professional LinkedIn Post Generator",
      category: "Marketing",
      type: "free",
      views: 1234,
      likes: 89,
      comments: 23,
      earnings: 0,
      status: "published",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      title: "Logo Design Prompts Collection",
      category: "Design",
      type: "paid",
      price: 12.99,
      views: 567,
      likes: 45,
      comments: 12,
      earnings: 156.87,
      status: "published",
      createdAt: "2024-01-10",
    },
    {
      id: 3,
      title: "Code Review Assistant",
      category: "Programming",
      type: "free",
      views: 890,
      likes: 67,
      comments: 18,
      earnings: 0,
      status: "draft",
      createdAt: "2024-01-20",
    },
  ];
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
          <Card key={prompt.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{prompt.title}</h3>
                    <Badge
                      variant={
                        prompt.status === "published" ? "default" : "secondary"
                      }
                    >
                      {prompt.status}
                    </Badge>
                    <Badge variant="outline">{prompt.category}</Badge>
                    {prompt.type === "paid" ? (
                      <Badge className="bg-green-100 text-green-800">
                        <DollarSign className="h-3 w-3 mr-1" />${prompt.price}
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
                      <span>{prompt.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{prompt.comments}</span>
                    </div>
                    {prompt.type === "paid" && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${prompt.earnings.toFixed(2)} earned</span>
                      </div>
                    )}
                    <span>Created {prompt.createdAt}</span>
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
