import EnhancedHeader from "@/components/front/header/enhanced-header";

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <EnhancedHeader />
      <main id="main-content" className="pt-4">
        {children}
      </main>
    </div>
  );
}