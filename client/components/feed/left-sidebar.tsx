// components/GoogleLoginButton.tsx

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Bookmark,
  DollarSign,
  Home,
  Settings,
  TrendingUp,
  User,
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
          <Link href="/dashboard?tab=prompts">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-3" />
              My Prompts
            </Button>
          </Link>
          <Link href="/dashboard?tab=earnings">
            <Button variant="ghost" className="w-full justify-start">
              <DollarSign className="h-4 w-4 mr-3" />
              Earnings
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
