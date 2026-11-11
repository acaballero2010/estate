import { type Lead, type Property, type Quotation } from "@/lib/schemas";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

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

export const DEFAULT_STALE_LEAD_HOURS = 48;

export interface LeadStalenessInfo {
  isOverdue: boolean;
  severity: "OK" | "OVERDUE" | "CRITICAL";
  hoursSinceContact: number;
  elapsedLabel: string;
  lastContactDate: Date;
}

/**
 * Evaluates whether an active lead has exceeded the configured follow-up SLA threshold.
 * Closed deals (CLOSED_WON / CLOSED_LOST) are never flagged as overdue.
 */
export function evaluateLeadStaleness(
  lead: Lead,
  thresholdHours: number = DEFAULT_STALE_LEAD_HOURS,
  nowMs: number = Date.now()
): LeadStalenessInfo {
  const refRaw = lead.lastContactedAt ?? lead.updatedAt ?? lead.createdAt;
  const lastContactDate = new Date(refRaw);
  const diffMs = Math.max(0, nowMs - lastContactDate.getTime());
  const hoursSinceContact = Math.floor(diffMs / (1000 * 60 * 60));

  let elapsedLabel = "Just now";
  if (hoursSinceContact >= 72) {
    elapsedLabel = `${Math.floor(hoursSinceContact / 24)}d`;
  } else if (hoursSinceContact >= 1) {
    elapsedLabel = `${hoursSinceContact}h`;
  }

  if (lead.stage === "CLOSED_WON" || lead.stage === "CLOSED_LOST") {
    return {
      isOverdue: false,
      severity: "OK",
      hoursSinceContact,
      elapsedLabel,
      lastContactDate,
    };
  }

  const safeThreshold = thresholdHours > 0 ? thresholdHours : DEFAULT_STALE_LEAD_HOURS;
  const isOverdue = hoursSinceContact >= safeThreshold;
  const severity: LeadStalenessInfo["severity"] =
    hoursSinceContact >= safeThreshold * 2
      ? "CRITICAL"
      : isOverdue
      ? "OVERDUE"
      : "OK";

  return {
    isOverdue,
    severity,
    hoursSinceContact,
    elapsedLabel,
    lastContactDate,
  };
}

/**
 * Generates a stage- and budget-aware follow-up check-in draft for stale or active leads.
 */
export function buildFollowUpCheckInDraft(
  lead: Lead,
  properties: Property[] = []
): string {
  const available = properties.filter((p) => p.status === "AVAILABLE");
  const matchedProp =
    available.find(
      (p) =>
        p.listPrice <= lead.budgetMax * 1.15 &&
        p.listPrice >= lead.budgetMin * 0.8
    ) ??
    available[0] ??
    properties[0];

  const area = lead.preferredLocations[0] || "Metro Manila";
  const propSummary = matchedProp
    ? `${matchedProp.projectName} (${matchedProp.unitCode})`
    : `our featured ${area} units`;

  const monthlyEquity24 = matchedProp
    ? (matchedProp.listPrice * 0.2 - matchedProp.reservationFee) / 24
    : 0;

  switch (lead.stage) {
    case "PROPOSAL_SENT":
      return `Hi ${lead.firstName}! Just checking in on the sample computation I sent for ${propSummary}. Would you like me to adjust the down payment stretch or compare Bank vs. Pag-IBIG monthly rates before this month's promo cut-off?`;

    case "SITE_TRIPPING":
      return `Hi ${lead.firstName}! Following up on our showroom & model unit tour for ${propSummary}. Let me know what day/time works best for your schedule—I can also reserve a VIP guest pass and share the Waze/Google Maps pin.`;

    case "RESERVATION":
      return `Hi ${lead.firstName}! Quick check-in on your reservation file for ${propSummary}. Please let me know if you need any assistance uploading the remaining KYC documents or if you have questions on the payment schedule.`;

    default:
      return matchedProp
        ? `Hi ${lead.firstName}! Quick update on your search around ${area} (budget up to ${formatCompactCurrency(
            lead.budgetMax
          )}): ${propSummary} is currently available with a 24-month stretched DP at around ${formatCurrency(
            monthlyEquity24
          )}/mo. Would you like me to send over the floor plan and sample computation?`
        : `Hi ${lead.firstName}! Checking in on your property search in ${area}. We have new ready-for-occupancy and pre-selling options matching your ${formatCompactCurrency(
            lead.budgetMax
          )} budget—happy to prepare a quick computation anytime!`;
  }
}

