"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Open menus based on isActive when first loaded
  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.isActive) {
        initialOpen[item.title] = true;
      }
    });
    setOpenMenus(initialOpen);
  }, [items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive = pathname === item.url;
          const isSubItemActive = item.items?.some(
            (child) => pathname === child.url
          );

          const isOpen =
            openMenus[item.title] ?? (isParentActive || isSubItemActive);

          return (
            <Collapsible key={item.title} asChild open={isOpen}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  onClick={() => {
                    if (item.items?.length) {
                      toggleMenu(item.title);
                    }
                  }}
                >
                  <Link
                    href={item.url}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all w-full ${
                      isParentActive
                        ? "bg-muted text-primary font-medium"
                        : "hover:bg-accent hover:text-primary"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className={`transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                        aria-label="Toggle Submenu"
                      >
                        <ChevronRight />
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-2 mt-1 space-y-0.5">
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={subItem.url}
                                  className={`block px-3 py-1.5 rounded-md text-sm transition-all ${
                                    isSubActive
                                      ? "bg-muted text-primary font-medium"
                                      : "text-zinc-400/100 hover:bg-accent hover:text-primary"
                                  }`}
                                >
                                  {subItem.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
