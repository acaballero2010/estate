import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Property Inquiry & VIP Viewing Consultation | PropFlow Realty",
  description:
    "Connect directly with accredited PRC/DHSUD credentialed brokers. Inquire about masterplanned developments, request custom payment schemes, and book exclusive showroom site viewings.",
  openGraph: {
    title: "Property Inquiry & VIP Viewing Consultation | PropFlow Realty",
    description:
      "Schedule a dedicated showroom or site tripping with certified Philippine real estate advisors. Tailored bank computation sheets prepared within minutes.",
    type: "website",
    siteName: "PropFlow Real Estate CRM",
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "PropFlow Property Inquiries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Inquiry & VIP Viewing Consultation",
    description: "Connect directly with accredited PRC/DHSUD credentialed brokers.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function InquireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

