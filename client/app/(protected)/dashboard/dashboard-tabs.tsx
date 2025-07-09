"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/dashboard/components/profile/user-nav";
import MyPromptsTab from "@/components/dashboard/my-prompts-tab";
import EarningsTab from "@/components/dashboard/earnings-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import ProfileTab from "@/components/dashboard/profile-tab";
import SettingsTab from "@/components/dashboard/settings-tab";
import OverViewTab from "@/components/dashboard/overview-tab";

export default function DashboardTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tabParam);

  const handleBackToFeed = () => router.push("/feed");

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-neutral-950 border-b dark:border-gray-700 fixed top-0 w-full z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                  <span>Dashboard</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your prompts and track performance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => handleBackToFeed()} variant="outline">
                Back to Feed
              </Button>
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

          {/* My Prompts Tab */}
          <OverViewTab value="overview" />
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
    </>
  );
}
