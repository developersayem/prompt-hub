"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PromptCard from "@/components/shared/PromptCard";
import { IPrompt } from "@/types/prompts.type";
import { useAuth } from "@/contexts/auth-context";
import { usePromptsBySlug } from "@/hooks/usePromptBySlug";
import Link from "next/link";

export default function PromptSlugPage() {
  const params = useParams();
  const slug = params?.slug;
  const { user, updateUser } = useAuth();
  const { prompts, isLoading, error, mutate } = usePromptsBySlug(
    slug as string
  );

  // Copy prompt text with purchase logic
  const handleCopyPrompt = async (prompt: IPrompt) => {
    try {
      if (!prompt) return;

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

      if (!response.ok) throw new Error(data?.message || "Purchase failed");

      updateUser({
        credits: data.data.updatedCredits,
        purchasedPrompts: [...(user?.purchasedPrompts || []), prompt._id],
      });

      await navigator.clipboard.writeText(prompt.promptText);
      toast.success("Prompt purchased and copied to clipboard");
    } catch (error) {
      console.error("Error copying prompt:", error);
      toast.error("Failed to copy prompt");
    }
  };

  // You can define this if you want to support public profiles,
  // otherwise pass noop or remove from props
  const handlePublicProfile = (userId: string) => {
    // e.g. open modal or navigate to user profile page
    console.log("Show public profile for user:", userId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <p className="text-red-600 text-lg mb-4">
          {error || "Prompt not found"}
        </p>
        <Button asChild>
          <Link href="/feed">Back to feed</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-3">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt._id}
            prompt={prompt}
            mutatePrompts={mutate}
            handleCopyPrompt={handleCopyPrompt}
            handlePublicProfile={handlePublicProfile}
          />
        ))}
        <div className="flex justify-center mt-10">
          <Button asChild variant="outline">
            <a href="/feed">Show all prompts</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
