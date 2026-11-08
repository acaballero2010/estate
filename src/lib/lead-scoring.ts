import { type Lead, type Property, type Quotation } from "@/lib/schemas";

export interface ScoreCategory {
  earned: number;
  max: number;
  summary: string;
}

export interface LeadReadinessAnalysis {
  totalScore: number;
  tier: "HOT" | "HIGH" | "MODERATE" | "COLD";
  tierLabel: string;
  badgeClass: string;
  matchingProperties: Property[];
  financingScore: ScoreCategory;
  inventoryScore: ScoreCategory;
  kycScore: ScoreCategory;
  engagementScore: ScoreCategory;
  recommendedAction: string;
}

/**
 * Computes an algorithmic 0-100 buyer qualification score
 * tailored for Philippine real estate sales workflows.
 */
export function calculateLeadReadiness(
  lead: Lead,
  properties: Property[] = [],
  quotations: Quotation[] = []
): LeadReadinessAnalysis {
  // 1. Financing Profile Readiness (0 - 25 pts)
  let financingEarned = 5;
  let financingSummary = "Financing preference undecided";

  switch (lead.financingPreference) {
    case "SPOT_CASH":
      financingEarned = 25;
      financingSummary = "Spot Cash buyer — zero bank approval delay";
      break;
    case "BANK":
      financingEarned = 20;
      financingSummary = "Bank financing preference — standard qualification";
      break;
    case "PAG_IBIG":
      financingEarned = 18;
      financingSummary = "Pag-IBIG HDMF financing preference";
      break;
    case "IN_HOUSE":
      financingEarned = 15;
      financingSummary = "Developer in-house financing";
      break;
    default:
      financingEarned = 5;
      financingSummary = "Financing route needs discovery call";
  }

  // 2. Inventory Alignment (0 - 25 pts)
  const availableInventory = properties.filter((p) => p.status === "AVAILABLE");
  const matchingProperties = availableInventory.filter((p) => {
    const withinBudget =
      p.listPrice >= lead.budgetMin * 0.85 &&
      p.listPrice <= lead.budgetMax * 1.15;
    const matchesLocation = lead.preferredLocations.some(
      (loc) =>
        loc.toLowerCase().includes(p.locationCity.toLowerCase()) ||
        p.locationCity.toLowerCase().includes(loc.toLowerCase()) ||
        loc.toLowerCase().includes("manila")
    );
    const matchesType = lead.preferredPropertyTypes.includes(p.propertyType);
    return withinBudget && (matchesLocation || matchesType);
  });

  let inventoryEarned = 0;
  let inventorySummary = "No active inventory matches budget range";

  if (matchingProperties.length >= 3) {
    inventoryEarned = 25;
    inventorySummary = `${matchingProperties.length} units match budget & preferred locations`;
  } else if (matchingProperties.length >= 1) {
    inventoryEarned = 20;
    inventorySummary = `${matchingProperties.length} unit available in desired budget window`;
  } else {
    // Check if at least budget fits general price floor
    const anyBudgetFit = availableInventory.some(
      (p) => p.listPrice <= lead.budgetMax
    );
    if (anyBudgetFit) {
      inventoryEarned = 10;
      inventorySummary = "Budget fits entry units; location needs alignment";
    }
  }

  // 3. KYC & Document Completeness (0 - 25 pts)
  let kycEarned = 0;
  const docs = lead.documents || [];
  const hasGovId = docs.some((d) => d.type === "GOVERNMENT_ID");
  const hasIncome = docs.some((d) => d.type === "PROOF_OF_INCOME");
  const hasTin = docs.some((d) => d.type === "TIN_ID");

  if (hasGovId) kycEarned += 10;
  if (hasIncome) kycEarned += 10;
  if (hasTin) kycEarned += 5;

  if (kycEarned === 0) {
    // Basic contact completeness baseline
    if (lead.phone && lead.email && lead.phone.length >= 10) {
      kycEarned = 8;
    } else if (lead.phone) {
      kycEarned = 5;
    }
  }

  const kycSummary =
    kycEarned >= 20
      ? "KYC complete with ID and Proof of Income"
      : kycEarned >= 10
      ? "Partially verified; missing proof of income or TIN"
      : "Pending KYC documentation";

  // 4. Engagement Velocity & Interaction (0 - 25 pts)
  let engagementEarned = 0;
  const leadQuotes = quotations.filter((q) => q.leadId === lead.id);

  if (leadQuotes.length > 0) {
    engagementEarned += 10;
  }

  switch (lead.stage) {
    case "RESERVATION":
      engagementEarned += 15;
      break;
    case "PROPOSAL_SENT":
      engagementEarned += 12;
      break;
    case "SITE_TRIPPING":
      engagementEarned += 10;
      break;
    case "CONTACTED":
      engagementEarned += 6;
      break;
    case "NEW_LEAD":
      engagementEarned += 3;
      break;
    case "CLOSED_WON":
      engagementEarned += 15;
      break;
    default:
      break;
  }

  // Recency bonus: contacted within 7 days
  if (lead.lastContactedAt) {
    const daysSince =
      (Date.now() - new Date(lead.lastContactedAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSince <= 7) {
      engagementEarned += 5;
    }
  }

  engagementEarned = Math.min(25, engagementEarned);
  const engagementSummary =
    engagementEarned >= 20
      ? "Active pipeline velocity with quotation/viewing"
      : engagementEarned >= 10
      ? "Engaged; follow-up scheduled"
      : "Awaiting initial outreach response";

  // Total Composite Score
  const totalScore = Math.min(
    100,
    financingEarned + inventoryEarned + kycEarned + engagementEarned
  );

  // Determine Tier
  let tier: LeadReadinessAnalysis["tier"] = "COLD";
  let tierLabel = "Early Discovery";
  let badgeClass = "bg-slate-500/10 text-slate-600 border-slate-500/20";
  let recommendedAction = "Schedule initial qualification & discovery call.";

  if (totalScore >= 80) {
    tier = "HOT";
    tierLabel = "Ready to Reserve";
    badgeClass = "bg-rose-500/10 text-rose-600 border-rose-500/30";
    recommendedAction =
      "Priority closing: Dispatch official Reservation Agreement and lock in unit.";
  } else if (totalScore >= 60) {
    tier = "HIGH";
    tierLabel = "High Potential";
    badgeClass = "bg-amber-500/10 text-amber-600 border-amber-500/30";
    recommendedAction =
      "Book showroom / site tripping or dispatch customized step-up quotation.";
  } else if (totalScore >= 40) {
    tier = "MODERATE";
    tierLabel = "Nurturing";
    badgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/30";
    recommendedAction =
      "Request proof of income / pre-qualification and present matching units.";
  }

  return {
    totalScore,
    tier,
    tierLabel,
    badgeClass,
    matchingProperties,
    financingScore: {
      earned: financingEarned,
      max: 25,
      summary: financingSummary,
    },
    inventoryScore: {
      earned: inventoryEarned,
      max: 25,
      summary: inventorySummary,
    },
    kycScore: {
      earned: kycEarned,
      max: 25,
      summary: kycSummary,
    },
    engagementScore: {
      earned: engagementEarned,
      max: 25,
      summary: engagementSummary,
    },
    recommendedAction,
  };
}

