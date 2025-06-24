"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Search,
  Filter,
  Plus,
  Sparkles,
  Home,
  TrendingUp,
  User,
  Settings,
  DollarSign,
  Eye,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

// Mock data
const prompts = [
  {
    id: 1,
    title: "Professional LinkedIn Post Generator",
    description: "Generate engaging LinkedIn posts for any industry or topic",
    author: "Sarah Chen",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    category: "Marketing",
    type: "free",
    likes: 234,
    comments: 45,
    shares: 12,
    aiModel: "GPT-4",
    resultType: "text",
    tags: ["linkedin", "marketing", "social-media"],
    preview:
      "Create a professional LinkedIn post about the importance of continuous learning in tech careers...",
    createdAt: "2 hours ago",
  },
  {
    id: 2,
    title: "Stunning Logo Design Prompts",
    description: "Create beautiful, modern logos for any business",
    author: "Mike Johnson",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    category: "Design",
    type: "paid",
    price: 9.99,
    likes: 567,
    comments: 89,
    shares: 34,
    aiModel: "DALL-E 3",
    resultType: "image",
    tags: ["logo", "design", "branding"],
    preview: "/placeholder.svg?height=300&width=300",
    createdAt: "5 hours ago",
  },
  {
    id: 3,
    title: "Code Review Assistant",
    description: "Get detailed code reviews and improvement suggestions",
    author: "Alex Rodriguez",
    authorAvatar: "/placeholder.svg?height=40&width=40",
    category: "Programming",
    type: "free",
    likes: 189,
    comments: 23,
    shares: 8,
    aiModel: "Claude",
    resultType: "text",
    tags: ["code", "review", "programming"],
    preview:
      "Review this React component and suggest improvements for performance and readability...",
    createdAt: "1 day ago",
  },
];

export default function FeedPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-50 dark:bg-neutral-950 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">Prompt Hub</span>
              </Link>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prompts..."
                  className="pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-3" />
                  Home Feed
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Trending
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bookmark className="h-4 w-4 mr-3" />
                  Saved
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-3" />
                  My Prompts
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-3" />
                  Earnings
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "marketing" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("marketing")}
                  >
                    Marketing
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "design" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("design")}
                  >
                    Design
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "programming" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("programming")}
                  >
                    Programming
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Cards */}
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage
                          src={prompt.authorAvatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {prompt.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{prompt.author}</p>
                        <p className="text-sm text-gray-500">
                          {prompt.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{prompt.category}</Badge>
                      {prompt.type === "paid" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <DollarSign className="h-3 w-3 mr-1" />${prompt.price}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {prompt.title}
                    </h3>
                    <p className="text-gray-600">{prompt.description}</p>
                  </div>

                  {/* Preview Content */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {prompt.type === "paid" ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        <Lock className="h-8 w-8 mr-2" />
                        <span>Preview available after purchase</span>
                      </div>
                    ) : (
                      <div>
                        {prompt.resultType === "image" ? (
                          <Image
                            src={prompt.preview || "/placeholder.svg"}
                            alt="Prompt result"
                            className="w-full rounded-lg"
                          />
                        ) : (
                          <p className="text-sm">{prompt.preview}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  {/* AI Model */}
                  <div className="flex items-center text-sm text-gray-500">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generated with {prompt.aiModel}
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        {prompt.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {prompt.comments}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        {prompt.shares}
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      {prompt.type === "paid" ? (
                        <Button size="sm">Buy for ${prompt.price}</Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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
                  { name: "Sarah Chen", prompts: 45, earnings: "$2,340" },
                  { name: "Mike Johnson", prompts: 32, earnings: "$1,890" },
                  { name: "Alex Rodriguez", prompts: 28, earnings: "$1,560" },
                ].map((creator, index) => (
                  <div
                    key={index}
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
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {creator.earnings}
                    </Badge>
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
      </div>
    </div>
  );
}
