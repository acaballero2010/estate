import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes safely without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats numbers into currency strings (defaults to PHP - Philippine Peso, configurable for USD/etc.)
 */
export function formatCurrency(
  amount: number,
  currency: "PHP" | "USD" = "PHP",
  maximumFractionDigits = 2
): string {
  return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Formats compact currency values for Kanban cards & mobile badges (e.g. ₱4.5M, ₱850K)
 */
export function formatCompactCurrency(
  amount: number,
  currency: "PHP" | "USD" = "PHP"
): string {
  return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

