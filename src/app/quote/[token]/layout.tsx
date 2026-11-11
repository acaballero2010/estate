import type { Metadata } from "next";
import * as React from "react";
import { adminFirestore } from "@/lib/firebase/admin";
import { INITIAL_PROPERTIES, INITIAL_QUOTATIONS } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";

interface LayoutProps {
  params: Promise<{ token: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  let projectName = "The Meridian Park Residences";
  let unitCode = "Tower B - 2408 (2BR Corner)";
  let listPrice = 18500000;
  let heroImage =
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";
  let developerName = "Ayala Premier Estates";
  let locationCity = "Bonifacio Global City, Taguig";

  // 1. Attempt to fetch public snapshot from Cloud Firestore
  try {
    const snap = await adminFirestore
      .collection("public_quotations")
      .doc(token)
      .get();

    if (snap.exists) {
      const data = snap.data() as {
        projectName?: string;
        unitCode?: string;
        totalContractPrice?: number;
        listPrice?: number;
        thumbnailUrl?: string;
        developerName?: string;
        locationCity?: string;
      };
      if (data.projectName) projectName = data.projectName;
      if (data.unitCode) unitCode = data.unitCode;
      if (data.totalContractPrice || data.listPrice) {
        listPrice = data.totalContractPrice || data.listPrice || listPrice;
      }
      if (data.thumbnailUrl) heroImage = data.thumbnailUrl;
      if (data.developerName) developerName = data.developerName;
      if (data.locationCity) locationCity = data.locationCity;
    } else {
      // 2. Fallback to pre-seeded quotation catalog
      const matchedQuote = INITIAL_QUOTATIONS.find(
        (q) => q.shareToken === token || q.id === token
      );
      if (matchedQuote) {
        const prop = INITIAL_PROPERTIES.find(
          (p) => p.id === matchedQuote.propertyId
        );
        if (prop) {
          projectName = prop.projectName;
          unitCode = prop.unitCode;
          listPrice = prop.listPrice;
          heroImage = prop.thumbnailUrl || heroImage;
          developerName = prop.developerName;
          locationCity = prop.locationCity;
        }
      }
    }
  } catch {
    // Fallback gracefully on local dev or offline mode
    const matchedProp = INITIAL_PROPERTIES.find((p) =>
      p.unitCode.toLowerCase().includes(token.toLowerCase())
    );
    if (matchedProp) {
      projectName = matchedProp.projectName;
      unitCode = matchedProp.unitCode;
      listPrice = matchedProp.listPrice;
      heroImage = matchedProp.thumbnailUrl || heroImage;
      developerName = matchedProp.developerName;
      locationCity = matchedProp.locationCity;
    }
  }

  const title = `${projectName} (${unitCode}) | Official Quotation & Reservation Portal`;
  const description = `Official sample payment computation for ${unitCode} at ${projectName}, ${locationCity}. List Price: ${formatCurrency(
    listPrice
  )} by ${developerName}. Verified PRC & DHSUD licensed broker presentation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: `${projectName} - ${unitCode}`,
        },
      ],
      siteName: "PropFlow Real Estate CRM",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [heroImage],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function QuoteTokenLayout({
  children,
}: LayoutProps) {
  return <>{children}</>;
}

