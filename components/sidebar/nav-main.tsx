import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NotificationBadge } from "@/components/association/notification-badge";

type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: {
    title: string;
    url: string;
  }[];
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

type NavMainProps = {
  groups: NavGroup[];
};

export function NavMain({ groups }: NavMainProps) {
  // Local state pour chaque sous-menu ouvert - utilise le title comme clé unique
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));
  };

  return (
    <>
      {groups.map((group, index) => (
        <SidebarGroup key={index}>
          {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title} className="flex flex-col">
                  {/* Si item.items existe, render un bouton collapsible */}
                  {item.items && item.items.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.title)}
                        className="flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-muted/80 font-medium transition text-sm"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.title}</span>
                        <span className="ml-auto">
                          {openMenus.includes(item.title) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      </button>
                      {/* Sous-menu */}
                      {openMenus.includes(item.title) && (
                        <ul className="ml-6 mt-1 space-y-1 flex flex-col gap-1 border-l pl-2">
                          {item.items.map((sub) => (
                            <li
                              key={sub.url}
                              className="flex items-center"
                            >
                              <Link
                                href={sub.url}
                                className="block px-2 py-1 text-sm rounded hover:bg-muted w-full text-muted-foreground hover:text-foreground"
                              >
                                {sub.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url} className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.title}</span>
                        {item.title === "Association ABC" && <NotificationBadge />}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