export interface PropertyLeadMatch {
  lead: Lead;
  matchScore: number;
  matchReasons: string[];
}

function locationMatchesProperty(preferredLocations: string[], propertyCity: string): {
  exact: boolean;
  broad: boolean;
} {
  const cityLower = propertyCity.toLowerCase();
  const cityPrimary = (cityLower.split(",")[0] ?? cityLower).trim();

  let exact = false;
  let broad = false;

  for (const rawLoc of preferredLocations) {
    const locLower = rawLoc.toLowerCase().trim();
    const locPrimary = (locLower.split(",")[0] ?? locLower).trim();
    if (
      cityLower.includes(locPrimary) ||
      locLower.includes(cityPrimary)
    ) {
      exact = true;
    } else if (
      locLower.includes("metro manila") &&
      /(bgc|taguig|makati|pasig|ortigas|quezon|san juan|mandaluyong|pasay|alabang|manila)/i.test(
        cityLower
      )
    ) {
      broad = true;
    }
  }

  return { exact, broad };
}

/**
 * Matches an available property against active pipeline leads based on budget,
 * preferred location, property type, and buyer urgency.
 */
export function findMatchingLeadsForProperty(
  property: Property,
  leads: Lead[]
): PropertyLeadMatch[] {
  const matches: PropertyLeadMatch[] = [];

  for (const lead of leads) {
    if (lead.stage === "CLOSED_WON" || lead.stage === "CLOSED_LOST") {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    const exactBudget =
      property.listPrice >= lead.budgetMin && property.listPrice <= lead.budgetMax;
    const nearBudget =
      property.listPrice >= lead.budgetMin * 0.75 &&
      property.listPrice <= lead.budgetMax * 1.15;

    if (exactBudget) {
      score += 40;
      reasons.push("Exact Budget Fit");
    } else if (nearBudget) {
      score += 25;
      reasons.push("Within 15% Budget");
    } else {
      // Price outside buyer's realistic window
      continue;
    }

    const locMatch = locationMatchesProperty(
      lead.preferredLocations,
      property.locationCity
    );
    if (locMatch.exact) {
      score += 30;
      reasons.push("Location Match");
    } else if (locMatch.broad) {
      score += 15;
      reasons.push("Metro Manila Area");
    }

    if (lead.preferredPropertyTypes.includes(property.propertyType)) {
      score += 20;
      reasons.push(property.propertyType.replace(/_/g, " "));
    }

    if (lead.priority === "HOT") {
      score += 10;
    }

    if (score >= 45) {
      matches.push({
        lead,
        matchScore: Math.min(100, score),
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Builds a personalized unit alert message for Messenger, WhatsApp, or Viber.
 */
export function buildPropertyAlertMessage(
  property: Property,
  lead: Lead,
  portalUrl: string,
  customNote?: string
): string {
  const monthlyDp24 =
    (property.listPrice * 0.2 - property.reservationFee) / 24;

  const lines = [
    `Hi ${lead.firstName}! A unit matching your search just opened up in ${property.locationCity}:`,
    ``,
    `🏢 ${property.projectName} — ${property.unitCode}`,
    `• Specs: ${property.bedrooms}BR • ${property.floorAreaSqm} sqm (${property.turnoverDate})`,
    `• List Price: ${formatCurrency(property.listPrice, "PHP", 0)}`,
    `• Est. 24-Mo Equity DP: ~${formatCurrency(monthlyDp24, "PHP", 0)}/mo (Net of ${formatCompactCurrency(
      property.reservationFee
    )} RF)`,
  ];

  if (customNote?.trim()) {
    lines.push(``, `Note: ${customNote.trim()}`);
  }

  lines.push(
    ``,
    `View full photos, 360° tour & customize your payment terms here:\n${portalUrl}`
  );

  return lines.join("\n");
}

