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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { UserNav } from "@/components/user-nav";

// Mock data
const prompts: {
  id: number;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  category: string;
  type: "free" | "paid";
  price?: number;
  likes: number;
  comments: number;
  shares: number;
  aiModel: string;
  resultType: "text" | "image" | "video";
  tags: string[];
  preview: string;
  createdAt: string;
}[] = [
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
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    aiModels: [] as string[],
    priceRange: [0, 100],
    sortBy: "newest",
    resultType: "all",
    tags: [] as string[],
  });

  interface IPrompt {
    id: number;
    title: string;
    description: string;
    author: string;
    authorAvatar: string;
    category: string;
    type: "free" | "paid";
    price?: number;
    likes: number;
    comments: number;
    shares: number;
    aiModel: string;
    resultType: "text" | "image" | "video";
    tags: string[];
    preview: string;
    createdAt: string;
  }

  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const handleFilterChange = (
    key: string,
    value: string | number | number[] // Accepts string, number, or number[] for filters
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAIModelToggle = (model: string) => {
    setFilters((prev) => ({
      ...prev,
      aiModels: prev.aiModels.includes(model)
        ? prev.aiModels.filter((m) => m !== model)
        : [...prev.aiModels, model],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      aiModels: [],
      priceRange: [0, 100],
      sortBy: "newest",
      resultType: "all",
      tags: [],
    });
  };

  const handleViewPrompt = (prompt: IPrompt) => {
    setSelectedPrompt(prompt);
    setShowPromptModal(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-50 dark:bg-neutral-950 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">Prompt Hub</span>
              </Link>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prompts..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
              <ThemeToggle />
              <UserNav />
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
                  <Dialog
                    open={showFiltersModal}
                    onOpenChange={setShowFiltersModal}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                        {(filters.aiModels.length > 0 ||
                          filters.tags.length > 0 ||
                          filters.resultType !== "all") && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {filters.aiModels.length +
                              filters.tags.length +
                              (filters.resultType !== "all" ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Filter Prompts</DialogTitle>
                        <DialogDescription>
                          Refine your search to find the perfect AI prompts
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* AI Models */}
                        <div className="space-y-3">
                          <h4 className="font-medium">AI Models</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "GPT-4",
                              "GPT-3.5",
                              "Claude",
                              "DALL-E 3",
                              "DALL-E 2",
                              "Midjourney",
                              "Stable Diffusion",
                              "Gemini",
                            ].map((model) => (
                              <div
                                key={model}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={model}
                                  checked={filters.aiModels.includes(model)}
                                  onCheckedChange={() =>
                                    handleAIModelToggle(model)
                                  }
                                />
                                <Label htmlFor={model} className="text-sm">
                                  {model}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Result Type */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Result Type</h4>
                          <RadioGroup
                            value={filters.resultType}
                            onValueChange={(value) =>
                              handleFilterChange("resultType", value)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="all" />
                              <Label htmlFor="all">All Types</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="text" id="text" />
                              <Label htmlFor="text">Text Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="image" id="image" />
                              <Label htmlFor="image">Images Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="video" id="video" />
                              <Label htmlFor="video">Videos Only</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <Separator />

                        {/* Price Range */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Price Range</h4>
                          <div className="px-3">
                            <Slider
                              value={filters.priceRange}
                              onValueChange={(value) =>
                                handleFilterChange("priceRange", value)
                              }
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-2">
                              <span>Free</span>
                              <span>
                                ${filters.priceRange[0]} - $
                                {filters.priceRange[1]}+
                              </span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Popular Tags */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Popular Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "marketing",
                              "design",
                              "coding",
                              "writing",
                              "business",
                              "education",
                              "social-media",
                              "copywriting",
                              "logo",
                              "branding",
                              "productivity",
                              "automation",
                            ].map((tag) => (
                              <Badge
                                key={tag}
                                variant={
                                  filters.tags.includes(tag)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => handleTagToggle(tag)}
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Sort By */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Sort By</h4>
                          <RadioGroup
                            value={filters.sortBy}
                            onValueChange={(value) =>
                              handleFilterChange("sortBy", value)
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="newest" id="newest" />
                              <Label htmlFor="newest">Newest First</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="popular" id="popular" />
                              <Label htmlFor="popular">Most Popular</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="price-low"
                                id="price-low"
                              />
                              <Label htmlFor="price-low">
                                Price: Low to High
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="price-high"
                                id="price-high"
                              />
                              <Label htmlFor="price-high">
                                Price: High to Low
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="rating" id="rating" />
                              <Label htmlFor="rating">Highest Rated</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={clearAllFilters}>
                          Clear All
                        </Button>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowFiltersModal(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => setShowFiltersModal(false)}>
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                        <Button
                          size="sm"
                          onClick={() => handleViewPrompt(prompt)}
                        >
                          Buy for ${prompt.price}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPrompt(prompt)}
                        >
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
                    <span className="text-sm text-gray-600">
                      Active Creators
                    </span>
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
      {/* Prompt Detail Modal */}
      <Dialog open={showPromptModal} onOpenChange={setShowPromptModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPrompt && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={selectedPrompt.authorAvatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {selectedPrompt.author
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-left">
                        {selectedPrompt.title}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        by {selectedPrompt.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{selectedPrompt.category}</Badge>
                    {selectedPrompt.type === "paid" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <DollarSign className="h-3 w-3 mr-1" />$
                        {selectedPrompt.price}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>
                </div>
                <DialogDescription className="text-left mt-4">
                  {selectedPrompt.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Prompt Content */}
                <div className="space-y-4">
                  <h4 className="font-medium">The Prompt</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm font-mono">
                      {selectedPrompt.type === "paid"
                        ? "🔒 Full prompt available after purchase. This is a premium prompt that generates high-quality results for professional use."
                        : selectedPrompt.preview}
                    </p>
                  </div>
                </div>{" "}
                {/* 👈 CLOSE the “Prompt” wrapper */}
                {/* Generated Result */}
                <div className="space-y-4">
                  <h4 className="font-medium">Generated Result</h4>
                  <div className="bg-muted rounded-lg p-4">
                    {selectedPrompt.type === "paid" ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Lock className="h-12 w-12 mb-4" />
                        <h3 className="font-medium mb-2">Premium Content</h3>
                        <p className="text-sm text-center mb-6 max-w-md">
                          This is a premium prompt with exclusive content.
                          Purchase to unlock the full prompt and see the
                          complete generated result.
                        </p>
                        <Button className="bg-gradient-to-r from-primary to-secondary">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Buy for ${selectedPrompt.price}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {selectedPrompt.resultType === "image" ? (
                          <Image
                            src={selectedPrompt.preview || "/placeholder.svg"}
                            alt="Generated result"
                            className="w-full rounded-lg max-h-96 object-cover"
                          />
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm leading-relaxed">
                              {selectedPrompt.preview}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              <p>
                                This is the complete generated result. You can
                                copy and use this content freely.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Model:</span>
                        <span className="font-medium">
                          {selectedPrompt.aiModel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Result Type:
                        </span>
                        <span className="font-medium capitalize">
                          {selectedPrompt.resultType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {selectedPrompt.createdAt}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">
                          {selectedPrompt.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Engagement</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Likes:</span>
                        <span className="font-medium">
                          {selectedPrompt.likes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comments:</span>
                        <span className="font-medium">
                          {selectedPrompt.comments}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shares:</span>
                        <span className="font-medium">
                          {selectedPrompt.shares}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Tags */}
                <div className="space-y-3">
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      {selectedPrompt.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {selectedPrompt.comments}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    {selectedPrompt.type === "paid" ? (
                      <Button className="bg-gradient-to-r from-primary to-secondary">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Buy for ${selectedPrompt.price}
                      </Button>
                    ) : (
                      <Button variant="outline">Copy Prompt</Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
