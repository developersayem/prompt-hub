"use client";

import LoadingCom from "@/components/shared/loading-com";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrompts } from "@/hooks/usePrompts";

export default function AnalyticsPage() {
  const filters = { resultType: "all" };
  const selectedCategory = "all";
  const {
    prompts: myPrompts,
    isLoading,
    error,
    // mutate,
  } = usePrompts(filters, selectedCategory);

  if (isLoading) return <LoadingCom displayText="Loading analytics..." />;
  if (error) return <p>Error: {error.message}</p>;

  return (
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
                  <p className="text-sm text-gray-600">{cat.prompts} prompts</p>
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
  );
}
