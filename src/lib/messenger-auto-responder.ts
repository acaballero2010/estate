import type { Lead, Property, PropertyType } from "@/lib/schemas";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export interface ParsedMessengerIntent {
  preferredLocations: string[];
  preferredPropertyTypes: PropertyType[];
  financingPreference: Lead["financingPreference"];
  budgetMin: number;
  budgetMax: number;
  priority: Lead["priority"];
  detectedTags: string[];
  hasExplicitCriteria: boolean;
}

const LOCATION_KEYWORDS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(bgc|bonifacio|fort|high street|mckinley)\b/i, label: "Bonifacio Global City, Taguig" },
  { pattern: /\b(makati|ayala|salcedo|legaspi|rockwell)\b/i, label: "Makati CBD" },
  { pattern: /\b(nuvali|sta\.?\s*rosa|santa rosa|laguna|solenad)\b/i, label: "Nuvali, Santa Rosa" },
  { pattern: /\b(alabang|filinvest|muntinlupa|ayala alabang)\b/i, label: "Alabang" },
  { pattern: /\b(ortigas|pasig|kapitolyo|arcovia)\b/i, label: "Ortigas Center, Pasig" },
  { pattern: /\b(cebu|it park|lahug|mandaue|banilad)\b/i, label: "IT Park, Cebu City" },
  { pattern: /\b(quezon city|qc|new manila|katipunan|vertis|eastwood)\b/i, label: "New Manila, Quezon City" },
  { pattern: /\b(san juan|greenhills)\b/i, label: "San Juan" },
  { pattern: /\b(mandaluyong|shaw|greenfield)\b/i, label: "Mandaluyong" },
  { pattern: /\b(pasay|moa|bay area|paranaque|aseana)\b/i, label: "Bay Area, Pasay" },
  { pattern: /\b(tagaytay|cavite|silang)\b/i, label: "Tagaytay / South" },
];

/**
 * Parses buyer location, budget, property type, financing preference, and urgency
 * from a natural-language Facebook Messenger inquiry.
 */
export function parseBuyerMessengerIntent(messageText: string): ParsedMessengerIntent {
  const text = messageText || "";
  const matchedLocations: string[] = [];
  for (const loc of LOCATION_KEYWORDS) {
    if (loc.pattern.test(text) && !matchedLocations.includes(loc.label)) {
      matchedLocations.push(loc.label);
    }
  }

  // Extract budget hints like "18M", "8.5m", "12 million", "PHP 10,000,000", "6M-9M"
  const millionsMatches = Array.from(
    text.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|mil|million)\b/gi)
  ).map((m) => Math.round(parseFloat(m[1] || "0") * 1_000_000));

  const phpMatches = Array.from(
    text.matchAll(/(?:₱|php|p)\s*(\d{1,3}(?:,\d{3}){2,}|\d{7,9})/gi)
  ).map((m) => parseInt((m[1] || "0").replace(/,/g, ""), 10));

  const parsedAmounts = [...millionsMatches, ...phpMatches].filter(
    (amt) => Number.isFinite(amt) && amt >= 1_000_000 && amt <= 500_000_000
  );

  let budgetMin = 5_000_000;
  let budgetMax = 12_000_000;
  if (parsedAmounts.length >= 2) {
    parsedAmounts.sort((a, b) => a - b);
    budgetMin = parsedAmounts[0]!;
    budgetMax = parsedAmounts[parsedAmounts.length - 1]!;
  } else if (parsedAmounts.length === 1) {
    const target = parsedAmounts[0]!;
    budgetMin = Math.max(1_500_000, Math.round(target * 0.75));
    budgetMax = Math.round(target * 1.15);
  }

  // Property types
  const preferredPropertyTypes: PropertyType[] = [];
  if (/\b(house\s*(?:&|and)?\s*lot|single\s*detached|duplex)\b/i.test(text)) {
    preferredPropertyTypes.push("HOUSE_AND_LOT");
  }
  if (/\b(townhouse|town\s*home)\b/i.test(text)) {
    preferredPropertyTypes.push("TOWNHOUSE");
  }
  if (/\b(lot\s*only|residential\s*lot|vacant\s*lot)\b/i.test(text)) {
    preferredPropertyTypes.push("RESIDENTIAL_LOT");
  }
  if (/\b(commercial|office|retail)\b/i.test(text)) {
    preferredPropertyTypes.push("COMMERCIAL_UNIT");
  }
  if (
    preferredPropertyTypes.length === 0 ||
    /\b(condo|condominium|studio|1br|2br|3br|penthouse|unit)\b/i.test(text)
  ) {
    if (!preferredPropertyTypes.includes("CONDOMINIUM")) {
      preferredPropertyTypes.push("CONDOMINIUM");
    }
  }

  // Financing preference
  let financingPreference: Lead["financingPreference"] = "BANK";
  if (/\b(pag-?ibig|hdmf)\b/i.test(text)) {
    financingPreference = "PAG_IBIG";
  } else if (/\b(spot\s*cash|full\s*cash|cash\s*buyer)\b/i.test(text)) {
    financingPreference = "SPOT_CASH";
  } else if (/\b(in-?house|developer\s*financing)\b/i.test(text)) {
    financingPreference = "IN_HOUSE";
  }

  // Urgency / Priority
  const isHotIntent =
    /\b(viewing|tripping|visit|reserve|reservation|rfo|ready\s*for\s*occupancy|this\s*week|tomorrow|weekend|asap|pre-?approved|comput|quote|sample)\b/i.test(
      text
    );
  const priority: Lead["priority"] = isHotIntent ? "HOT" : "HIGH";

  const detectedTags = ["Messenger Auto-Captured"];
  if (matchedLocations.length > 0) {
    detectedTags.push(matchedLocations[0]!.split(",")[0]!);
  }
  if (financingPreference !== "BANK") {
    detectedTags.push(financingPreference.replace(/_/g, " "));
  }
  if (/\b(ofw|abroad|overseas|dubai|singapore|usd|sgd|aed)\b/i.test(text)) {
    detectedTags.push("OFW Buyer");
  }
  if (/\b(rfo|ready)\b/i.test(text)) {
    detectedTags.push("RFO Priority");
  }

  return {
    preferredLocations:
      matchedLocations.length > 0 ? matchedLocations : ["Metro Manila"],
    preferredPropertyTypes,
    financingPreference,
    budgetMin,
    budgetMax,
    priority,
    detectedTags,
    hasExplicitCriteria:
      matchedLocations.length > 0 || parsedAmounts.length > 0,
  };
}

