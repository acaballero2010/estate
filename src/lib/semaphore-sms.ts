/**
 * Semaphore SMS API Client & Utilities
 * Provider: Semaphore.co (Philippine Direct Telco Route: Globe, Smart, DITO, TNT, TM)
 */

export interface SemaphoreSmsPayload {
  to: string; // Recipient mobile number (e.g. 09171234567 or +639171234567)
  message: string;
  sendername?: string; // Optional custom sender ID registered with Semaphore
}

export interface SemaphoreSmsResponse {
  success: boolean;
  messageId?: string | number;
  recipient: string;
  status: "SENT" | "SIMULATED" | "FAILED";
  network?: string; // e.g., "Globe", "Smart"
  creditsUsed: number;
  error?: string;
}

/**
 * Normalizes any Philippine mobile phone representation to Semaphore's 11-digit 09xxxxxxxxx format.
 */
export function normalizePhilippineMobile(phone: string): {
  normalized: string;
  isValid: boolean;
  carrier: "GLOBE/TM" | "SMART/TNT" | "DITO" | "UNKNOWN";
} {
  if (!phone) {
    return { normalized: "", isValid: false, carrier: "UNKNOWN" };
  }

  // Strip spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // Convert +639... to 09...
  if (cleaned.startsWith("+63")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("63")) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith("9")) {
    cleaned = "0" + cleaned;
  }

  const isValid = /^09\d{9}$/.test(cleaned);

  // Identify carrier prefix if valid
  let carrier: "GLOBE/TM" | "SMART/TNT" | "DITO" | "UNKNOWN" = "UNKNOWN";
  if (isValid) {
    const prefix = cleaned.substring(0, 4);
    const globePrefixes = ["0915", "0916", "0917", "0926", "0927", "0935", "0936", "0945", "0955", "0956", "0965", "0966", "0967", "0975", "0977", "0995", "0997"];
    const smartPrefixes = ["0908", "0918", "0919", "0920", "0921", "0928", "0929", "0939", "0947", "0949", "0951", "0961", "0998", "0999"];
    const ditoPrefixes = ["0991", "0992", "0993", "0994"];

    if (globePrefixes.includes(prefix)) {
      carrier = "GLOBE/TM";
    } else if (smartPrefixes.includes(prefix)) {
      carrier = "SMART/TNT";
    } else if (ditoPrefixes.includes(prefix)) {
      carrier = "DITO";
    }
  }

  return { normalized: cleaned, isValid, carrier };
}

/**
 * Calculates SMS segment count (160 characters per standard GSM-7 SMS credit)
 */
export function calculateSmsSegments(text: string): {
  charCount: number;
  segments: number;
  remainingInSegment: number;
} {
  const charCount = text.length;
  if (charCount <= 160) {
    return {
      charCount,
      segments: charCount === 0 ? 0 : 1,
      remainingInSegment: 160 - charCount,
    };
  }

  // Concatenated SMS uses 153 chars per segment due to UDH header
  const segments = Math.ceil(charCount / 153);
  const remainingInSegment = segments * 153 - charCount;
  return {
    charCount,
    segments,
    remainingInSegment,
  };
}

/**
 * Pre-defined Philippine Real Estate SMS Templates
 */
export const PH_REAL_ESTATE_SMS_TEMPLATES = [
  {
    id: "TRIPPING_CONFIRMATION",
    title: "Showroom / Site Tripping Confirmation",
    description: "Send after booking a site inspection",
    template:
      "Hi {{firstName}}, this is {{agentName}} from PropFlow. Confirming your scheduled property inspection for {{projectName}} on {{date}} at {{time}}. See you there!",
  },
  {
    id: "QUOTATION_READY",
    title: "Official Price Computation Ready",
    description: "Notify buyer that computation is available",
    template:
      "Hi {{firstName}}, your official unit computation & payment schedule for {{projectName}} ({{unitCode}}) is ready: {{link}} - {{agentName}}, PropFlow",
  },
  {
    id: "DOWNPAYMENT_REMINDER",
    title: "Monthly Downpayment Due Reminder",
    description: "Post-reservation equity collection prompt",
    template:
      "Hi {{firstName}}, friendly reminder from PropFlow: Monthly equity tranche #{{tranche}} for {{projectName}} of {{amount}} is due on {{date}}. Ref: {{dealNumber}}.",
  },
  {
    id: "DOCUMENT_KYC_REQUEST",
    title: "Bank Financing Document Request",
    description: "Expedite LOG & mortgage pre-qualification",
    template:
      "Hi {{firstName}}, to process your bank home loan approval for {{projectName}}, kindly send 2 valid IDs & BIR 2316 to {{agentPhone}}. Salamat! - {{agentName}}",
  },
  {
    id: "HOT_UNIT_ALERT",
    title: "High-Yield Re-Open Unit Alert",
    description: "Broadcast newly available pre-selling unit",
    template:
      "Hi {{firstName}}, a prime corner unit just re-opened at {{projectName}} within your {{budgetMax}} budget. High ROI potential. Inquire now: {{agentPhone}}",
  },
] as const;

export function compileSmsTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value ?? ""));
  }
  return result;
}

/**
 * Client-side function to send SMS via PropFlow's internal API route
 */
export async function sendDirectSms(
  payload: SemaphoreSmsPayload
): Promise<SemaphoreSmsResponse> {
  const response = await fetch("/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to dispatch SMS through Semaphore gateway");
  }

  return response.json();
}

