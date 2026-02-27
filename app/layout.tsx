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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
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
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "ABC Bédarieux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ABC Bédarieux",
    description: "Site des Commerçants et Artisans de Bédarieux",
    images: ["/images/og-default.jpg"],
    creator: "@blackbearstudio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        id="top"
        suppressHydrationWarning
      >
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
