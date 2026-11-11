import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Client Deal Room & Unit Reservation Portal | PropFlow Estates",
  description:
    "Private buyer portal for tracking reservation agreement, monthly equity schedule, bank mortgage LOG processing, and developer construction progress.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

