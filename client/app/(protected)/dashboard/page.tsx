"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { DollarSign, Eye, Heart, TrendingUp, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/components/profile/user-nav";
import { useRouter, useSearchParams } from "next/navigation";
import MyPromptsTab from "@/components/dashboard/my-prompts-tab";
import EarningsTab from "@/components/dashboard/earnings-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import ProfileTab from "@/components/dashboard/profile-tab";
import SettingsTab from "@/components/dashboard/settings-tab";
import CreatePromptModal from "@/components/shared/create-prompt-modal";
// import { mutate } from "swr";

// Mock data
const statsData = [
  { name: "Jan", earnings: 120, views: 2400 },
  { name: "Feb", earnings: 190, views: 1398 },
  { name: "Mar", earnings: 300, views: 9800 },
  { name: "Apr", earnings: 280, views: 3908 },
  { name: "May", earnings: 450, views: 4800 },
  { name: "Jun", earnings: 380, views: 3800 },
];

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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const totalEarnings = myPrompts.reduce(
    (sum, prompt) => sum + prompt.earnings,
    0
  );
  const totalViews = myPrompts.reduce((sum, prompt) => sum + prompt.views, 0);
  const totalLikes = myPrompts.reduce((sum, prompt) => sum + prompt.likes, 0);
  const publishedPrompts = myPrompts.filter(
    (p) => p.status === "published"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-950 border-b dark:border-gray-700 fixed top-0 w-full z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your prompts and track performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setOpenCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
              <CreatePromptModal
                open={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
                onSuccess={() => {
                  // mutate("/api/prompt"); // ✅ Refresh feed
                }}
              />
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 mt-20">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            router.push(`/dashboard?tab=${value}`);
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompts">My Prompts</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Earnings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${totalEarnings.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalViews.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Likes
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalLikes}</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Published Prompts
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{publishedPrompts}</div>
                  <p className="text-xs text-muted-foreground">
                    {myPrompts.length - publishedPrompts} drafts
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="earnings" fill="#882EFB" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Views Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#2B5BFC"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest prompt interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      action: "New comment",
                      prompt: "LinkedIn Post Generator",
                      time: "2 hours ago",
                    },
                    {
                      action: "Prompt purchased",
                      prompt: "Logo Design Collection",
                      time: "5 hours ago",
                    },
                    {
                      action: "New like",
                      prompt: "Code Review Assistant",
                      time: "1 day ago",
                    },
                    {
                      action: "Prompt viewed",
                      prompt: "LinkedIn Post Generator",
                      time: "2 days ago",
                    },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {activity.prompt}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* My Prompts Tab */}
          <MyPromptsTab value="prompts" />
          {/* Earnings Tab */}
          <EarningsTab value="earnings" />
          {/* Analytics Tab */}
          <AnalyticsTab value="analytics" />
          {/* Profile Tab */}
          <ProfileTab value="profile" />
          {/* Settings Tab */}
          <SettingsTab value="settings" />
        </Tabs>
      </div>
    </div>
  );
}
