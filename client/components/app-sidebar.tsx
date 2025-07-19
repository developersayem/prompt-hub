"use client";

import * as React from "react";
import {
  ChartNoAxesCombined,
  Coins,
  LayoutDashboard,
  LifeBuoy,
  Rss,
  Send,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

const mainRoute = "/dashboardv2";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: `${mainRoute}`,
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Prompts",
      url: `${mainRoute}/prompts/my-prompts`,
      icon: Rss,
      items: [
        {
          title: "My Prompts",
          url: `${mainRoute}/prompts/my-prompts`,
        },
        {
          title: "Bookmarks",
          url: `${mainRoute}/prompts/bookmarks`,
        },
        {
          title: "Liked Prompts",
          url: `${mainRoute}/prompts/liked-prompts`,
        },
        {
          title: "Purchased Prompts",
          url: `${mainRoute}/prompts/purchased-prompts`,
        },
      ],
    },
    {
      title: "Analytics",
      url: `${mainRoute}/analytics`,
      icon: ChartNoAxesCombined,
      isActive: true,
      items: [],
    },
    {
      title: "Earnings",
      url: `${mainRoute}/earnings`,
      icon: Coins,
      isActive: true,
      items: [],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "Profile",
          url: `${mainRoute}/settings/profile`,
        },
        {
          title: "Account",
          url: `${mainRoute}/settings/account`,
        },
        {
          title: "Notifications",
          url: `${mainRoute}/settings/notifications`,
        },
        {
          title: "Security & Privacy",
          url: `${mainRoute}/settings/security-and-privacy`,
        },
        // {
        //   title: "Billing",
        //   url: `${mainRoute}/settings/billing`,
        // },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-bold font-sans text-2xl leading-none">
                    Prompt<span className="text-primary-500">Hub</span>
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
