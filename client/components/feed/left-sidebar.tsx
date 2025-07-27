// components/GoogleLoginButton.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Bookmark,
  ChartNoAxesCombined,
  Coins,
  LayoutDashboard,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { useAuth } from "@/contexts/auth-context";

export default function LeftSidebar() {
  const { user } = useAuth();

  const navItems = [
    {
      name: "tradings",
      href: "/feed/trending",
      icon: TrendingUp,
    },
    {
      name: "dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "my prompts",
      href: "/dashboard/prompts/my-prompts",
      icon: User,
    },
    {
      name: "bookmarks",
      href: "/dashboard/prompts/bookmarks",
      icon: Bookmark,
    },
    {
      name: "earnings",
      href: "/dashboard/earnings",
      icon: Coins,
    },
    {
      name: "analytics",
      href: "/dashboard/analytics",
      icon: ChartNoAxesCombined,
    },
    {
      name: "profile",
      href: "/dashboard/settings/profile",
      icon: ChartNoAxesCombined,
    },
    {
      name: "settings",
      href: "/dashboard/settings/account",
      icon: Settings,
    },
  ];

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 py-0 my-0">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start capitalize cursor-pointer"
                >
                  <item.icon />
                  {item.name}
                </Button>
              </Link>
            ))}
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