/**
 * Generates an instant personalized greeting reply for a new inbound Messenger inquiry,
 * interpolating `{name}` and appending matching inventory + portal link when available.
 */
export function buildPersonalizedGreetingReply(params: {
  firstName: string;
  greetingTemplate?: string | null;
  intent: ParsedMessengerIntent;
  properties?: Property[];
  portalUrl?: string;
}): string {
  const { firstName, greetingTemplate, intent, properties = [], portalUrl } = params;
  const cleanName = firstName && firstName !== "Messenger" ? firstName : "there";

  const baseTemplate =
    greetingTemplate?.trim() ||
    "Hi {name}! Thanks for reaching out. Are you interested in pre-selling or ready-for-occupancy units?";

  const personalizedBase = baseTemplate.replace(/\{name\}/gi, cleanName);

  // Try matching an available unit against extracted intent
  const available = properties.filter((p) => p.status === "AVAILABLE");
  const matchedProp = available.find((p) => {
    const budgetOk =
      p.listPrice >= intent.budgetMin * 0.8 &&
      p.listPrice <= intent.budgetMax * 1.15;
    const locOk = intent.preferredLocations.some(
      (loc) =>
        loc === "Metro Manila" ||
        p.locationCity.toLowerCase().includes(loc.split(",")[0]!.toLowerCase()) ||
        loc.toLowerCase().includes(p.locationCity.toLowerCase())
    );
    return budgetOk && locOk;
  });

  if (matchedProp) {
    const monthlyEquity24 =
      (matchedProp.listPrice * 0.2 - matchedProp.reservationFee) / 24;
    return `${personalizedBase}\n\nBased on your inquiry, I matched ${matchedProp.projectName} (${matchedProp.unitCode} • ${matchedProp.locationCity}) at ${formatCompactCurrency(
      matchedProp.listPrice
    )} (~${formatCurrency(
      monthlyEquity24
    )}/mo for 24 mos DP).${
      portalUrl ? `\n\nExplore our interactive units & payment calculator here: ${portalUrl}` : ""
    }`;
  }

  return `${personalizedBase}${
    portalUrl
      ? `\n\nYou can also browse available developments or generate an instant computation here: ${portalUrl}`
      : ""
  }`;
}

