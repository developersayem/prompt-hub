// import { Badge } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingCom from "../shared/loading-com";

interface ITag {
  tag: string;
  count: number;
}
interface ICreator {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  promptCount: number;
  // Add other properties if needed
}
interface ICommunityStats {
  totalPrompts: number;
  activeCreators: number;
  thisWeekPrompts: number;
  // Add more fields if needed
}

export default function RightSidebar() {
  const [topCreators, setTopCreators] = useState<ICreator[]>([]);
  const [tradingTags, setTradingTags] = useState<ITag[]>([]);
  const [communityStats, setCommunityStats] = useState<ICommunityStats>({
    totalPrompts: 0,
    activeCreators: 0,
    thisWeekPrompts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Function for trading tags
  const fetchTradingTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stats/trending-tags`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = Array.isArray(result.data.data) ? result.data.data : [];
      setTradingTags(data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setTradingTags([]);
      toast.error("Failed to fetch prompts.");
    } finally {
      setLoading(false);
    }
  }, []);
  // Function for top creators
  const fetchTopCreators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stats/top-creators`,
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
      setTopCreators(promptsData);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setTopCreators([]);
      toast.error("Failed to fetch prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Function for trading tags
  const fetchCommunityStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stats/community`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCommunityStats(result.data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setCommunityStats({
        totalPrompts: 0,
        activeCreators: 0,
        thisWeekPrompts: 0,
      });
      toast.error("Failed to fetch prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTradingTags();
    fetchTopCreators();
    fetchCommunityStats();
  }, [fetchTopCreators, fetchTradingTags, fetchCommunityStats]);
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
              {loading ? (
                <LoadingCom />
              ) : (
                tradingTags.map(({ tag }, index) => (
                  <Badge
                    key={`tag-${index}`}
                    variant="secondary"
                    className="text-xs"
                  >
                    #{tag} {/* Optional: <span>({count})</span> */}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <LoadingCom />
            ) : (
              topCreators.map((creator, index) => (
                <div
                  key={`creator-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={creator.avatar} alt="Avatar" />
                      <AvatarFallback className="text-xs uppercase">
                        {creator?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {creator.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {creator.promptCount} prompts
                      </p>
                      {/* <Badge variant="outline" className="text-xs">
                      {creator.prompts} prompts
                    </Badge> */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Community Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-200">Total Prompts</span>
              <span className="font-semibold">
                {communityStats?.totalPrompts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-200">Active Creators</span>
              <span className="font-semibold">
                {communityStats?.activeCreators}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-200">This Week</span>
              <span className="font-semibold">
                +{communityStats?.thisWeekPrompts}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
