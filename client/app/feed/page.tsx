"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Plus } from "lucide-react";
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { IPrompt } from "@/types/prompts.type";
import { usePrompts } from "@/hooks/usePrompts";
import PromptCard from "@/components/shared/prompt-card";
import { useLoginPrompt } from "@/contexts/login-prompt-context";
import { usePromptModal } from "@/contexts/prompt-modal-context";

export default function FeedPage() {
  const { user, updateUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    aiModels: [] as string[],
    priceRange: [0, 100],
    sortBy: "newest",
    resultType: "all",
    tags: [] as string[],
  });

  const { openModal } = usePromptModal();

  const { prompts, isLoading, error, mutate } = usePrompts(
    filters,
    selectedCategory
  );

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

  const { triggerLoginModal } = useLoginPrompt();

  const handleCopyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt) return;

      // Check if user is logged in
      if (!user) {
        triggerLoginModal();
        return;
      }

      const isOwner = prompt.creator?._id === user?._id;
      const isFree = prompt.paymentStatus === "free";
      const isPurchased = user?.purchasedPrompts?.includes(prompt._id);

      // Copy directly if allowed
      if (isFree || isOwner || isPurchased) {
        await navigator.clipboard.writeText(prompt.promptText);
        toast.success("Prompt copied to clipboard");
        return;
      }

      // User not logged in
      // if (handleProtectedAction()) return;

      // Purchase prompt
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/${prompt._id}/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Purchase failed. Try again.");
      }

      // Update user context with new credits and purchased prompt
      updateUser({
        credits: data.data.updatedCredits,
        purchasedPrompts: [...(user?.purchasedPrompts || []), prompt._id],
      });

      // Copy prompt after purchase
      await navigator.clipboard.writeText(prompt.promptText);
      toast.success("Prompt purchased and copied to clipboard");
    } catch (error) {
      console.error("Error using prompt:", error);
      toast.error("Failed to use this prompt");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-3">
        <div className="">
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
                    className="cursor-pointer"
                  >
                    All
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "marketing" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("marketing")}
                    className="cursor-pointer"
                  >
                    Marketing
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "design" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("design")}
                    className="cursor-pointer"
                  >
                    Design
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "programming" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("programming")}
                    className="cursor-pointer"
                  >
                    Programming
                  </Button>
                  <Button
                    variant={
                      selectedCategory === "Image" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("Image")}
                    className="cursor-pointer"
                  >
                    Image
                  </Button>
                  <Dialog
                    open={showFiltersModal}
                    onOpenChange={setShowFiltersModal}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        More
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
                            onValueChange={(value: string) =>
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
                              onValueChange={(value: number[]) =>
                                handleFilterChange("priceRange", value)
                              }
                              max={1000}
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
                            onValueChange={(value: string) =>
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

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading prompts...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">
                      {typeof error === "string"
                        ? error
                        : error?.message || "Something went wrong"}
                    </p>
                    <Button onClick={() => mutate()}>Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && prompts.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No prompts found.</p>
                    <Button onClick={openModal}>
                      <Plus />
                      Create Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prompt Cards */}
            {!isLoading &&
              !error &&
              prompts.length > 0 &&
              prompts.map((prompt: IPrompt) => (
                <PromptCard
                  key={prompt._id}
                  prompt={prompt}
                  mutatePrompts={mutate}
                  handleCopyPrompt={handleCopyPrompt}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
