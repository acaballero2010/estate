import type { Metadata, Viewport } from "next";
import * as React from "react";
import { Instrument_Serif, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";
import { Providers } from "@/components/providers";

const AppShell = dynamic(
  () => import("@/components/layout/app-shell").then((mod) => mod.AppShell),
  {
    ssr: true,
  }
);

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://propflow.ph";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PropFlow CRM | Real Estate Sales Enablement & Pipeline Platform",
    template: "%s | PropFlow",
  },
  description:
    "Mobile-first real estate CRM, Meta Messenger automation, amortization quotation calculator, and deal closing platform for licensed brokers and agents in the Philippines.",
  keywords: [
    "PropFlow",
    "real estate CRM Philippines",
    "PRC licensed broker platform",
    "real estate amortization calculator",
    "Meta Messenger lead capture",
    "Philippine condominium sales",
  ],
  authors: [{ name: "PropFlow Realty Group" }],
  openGraph: {
    title: "PropFlow CRM | Real Estate Sales Enablement Platform",
    description:
      "Modern CRM, automated quotation generators, and Meta Messenger lead pipeline for licensed brokers and agents.",
    url: APP_URL,
    siteName: "PropFlow CRM",
    locale: "en_PH",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "PropFlow Real Estate CRM Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PropFlow CRM | Real Estate Sales Enablement Platform",
    description:
      "Modern CRM, automated quotation generators, and Meta Messenger lead pipeline for licensed brokers and agents.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
            <AppShell>{children}</AppShell>
          </React.Suspense>
        </Providers>
      </body>
    </html>
  );
}

