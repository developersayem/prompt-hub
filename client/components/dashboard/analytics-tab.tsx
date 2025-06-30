import { TabsContent } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const AnalyticsTab = ({ value }: { value: string }) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  category: "Marketing",
                  prompts: 5,
                  views: 2340,
                  earnings: 45.6,
                },
                {
                  category: "Design",
                  prompts: 3,
                  views: 1890,
                  earnings: 89.3,
                },
                {
                  category: "Programming",
                  prompts: 2,
                  views: 1200,
                  earnings: 21.97,
                },
              ].map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-sm text-gray-600">
                      {cat.prompts} prompts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{cat.views} views</p>
                    <p className="text-sm text-green-600">${cat.earnings}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myPrompts
                .sort((a, b) => b.views - a.views)
                .slice(0, 3)
                .map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{prompt.title}</p>
                      <p className="text-sm text-gray-600">
                        {prompt.views} views
                      </p>
                    </div>
                    <Badge variant="outline">{prompt.category}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default AnalyticsTab;
