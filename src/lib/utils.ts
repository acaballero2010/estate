import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SupportedCurrency = "PHP" | "USD" | "AED" | "SGD" | "EUR";

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

