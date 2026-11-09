export type SubscriptionTier = "STARTER" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED";
export type BillingCycle = "MONTHLY" | "ANNUAL";

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDefinition {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthlyPhp: number;
  priceAnnualPhp: number; // Discounted
  badge?: string;
  popular?: boolean;
  quotas: {
    maxProperties: number | "UNLIMITED";
    maxLeadsPerImport: number | "UNLIMITED";
    proposalsPerMonth: number | "UNLIMITED";
    teamSeats: number;
  };
  features: PlanFeature[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter Solo",
    tagline: "Essential tools for newly licensed real estate salespersons.",
    priceMonthlyPhp: 0,
    priceAnnualPhp: 0,
    quotas: {
      maxProperties: 5,
      maxLeadsPerImport: 25,
      proposalsPerMonth: 15,
      teamSeats: 1,
    },
    features: [
      { name: "Up to 5 Active Property Listings", included: true },
      { name: "Kanban Pipeline & Activity Tracking", included: true },
      { name: "Basic Computation Calculator", included: true },
      { name: "Manual WhatsApp & Viber Share Card", included: true },
      { name: "Interactive 360° Panorama Virtual Tours", included: false },
      { name: "Facebook Lead Ads & Developer CSV Importer", included: false },
      { name: "Individual Facebook Messenger PAT Hub", included: false },
      { name: "Multi-Currency Quotations (USD, AED, SGD, CAD)", included: false },
      { name: "Buyer Showcase Engagement Analytics", included: false },
      { name: "Official PRC & DHSUD Licensed Seals on PDFs", included: false },
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro Broker",
    tagline: "For top-producing licensed brokers and active realty specialists.",
    priceMonthlyPhp: 1499,
    priceAnnualPhp: 14990, // ~₱1,249/mo (Save 17%)
    popular: true,
    badge: "Most Popular",
    quotas: {
      maxProperties: "UNLIMITED",
      maxLeadsPerImport: "UNLIMITED",
      proposalsPerMonth: "UNLIMITED",
      teamSeats: 1,
    },
    features: [
      { name: "Unlimited Active Property Listings", included: true, highlight: true },
      { name: "Interactive 360° Virtual Tours & Floor Plan Hotspots", included: true, highlight: true },
      { name: "Facebook Lead Ads & Developer Lists Bulk Importer", included: true, highlight: true },
      { name: "Individual Facebook Page Access Token (PAT) Sync", included: true, highlight: true },
      { name: "Multi-Currency OFW Quotation Engine (USD, AED, SGD, CAD, EUR)", included: true, highlight: true },
      { name: "Client Showcase Engagement & Dwell Time Analytics", included: true, highlight: true },
      { name: "White-Label PDF Quotes & Reservation Agreements with PRC Seals", included: true },
      { name: "1-Click WhatsApp & Viber Instant Copy Formats", included: true },
      { name: "Cloud Firestore Workspace Backup & Auto-Sync", included: true },
      { name: "Multi-Agent Team Routing", included: false },
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Realty Firm Enterprise",
    tagline: "Built for brokerages, developer project sales, and realty teams.",
    priceMonthlyPhp: 4999,
    priceAnnualPhp: 49990, // ~₱4,165/mo
    badge: "Realty Teams",
    quotas: {
      maxProperties: "UNLIMITED",
      maxLeadsPerImport: "UNLIMITED",
      proposalsPerMonth: "UNLIMITED",
      teamSeats: 15,
    },
    features: [
      { name: "All Pro Broker Features Included", included: true },
      { name: "Up to 15 Sub-Agent Seats with Role Permissions", included: true, highlight: true },
      { name: "Centralized Brokerage Inventory with Co-Listing Rights", included: true, highlight: true },
      { name: "Multi-Page Messenger Round-Robin Lead Distribution", included: true, highlight: true },
      { name: "Custom Branded Domain Showcase Storefront", included: true, highlight: true },
      { name: "Commission Sharing & Broker RAF Approval Workflow", included: true },
      { name: "Priority 24/7 Dedicated Account Manager", included: true },
      { name: "Automated Data Compliance & Auditing Export", included: true },
    ],
  },
};

export interface AgentSubscriptionRecord {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentMethod: "GCASH" | "MAYA" | "CREDIT_CARD" | "BANK_TRANSFER";
  lastPaymentAmountPhp: number;
  autoRenew: boolean;
}

export interface PlatformInvoice {
  id: string;
  invoiceNo: string;
  agentUid: string;
  agentName: string;
  agentEmail: string;
  agencyName: string;
  tier: SubscriptionTier;
  cycle: BillingCycle;
  amountPhp: number;
  paymentMethod: "GCASH" | "MAYA" | "CREDIT_CARD" | "BANK_TRANSFER";
  status: "PAID" | "PENDING" | "FAILED";
  paidAt: string;
  pdfUrl?: string;
}

export const MOCK_PLATFORM_INVOICES: PlatformInvoice[] = [
  {
    id: "inv-2026-001",
    invoiceNo: "PF-INV-8921",
    agentUid: "agent-001",
    agentName: "Atty. Bea Santos, REB",
    agentEmail: "bea.santos@ayala.ph",
    agencyName: "Santos Prime Properties",
    tier: "ENTERPRISE",
    cycle: "ANNUAL",
    amountPhp: 49990,
    paymentMethod: "CREDIT_CARD",
    status: "PAID",
    paidAt: "2026-11-01",
  },
  {
    id: "inv-2026-002",
    invoiceNo: "PF-INV-8922",
    agentUid: "agent-002",
    agentName: "Marco Reyes, REB",
    agentEmail: "marco.reyes@propflow.ph",
    agencyName: "PropFlow Realty Group",
    tier: "PRO",
    cycle: "MONTHLY",
    amountPhp: 1499,
    paymentMethod: "GCASH",
    status: "PAID",
    paidAt: "2026-11-05",
  },
  {
    id: "inv-2026-003",
    invoiceNo: "PF-INV-8923",
    agentUid: "agent-003",
    agentName: "Maria Clara Del Rosario",
    agentEmail: "clara.delrosario@smdc.ph",
    agencyName: "Del Rosario Premier Group",
    tier: "PRO",
    cycle: "ANNUAL",
    amountPhp: 14990,
    paymentMethod: "MAYA",
    status: "PAID",
    paidAt: "2026-11-06",
  },
  {
    id: "inv-2026-004",
    invoiceNo: "PF-INV-8924",
    agentUid: "agent-004",
    agentName: "Engr. Kenneth Tan",
    agentEmail: "kenneth.tan@megaworld.ph",
    agencyName: "BGC Realty Hub",
    tier: "PRO",
    cycle: "MONTHLY",
    amountPhp: 1499,
    paymentMethod: "CREDIT_CARD",
    status: "PAID",
    paidAt: "2026-11-08",
  },
];

