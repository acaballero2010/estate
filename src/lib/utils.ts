import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SupportedCurrency = "PHP" | "USD" | "AED" | "SGD" | "EUR" | "CAD";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  flag: string;
  // Rates relative to 1 PHP (approximate market indicative rates)
  phpRate: number; // 1 TargetCurrency = X PHP
}

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  PHP: { code: "PHP", symbol: "₱", label: "Philippine Peso", flag: "🇵🇭", phpRate: 1.0 },
  USD: { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸", phpRate: 58.5 },
  AED: { code: "AED", symbol: "AED ", label: "UAE Dirham", flag: "🇦🇪", phpRate: 15.93 },
  SGD: { code: "SGD", symbol: "S$", label: "Singapore Dollar", flag: "🇸🇬", phpRate: 44.2 },
  EUR: { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺", phpRate: 63.8 },
  CAD: { code: "CAD", symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦", phpRate: 41.8 },
};

/**
 * Converts a PHP base amount to the selected target currency.
 */
export function convertFromPhp(amountInPhp: number, targetCurrency: SupportedCurrency): number {
  if (targetCurrency === "PHP") return amountInPhp;
  const config = CURRENCY_CONFIGS[targetCurrency];
  return amountInPhp / config.phpRate;
}

/**
 * Formats numbers into currency strings (supports PHP, USD, AED, SGD, EUR)
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = "PHP",
  maximumFractionDigits = 2
): string {
  const localeMap: Record<SupportedCurrency, string> = {
    PHP: "en-PH",
    USD: "en-US",
    AED: "en-AE",
    SGD: "en-SG",
    EUR: "en-DE",
    CAD: "en-CA",
  };

  try {
    return new Intl.NumberFormat(localeMap[currency] || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    const config = CURRENCY_CONFIGS[currency];
    return `${config.symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
      maximumFractionDigits,
    })}`;
  }
}

/**
 * Formats compact currency values for Kanban cards & mobile badges (e.g. ₱4.5M, $75K)
 */
export function formatCompactCurrency(
  amount: number,
  currency: SupportedCurrency = "PHP"
): string {
  const localeMap: Record<SupportedCurrency, string> = {
    PHP: "en-PH",
    USD: "en-US",
    AED: "en-AE",
    SGD: "en-SG",
    EUR: "en-DE",
    CAD: "en-CA",
  };

  try {
    return new Intl.NumberFormat(localeMap[currency] || "en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    const config = CURRENCY_CONFIGS[currency];
    return `${config.symbol}${amount.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
  }
}

export interface FormatQuotationShareParams {
  projectName: string;
  unitCode: string;
  floorAreaSqm: number;
  locationCity?: string;
  totalContractPrice: number;
  reservationFee: number;
  monthlyDownPayment: number;
  downPaymentMonths: number;
  monthlyAmortization: number;
  loanTenorYears: number;
  annualInterestRate: number;
  buyerName?: string;
  buyerPhone?: string;
  agentName?: string;
  agentLicense?: string;
  shareUrl: string;
  currency?: SupportedCurrency;
  customNote?: string;
}

/**
 * Generates an emoji-formatted, mobile-ready card for WhatsApp and Viber
 */
export function generateWhatsAppViberQuotationText(
  params: FormatQuotationShareParams
): string {
  const {
    projectName,
    unitCode,
    floorAreaSqm,
    locationCity,
    totalContractPrice,
    reservationFee,
    monthlyDownPayment,
    downPaymentMonths,
    monthlyAmortization,
    loanTenorYears,
    annualInterestRate,
    buyerName,
    agentName,
    agentLicense,
    shareUrl,
    currency = "PHP",
    customNote,
  } = params;

  const isConverted = currency !== "PHP";
  const tcpConverted = isConverted
    ? ` (≈ ${formatCurrency(convertFromPhp(totalContractPrice, currency), currency)})`
    : "";
  const dpConverted = isConverted
    ? ` (≈ ${formatCurrency(convertFromPhp(monthlyDownPayment, currency), currency)}/mo)`
    : "";
  const maConverted = isConverted
    ? ` (≈ ${formatCurrency(convertFromPhp(monthlyAmortization, currency), currency)}/mo)`
    : "";

  const lines = [
    `🏢 *${projectName.toUpperCase()}*`,
    `📍 *Unit ${unitCode}* • ${locationCity || "Metro Manila"} (${floorAreaSqm} sqm)`,
    "",
    `💰 *Total Contract Price:* ${formatCurrency(totalContractPrice, "PHP", 0)}${tcpConverted}`,
    `🔑 *Reservation Fee:* ${formatCurrency(reservationFee, "PHP", 0)}`,
    `📅 *Monthly Equity (${downPaymentMonths} mos):* ${formatCurrency(monthlyDownPayment, "PHP", 0)}/mo${dpConverted}`,
    `🏦 *Bank Amortization (${loanTenorYears} yrs @ ${annualInterestRate}%):* ${formatCurrency(monthlyAmortization, "PHP", 0)}/mo${maConverted}`,
  ];

  if (customNote?.trim()) {
    lines.push("", `💡 *Note:* ${customNote.trim()}`);
  }

  lines.push(
    "",
    `👉 *View your interactive proposal & digital deal sheet:*`,
    shareUrl
  );

  if (buyerName) {
    lines.push("", `👤 *Prepared exclusively for:* ${buyerName}`);
  }

  if (agentName) {
    lines.push(`💼 *Broker/Agent:* ${agentName}${agentLicense ? ` (${agentLicense})` : ""}`);
  }

  return lines.join("\n");
}

/**
 * Normalizes phone numbers for WhatsApp API links (wa.me/<number>)
 * Converts Philippine local numbers (09XX or 9XX) to international format (639XX)
 * Removes non-digit characters.
 */
export function normalizePhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("09") && digits.length === 11) {
    return `63${digits.slice(1)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `63${digits}`;
  }
  if (digits.startsWith("63")) {
    return digits;
  }
  return digits;
}

/**
 * Normalizes phone numbers for tel: URI RFC 3966 standards
 */
export function normalizePhoneForTel(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return hasPlus ? `+${digits}` : digits;
}



