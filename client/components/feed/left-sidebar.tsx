// components/GoogleLoginButton.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Bookmark,
  ChartNoAxesCombined,
  Coins,
  Home,
  LayoutDashboard,
  Settings,
  TrendingUp,
  User,
  UserRoundPen,
} from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useAuth } from "@/contexts/auth-context";

export default function LeftSidebar() {
  const { user } = useAuth();

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/feed">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-4 w-4 mr-3" />
                Home Feed
              </Button>
            </Link>
            <Link href="/feed/trending">
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-3" />
                Trending
              </Button>
            </Link>
            <Link href="/dashboard/bookmarks">
              <Button variant="ghost" className="w-full justify-start">
                <Bookmark className="h-4 w-4 mr-3" />
                Saved
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/prompts/my-prompts">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-4 w-4 mr-3" />
                My Prompts
              </Button>
            </Link>
            <Link href="/dashboard/earnings">
              <Button variant="ghost" className="w-full justify-start">
                <Coins className="h-4 w-4 mr-3" />
                Earnings
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" className="w-full justify-start">
                <ChartNoAxesCombined className="h-4 w-4 mr-3" />
                Analytics
              </Button>
            </Link>
            <Link href="/dashboard/settings/profile">
              <Button variant="ghost" className="w-full justify-start">
                <UserRoundPen className="h-4 w-4 mr-3" />
                Profile
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
        {/* user credits Card */}
        {user && (
          <Card className="sticky">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Credits</span>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {user?.credits.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
