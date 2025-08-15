"use client";

import * as React from "react";
import {
  Bell,
  Blocks,
  ChartNoAxesCombined,
  Coins,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Settings2,
  User,
} from "lucide-react";

import { NavMain } from "@/components/dashboard/shared/nav-main";
import { NavSecondary } from "@/components/dashboard/shared/nav-secondary";
import { NavUser } from "@/components/dashboard/shared/nav-user";
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

const mainRoute = "/dashboard";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: `${mainRoute}`,
      icon: LayoutDashboard,
      isActive: false,
      items: [],
    },
    {
      title: "Notifications",
      url: `${mainRoute}/notifications`,
      icon: Bell,
      isActive: false,
      items: [],
    },
    {
      title: "Prompts",
      url: "#",
      icon: Blocks,
      isActive: false,
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
          title: "Drafts",
          url: `${mainRoute}/prompts/drafts`,
        },
        {
          title: "Purchased Prompts",
          url: `${mainRoute}/prompts/purchased-prompts`,
        },
        {
          title: "Reported Prompts",
          url: `${mainRoute}/prompts/reported-prompts`,
        },
      ],
    },
    {
      title: "Analytics",
      url: `${mainRoute}/analytics`,
      icon: ChartNoAxesCombined,
      isActive: false,
      items: [],
    },
    {
      title: "Earnings",
      url: `${mainRoute}/earnings`,
      icon: Coins,
      isActive: false,
      items: [],
    },
    {
      title: "Account",
      url: "#",
      icon: User,
      isActive: false,
      items: [
        {
          title: "Profile",
          url: `${mainRoute}/account/profile`,
        },
        {
          title: "Billing",
          url: `${mainRoute}/account/billing`,
        },
        {
          title: "Get Certified Badge",
          url: `${mainRoute}/account/get-certified`,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      isActive: false,
      items: [
        {
          title: "Security & Privacy",
          url: `${mainRoute}/settings/security-and-privacy`,
        },
        {
          title: "Notifications",
          url: `${mainRoute}/settings/notifications`,
        },
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
  const { user, logout } = useAuth();
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
        <NavUser user={user} logout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
