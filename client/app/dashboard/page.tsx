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
import { Badge } from "@/components/ui/badge";
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
import {
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const [activeTab, setActiveTab] = useState("overview");

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
      <header className="bg-white dark:bg-neutral-950 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your prompts and track performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Prompt
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompts">My Prompts</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

          <TabsContent value="prompts" className="space-y-6">
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
                          <h3 className="text-lg font-semibold">
                            {prompt.title}
                          </h3>
                          <Badge
                            variant={
                              prompt.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {prompt.status}
                          </Badge>
                          <Badge variant="outline">{prompt.category}</Badge>
                          {prompt.type === "paid" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <DollarSign className="h-3 w-3 mr-1" />$
                              {prompt.price}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${totalEarnings.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Lifetime earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$89.50</div>
                  <p className="text-sm text-gray-600 mt-2">
                    +23% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Available for Payout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$67.30</div>
                  <Button className="mt-4 w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      date: "2024-01-20",
                      prompt: "Logo Design Collection",
                      amount: 11.69,
                      buyer: "john@example.com",
                    },
                    {
                      date: "2024-01-18",
                      prompt: "Logo Design Collection",
                      amount: 11.69,
                      buyer: "sarah@example.com",
                    },
                    {
                      date: "2024-01-15",
                      prompt: "Logo Design Collection",
                      amount: 11.69,
                      buyer: "mike@example.com",
                    },
                  ].map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b"
                    >
                      <div>
                        <p className="font-medium">{transaction.prompt}</p>
                        <p className="text-sm text-gray-600">
                          Purchased by {transaction.buyer}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +${transaction.amount}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
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
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{cat.category}</p>
                          <p className="text-sm text-gray-600">
                            {cat.prompts} prompts
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{cat.views} views</p>
                          <p className="text-sm text-green-600">
                            ${cat.earnings}
                          </p>
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
                        <div
                          key={prompt.id}
                          className="flex items-center space-x-3"
                        >
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
        </Tabs>
      </div>
    </div>
  );
}
