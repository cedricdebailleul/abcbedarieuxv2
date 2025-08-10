import FooterSection from "@/components/front/footer";
import Header from "@/components/front/header/header";
import { SimpleCookieBanner } from "@/components/rgpd/cookie-banner";

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="contenu" className="mx-auto  bg-background">
        {children}
      </main>
      <SimpleCookieBanner />
      <FooterSection />
    </>
  );
}
