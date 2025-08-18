"use client";

import {
  IconCalendar,
  IconCategory,
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconHeart,
  IconMapPin,
  IconMail,
  IconSettings,
  IconUsers,
  IconUserPlus,
  IconAward,
  IconBuilding,
  IconClaim,
  IconNotebook,
  IconBell,
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
      title: "Places",
      url: "/dashboard/places",
      icon: IconMapPin,
    },
    {
      title: "Evénements",
      url: "/dashboard/events",
      icon: IconCalendar,
    },
    {
      title: "Articles",
      url: "/dashboard/posts",
      icon: IconFileDescription,
    },
    {
      title: "Favoris",
      url: "/dashboard/favorites",
      icon: IconHeart,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: IconBell,
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
          title: "Badges",
          url: "/dashboard/admin/badges",
        },
        {
          title: "Catégories",
          url: "/dashboard/admin/place-categories",
        },
        {
          title: "Réclamations",
          url: "/dashboard/admin/claims",
        },
        {
          title: "Newsletter",
          url: "/dashboard/admin/newsletter",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Mon Profil",
      url: "/dashboard/profile",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "Carte Interactive",
      url: "/carte",
      icon: IconMapPin,
    },
    {
      name: "Site Public",
      url: "/",
      icon: IconFileDescription,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();

  // Filtrer les items de navigation selon le rôle utilisateur
  const filteredNavMain = data.navMain.filter((item) => {
    // Si c'est le menu Administration, ne l'afficher que pour les admins et modérateurs
    if (item.title === "Administration") {
      return session?.user?.role && ["admin", "moderator"].includes(session.user.role);
    }
    return true;
  }).map((item) => {
    // Filtrer les sous-items d'administration selon les permissions
    if (item.title === "Administration" && item.items) {
      const filteredItems = item.items.filter((subItem) => {
        // Newsletter et Badges : admin seulement
        if (["Newsletter", "Badges"].includes(subItem.title)) {
          return session?.user?.role === "admin";
        }
        // Utilisateurs et Réclamations : admin et modérateur
        if (["Utilisateurs", "Réclamations"].includes(subItem.title)) {
          return session?.user?.role && ["admin", "moderator"].includes(session.user.role);
        }
        // Catégories : tous les rôles admin/moderator
        return session?.user?.role && ["admin", "moderator"].includes(session.user.role);
      });
      return { ...item, items: filteredItems };
    }
    return item;
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
