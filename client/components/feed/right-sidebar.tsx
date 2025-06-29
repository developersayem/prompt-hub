// components/GoogleLoginButton.tsx

// import { Badge } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function RightSidebar() {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="sticky top-24 space-y-6">
        {/* Trending Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trending Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">#marketing</Badge>
              <Badge variant="secondary">#design</Badge>
              <Badge variant="secondary">#ai-art</Badge>
              <Badge variant="secondary">#copywriting</Badge>
              <Badge variant="secondary">#coding</Badge>
              <Badge variant="secondary">#business</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Sarah Chen", prompts: 45 },
              { name: "Mike Johnson", prompts: 32 },
              { name: "Alex Rodriguez", prompts: 28 },
            ].map((creator, index) => (
              <div
                key={`creator-${index}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>
                      {creator.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{creator.name}</p>
                    <p className="text-xs text-gray-500">
                      {creator.prompts} prompts
                    </p>
                    {/* <Badge variant="outline" className="text-xs">
                      {creator.prompts} prompts
                    </Badge> */}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Community Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Prompts</span>
              <span className="font-semibold">12,456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Creators</span>
              <span className="font-semibold">3,289</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-semibold">+234 prompts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
