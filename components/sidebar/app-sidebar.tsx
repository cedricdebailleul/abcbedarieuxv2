"use client";

import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconHeart,
  IconListDetails,
  IconMapPin,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import type * as React from "react";
import { NavDocuments } from "@/components/sidebar/nav-documents";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import Logo from "../logo";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Categories",
      url: "#",
      items: [
        {
          title: "Categories",
          url: "/dashboard/category",
        },
        {
          title: "Main Categories",
          url: "/dashboard/main-categories",
        },
      ],
      icon: IconListDetails,
    },
    {
      title: "Places",
      url: "/dashboard/places",
      icon: IconMapPin,
    },
    {
      title: "Favoris",
      url: "/dashboard/favorites",
      icon: IconHeart,
    },
    {
      title: "Evénements",
      url: "/dashboard/events",
      icon: IconChartBar,
    },
    {
      title: "Points d'intérêts",
      url: "/dashboard/pois",
      icon: IconFolder,
    },
    {
      title: "Articles",
      url: "/dashboard/posts",
      icon: IconFileDescription,
    },
    {
      title: "Membres",
      url: "/dashboard/members",
      icon: IconUsers,
    },
    {
      title: "Administration",
      url: "#",
      icon: IconSettings,
      items: [
        {
          title: "Utilisateurs",
          url: "/dashboard/admin/users",
        },
        {
          title: "Invitations",
          url: "/dashboard/admin/invitations",
        },
        {
          title: "Badges",
          url: "/dashboard/admin/badges",
        },
        {
          title: "Catégories des places",
          url: "/dashboard/admin/place-categories",
        },
      ],
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();

  // Filtrer les items de navigation selon le rôle utilisateur
  const filteredNavMain = data.navMain.filter((item) => {
    // Si c'est le menu Administration, ne l'afficher que pour les admins, modérateurs et éditeurs
    if (item.title === "Administration") {
      return session?.user?.role && ["admin", "moderator", "editor"].includes(session.user.role);
    }
    return true;
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/">
                <Logo width={50} height={50} />
                <span>ABC</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
