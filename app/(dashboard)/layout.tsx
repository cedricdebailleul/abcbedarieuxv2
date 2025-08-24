import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Vérification d'authentification avec gestion d'erreur
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("Dashboard Layout - Erreur lors de la récupération de la session:", error);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
