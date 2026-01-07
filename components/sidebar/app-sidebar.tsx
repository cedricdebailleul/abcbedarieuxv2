"use client";

import {
  IconCalendar,
  IconDashboard,
  IconFileDescription,
  IconHeart,
  IconMapPin,
  IconSettings,
  IconBuilding,
  IconBell,
  IconPackage,
} from "@tabler/icons-react";
import Link from "next/link";
import type * as React from "react";
import { safeUserCast } from "@/lib/auth-helpers-client";
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
  general: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ],
  content: [
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
      title: "Produits & Services",
      url: "#",
      icon: IconPackage,
      items: [
        {
          title: "Ajouter",
          url: "/dashboard/products-services",
        },
        {
          title: "Gérer",
          url: "/dashboard/products-services/manage",
        },
      ],
    },
  ],
  user: [
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
      title: "Association ABC",
      url: "/dashboard/association",
      icon: IconBuilding,
    },
  ],
  adminAll: [
    {
      title: "Vue d'ensemble",
      url: "/dashboard/admin",
    },
    {
      title: "Utilisateurs",
      url: "/dashboard/admin/users",
    },
    {
      title: "Places (Global)",
      url: "/dashboard/admin/places",
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
    {
      title: "Actions",
      url: "/dashboard/admin/actions",
    },
    {
      title: "Partenaires",
      url: "/dashboard/admin/partners",
    },
    {
      title: "Notre Histoire",
      url: "/dashboard/admin/history",
    },
    {
      title: "Chatbot WhatsApp",
      url: "/dashboard/admin/whatsapp",
    },
    {
      title: "Sauvegarde",
      url: "/dashboard/admin/export",
    },
    {
      title: "Association Vue d'ensemble",
      url: "/dashboard/admin/abc",
    },
    {
      title: "Assoc. Membres",
      url: "/dashboard/admin/abc/members",
    },
    {
      title: "Assoc. Paiements",
      url: "/dashboard/admin/abc/payments",
    },
    {
      title: "Assoc. Réunions",
      url: "/dashboard/admin/abc/meetings",
    },
    {
      title: "Assoc. Documents",
      url: "/dashboard/admin/abc/documents",
    },
    {
      title: "Assoc. Bulletins",
      url: "/dashboard/admin/abc/bulletins",
    },
    {
      title: "Assoc. Inscriptions",
      url: "/dashboard/admin/abc/registrations",
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

  const user = session?.user ? safeUserCast(session.user) : null;
  const isAdminOrMod = user && ["admin", "moderator"].includes(user.role);
  const isAdmin = user?.role === "admin";

  // Construction des groupes de navigation
  const groups: {
    title: string;
    items: {
      title: string;
      url: string;
      icon?: any;
      items?: { title: string; url: string }[];
    }[];
  }[] = [
    {
      title: "Général",
      items: data.general,
    },
    {
      title: "Contenu",
      items: data.content,
    },
    {
      title: "Mon Espace",
      items: data.user,
    },
  ];

  // Groupes Admin
  if (isAdminOrMod) {
    groups.push({
      title: "Système",
      items: [
        {
          title: "Administration",
          url: "#",
          icon: IconSettings,
          items: data.adminAll, // Utilise la liste consolidée
        }
      ],
    });
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Logo width={50} height={50} />
                <span>ABC</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
