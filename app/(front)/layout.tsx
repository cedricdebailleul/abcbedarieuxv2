import FooterSection from "@/components/front/footer";
import EnhancedHeader from "@/components/front/header/enhanced-header";
import { SimpleCookieBanner } from "@/components/rgpd/cookie-banner";

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EnhancedHeader />
      <main id="main-content" className="pt-20 mx-auto bg-background">
        {children}
      </main>
      <SimpleCookieBanner />
      <FooterSection />
    </>
  );
}
