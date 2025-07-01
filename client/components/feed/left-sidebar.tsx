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

export default function LeftSidebar() {
  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-24">
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
          <Link href="/feed/saved">
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
          <Link href="/dashboard?tab=prompts">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-3" />
              My Prompts
            </Button>
          </Link>
          <Link href="/dashboard?tab=earnings">
            <Button variant="ghost" className="w-full justify-start">
              <Coins className="h-4 w-4 mr-3" />
              Earnings
            </Button>
          </Link>
          <Link href="/dashboard?tab=analytics">
            <Button variant="ghost" className="w-full justify-start">
              <ChartNoAxesCombined className="h-4 w-4 mr-3" />
              Analytics
            </Button>
          </Link>
          <Link href="/dashboard?tab=profile">
            <Button variant="ghost" className="w-full justify-start">
              <UserRoundPen className="h-4 w-4 mr-3" />
              Profile
            </Button>
          </Link>
          <Link href="/dashboard?tab=settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
