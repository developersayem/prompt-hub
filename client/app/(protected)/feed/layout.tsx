"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/components/profile/user-nav";
import { useState } from "react";
import RightSidebar from "@/components/feed/right-sidebar";
import LeftSidebar from "@/components/feed/left-sidebar";
import CreatePromptModal from "@/components/shared/create-prompt-modal";
import { usePrompts } from "@/hooks/usePrompts";

interface FeedLayoutProps {
  children: React.ReactNode;
}

export default function FeedLayout({ children }: FeedLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const filters = { resultType: "all" };
  const selectedCategory = "all";

  const { key, mutate } = usePrompts(filters, selectedCategory); // ⬅ You must call this

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
              <Button onClick={() => setOpenCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
              <CreatePromptModal
                open={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
                onSuccess={() => mutate(key)} // ✅ Properly refetch
              />
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <LeftSidebar />
          {/* Main Content */}
          <div className="lg:col-span-2">{children}</div>
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
