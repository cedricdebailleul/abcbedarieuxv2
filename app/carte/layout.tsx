import { headers } from "next/headers";
import { Header } from "@/components/layout/header";

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16"> {/* Offset for fixed header */}
        {children}
      </main>
    </div>
  );
}