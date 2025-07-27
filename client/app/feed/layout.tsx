"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserNav } from "@/components/dashboard/settings/profile/user-nav";
import { useState } from "react";
import RightSidebar from "@/components/feed/right-sidebar";
import LeftSidebar from "@/components/feed/left-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { usePromptModal } from "@/contexts/prompt-modal-context";

interface FeedLayoutProps {
  children: React.ReactNode;
}

export default function FeedLayout({ children }: FeedLayoutProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { openModal } = usePromptModal();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-50 dark:bg-neutral-950 border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                {/* <Sparkles className="h-8 w-8 text-blue-600" /> */}
                <h1 className="text-2xl ml-5 font-bold text-slate-800 dark:text-slate-50 tracking-tight">
                  Prompt Hub
                </h1>
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
              {user && (
                <>
                  <Button onClick={openModal} className="cursor-pointer">
                    <Plus />
                    Create Prompt
                  </Button>
                </>
              )}
              <ThemeToggle />
              {user ? (
                <UserNav />
              ) : (
                <Link href="/auth/login">
                  <Button variant="default" className="cursor-pointer">
                    Log in
                  </Button>
                </Link>
              )}
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
