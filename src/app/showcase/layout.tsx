import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Premier Property Showcase & Real Estate Portfolio | PropFlow Realty",
  description:
    "Explore accredited pre-selling condominium residences, masterplanned township estates, and ready-for-occupancy (RFO) luxury homes in Bonifacio Global City, Nuvali Laguna, and Cebu IT Park with sample bank computations.",
  keywords: [
    "Philippine real estate",
    "BGC condo for sale",
    "Nuvali Laguna house and lot",
    "Cebu IT Park condo",
    "Ayala Premier pre-selling",
    "Solana Verde Nuvali",
    "Astra Horizon Cebu",
    "sample amortization computation",
    "BPI bank financing",
    "Pag-IBIG housing loan",
    "licensed real estate broker Philippines",
  ],
  openGraph: {
    title: "Premier Property Showcase & Masterplanned Portfolio | PropFlow Realty",
    description:
      "Explore verified pre-selling and RFO residential towers, luxury villas, and investment suites with interactive financial calculators and virtual walkthroughs.",
    type: "website",
    siteName: "PropFlow Real Estate CRM",
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "PropFlow Real Estate Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premier Property Showcase & Real Estate Portfolio",
    description:
      "Explore verified pre-selling and RFO properties with instant sample bank amortization schedules.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

