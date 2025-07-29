"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { IPrompt } from "@/types/prompts.type";
import { PublicProfileModal } from "@/components/shared/public-profile-modal";
import { IPublicUser } from "@/types/publicUser.type";
import PromptCard from "@/components/shared/prompt-card";
import { useLoginPrompt } from "@/contexts/login-prompt-context";
import { usePromptModal } from "@/contexts/prompt-modal-context";
import { useTradingsPrompts } from "@/hooks/useTradingsPrompts";

export default function FeedPage() {
  const { user, updateUser } = useAuth();
  const { prompts, isLoading, error, mutate } = useTradingsPrompts();
  const { triggerLoginModal } = useLoginPrompt();
  const { openModal } = usePromptModal();

  const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [publicUserData, setPublicUserData] = useState<IPublicUser>();

  const handleCopyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt) return;

      if (!user) {
        triggerLoginModal();
        return;
      }

      const isOwner = prompt.creator?._id === user?._id;
      const isFree = prompt.paymentStatus === "free";
      const isPurchased = user?.purchasedPrompts?.includes(prompt._id);

      if (isFree || isOwner || isPurchased) {
        await navigator.clipboard.writeText(prompt.promptText);
        toast.success("Prompt copied to clipboard");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/prompts/${prompt._id}/buy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || "Purchase failed.");

      updateUser({
        credits: data.data.updatedCredits,
        purchasedPrompts: [...(user?.purchasedPrompts || []), prompt._id],
      });

      await navigator.clipboard.writeText(prompt.promptText);
      toast.success("Prompt purchased and copied to clipboard");
    } catch (error) {
      console.error("Error using prompt:", error);
      toast.error("Failed to use this prompt");
    }
  };

  const handlePublicProfile = async (userId: string) => {
    if (!user) return triggerLoginModal();

    try {
      setIsLoadingPublicProfile(true);
      setShowPublicProfile(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile/basic/${userId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();
      setPublicUserData(data.data.profile);
      setIsLoadingPublicProfile(false);
    } catch (error) {
      console.error("Error loading public profile:", error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-3">
        <div className="space-y-6">
          {/* Loading */}
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

          {/* Error */}
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

          {/* Empty */}
          {!isLoading && !error && prompts.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No prompts found.</p>
                  <Button onClick={openModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public profile modal */}
          {showPublicProfile && publicUserData && (
            <PublicProfileModal
              user={publicUserData}
              open={showPublicProfile}
              onOpenChange={setShowPublicProfile}
              isLoading={isLoadingPublicProfile}
            />
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
                handlePublicProfile={handlePublicProfile}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
