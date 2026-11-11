import type { Lead, Property } from "@/lib/schemas";

export interface DripStep {
  id: string;
  dayOffset: number;
  channel: "WHATSAPP" | "VIBER" | "SMS" | "MESSENGER" | "EMAIL";
  title: string;
  subject?: string;
  messageTemplate: string;
}

export interface DripCampaign {
  id: string;
  code: string;
  title: string;
  description: string;
  targetCategory: "OFW_INVESTOR" | "POST_TRIPPING" | "COLD_REENGAGEMENT" | "FIRST_TIME_BUYER";
  steps: DripStep[];
}

export const PREBUILT_DRIP_CAMPAIGNS: DripCampaign[] = [
  {
    id: "drip-ofw-14",
    code: "OFW_14DAY",
    title: "14-Day OFW & International Investor Nurture",
    description: "Multi-stage automated follow-up for overseas Filipinos and foreign investors with sample currency computations & virtual 3D walkthroughs.",
    targetCategory: "OFW_INVESTOR",
    steps: [
      {
        id: "ofw-step-1",
        dayOffset: 1,
        channel: "WHATSAPP",
        title: "Day 1: Curated Showcase & Multi-Currency Amortization",
        messageTemplate:
          "Kumusta {firstName}! Thank you for your inquiry on premier Philippine properties. I've prepared our verified portfolio with live OFW currency conversion (AED, SAR, USD, SGD) and sample bank computations: {showcaseUrl} — Let me know which unit code catches your eye!",
      },
      {
        id: "ofw-step-2",
        dayOffset: 3,
        channel: "WHATSAPP",
        title: "Day 3: 360° Virtual Walkthrough & Zoom Consultation",
        messageTemplate:
          "Hi {firstName}, following up on the sample 15-year bank amortization schedule. Many of our OFW clients prefer an interactive Zoom session where we tour the 3D model unit panoramas together. What time zone are you in, and would this weekend work for you?",
      },
      {
        id: "ofw-step-3",
        dayOffset: 7,
        channel: "VIBER",
        title: "Day 7: Philippine Central Bank (BSP) & Estate Infrastructure Update",
        messageTemplate:
          "Good day {firstName}! Market update: Philippine central bank (BSP) interest rates and new transit infrastructure (Subway & Expressways) are forecasting 8.5% annual capital appreciation in {preferredLocation}. Here is our latest investment yield report for {projectName}.",
      },
      {
        id: "ofw-step-4",
        dayOffset: 14,
        channel: "WHATSAPP",
        title: "Day 14: Philippine Holiday Trip & VIP Showroom Pass",
        messageTemplate:
          "Hello {firstName}! Are you planning a vacation or trip to Manila in the coming weeks? We would love to reserve a VIP showroom viewing pass, dedicated parking slot, and scale-model walkthrough for you and your family.",
      },
    ],
  },
  {
    id: "drip-tripping-7",
    code: "TRIPPING_7DAY",
    title: "7-Day Post-Tripping Decision & Reservation Closer",
    description: "High-urgency follow-up sequence immediately following an on-site property viewing or showroom visit.",
    targetCategory: "POST_TRIPPING",
    steps: [
      {
        id: "trip-step-1",
        dayOffset: 1,
        channel: "WHATSAPP",
        title: "Day 1 (+2h): Thank You & Complete Unit Spec Sheet",
        messageTemplate:
          "Hi {firstName}, thank you for viewing {projectName} with us today! Here is your complete unit specification sheet, architectural floor plan, and official payment computation: {quoteUrl}. Please feel free to ask any questions about bank requirements.",
      },
      {
        id: "trip-step-2",
        dayOffset: 3,
        channel: "SMS",
        title: "Day 3: Unit Priority Hold & Bank Pre-Qualification",
        messageTemplate:
          "Hi {firstName}, units with preferred corner views in {projectName} are moving quickly. We can place a courtesy 48-hour priority hold on {unitCode} while we assist you with BPI/BDO pre-qualification.",
      },
      {
        id: "trip-step-3",
        dayOffset: 5,
        channel: "WHATSAPP",
        title: "Day 5: Downpayment Promo & E-Sign Reservation (RAF)",
        messageTemplate:
          "Good day {firstName}! The current developer launch promo with 0% interest on monthly equity downpayment ends this month. Would you like me to prepare your official Digital Reservation Agreement (RAF)? You can sign from your phone in 2 minutes: {quoteUrl}",
      },
    ],
  },
  {
    id: "drip-reengage-30",
    code: "COLD_REENGAGE_30DAY",
    title: "30-Day Cold Lead Re-engagement & New Phase Launch",
    description: "Reactivates stalled prospects with newly opened developer inventory, low step-up equity terms, and special promos.",
    targetCategory: "COLD_REENGAGEMENT",
    steps: [
      {
        id: "re-step-1",
        dayOffset: 30,
        channel: "WHATSAPP",
        title: "Day 30: Newly Launched Residential Tower Phase",
        messageTemplate:
          "Hi {firstName}! An exclusive new residential phase was just released for {projectName} with low step-up monthly equity starting at ₱18,500/month. Would you like me to send you the newly released floor plans and inventory list?",
      },
    ],
  },
];

export function compileDripMessage(
  template: string,
  lead: Lead,
  property?: Property,
  extraVars?: { showcaseUrl?: string; quoteUrl?: string; agentName?: string }
): string {
  const result = template
    .replace(/\{firstName\}/g, lead.firstName || "Valued Client")
    .replace(/\{lastName\}/g, lead.lastName || "")
    .replace(
      /\{preferredLocation\}/g,
      lead.preferredLocations?.[0] || "Metro Manila"
    )
    .replace(
      /\{projectName\}/g,
      property?.projectName || "The Meridian Park Residences"
    )
    .replace(/\{unitCode\}/g, property?.unitCode || "Tower B - 2408")
    .replace(
      /\{showcaseUrl\}/g,
      extraVars?.showcaseUrl || "https://propflow.ph/showcase"
    )
    .replace(
      /\{quoteUrl\}/g,
      extraVars?.quoteUrl || "https://propflow.ph/quote/qt-solana-camille"
    )
    .replace(
      /\{agentName\}/g,
      extraVars?.agentName || "Licensed Real Estate Advisory Team"
    );

  return result;
}
