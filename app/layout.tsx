import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { BadgeProvider } from "@/components/providers/badge-provider";
import { StaleDeploymentHandler } from "@/components/providers/stale-deployment-handler";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: "ABC Bédarieux",
  description: "Site des Commerçants et Artisans de Bédarieux",
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
    apple: "/images/logo_abc.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: env.NEXT_PUBLIC_URL || "http://localhost:3000",
    siteName: "ABC Bédarieux",
    title: "ABC Bédarieux",
    description: "Site des Commerçants et Artisans de Bédarieux",
    images: [
      {
        url: "/images/logo_abc.png",
        width: 1200,
        height: 630,
        alt: "ABC Bédarieux - Association Bédaricienne des Commerçants",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ABC Bédarieux",
    description: "Site des Commerçants et Artisans de Bédarieux",
    images: ["/images/logo_abc.png"],
    creator: "@abcbedarieux",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K2BPQZTR');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        id="top"
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K2BPQZTR"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster closeButton position="bottom-center" />
          <BadgeProvider />
          <StaleDeploymentHandler />
        </ThemeProvider>
      </body>
    </html>
  );
}
