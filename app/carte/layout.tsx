import Header from "@/components/front/header/header";

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-4"> {/* Reduced offset for complex header */}
        {children}
      </main>
    </div>
  );
}