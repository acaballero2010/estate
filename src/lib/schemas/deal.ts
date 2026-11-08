import { z } from "zod";
import { FinancingTypeEnum } from "./quotation";

/**
 * Deal & Closing Lifecycle Statuses
 */
export const DealStageEnum = z.enum([
  "RESERVED",
  "DOCUMENTATION_PENDING",
  "EQUITY_PAYING",
  "LOAN_PROCESSING",
  "LOGGED_FOR_TAKEOUT",
  "CLOSED_RELEASED",
  "CANCELLED_FORFEITED",
]);

export type DealStage = z.infer<typeof DealStageEnum>;

/**
 * Buyer Requirements / Closing Document Checklist Item
 */
export const DealRequirementItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1), // e.g., "RA_SIGNED", "GOV_ID_2X", "PROOF_OF_INCOME", "PDC_ISSUED"
  label: z.string().min(1),
  requiredForFinancing: z.array(FinancingTypeEnum).default([]),
  status: z
    .enum(["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"])
    .default("PENDING"),
  documentUrl: z.string().url().optional().nullable(),
  verifiedByAgentId: z.string().uuid().optional().nullable(),
  verifiedAt: z.coerce.date().optional().nullable(),
  remarks: z.string().max(500).optional(),
});

export type DealRequirementItem = z.infer<typeof DealRequirementItemSchema>;

/**
 * Payment Proof / Reservation Receipt Record
 */
export const PaymentProofSchema = z.object({
  id: z.string().uuid(),
  dealId: z.string().uuid(),
  paymentType: z.enum([
    "RESERVATION_FEE",
    "DOWN_PAYMENT_EQUITY",
    "MISC_TRANSFER_FEE",
    "FULL_SPOT_CASH",
  ]),
  amountPaid: z.coerce.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum([
    "BANK_TRANSFER",
    "GCASH_MAYA",
    "CHECK_PDC",
    "CREDIT_CARD",
    "OVER_THE_COUNTER",
  ]),
  referenceNo: z.string().trim().min(1, "Transaction reference number is required"),
  receiptImageUrl: z.string().url("Valid receipt URL is required"),
  paidAt: z.coerce.date(),
  verified: z.boolean().default(false),
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

/**
 * Agent / Broker Commission Split Entry
 */
export const CommissionSplitSchema = z.object({
  id: z.string().uuid(),
  recipientId: z.string().uuid(),
  recipientName: z.string().min(1),
  role: z.enum([
    "SELLING_AGENT",
    "UNIT_MANAGER",
    "SALES_DIRECTOR",
    "LICENSED_BROKER",
    "REFERRAL_PARTNER",
  ]),
  splitPercentage: z.coerce
    .number()
    .min(0, "Split % cannot be negative")
    .max(100, "Split % cannot exceed 100%"),
  grossAmount: z.coerce.number().nonnegative(),
  withholdingTaxRate: z.coerce.number().min(0).max(30).default(10), // e.g., 10% EWT
  netCommissionAmount: z.coerce.number().nonnegative(),
  releaseStatus: z
    .enum(["PROJECTED", "ELIGIBLE_FOR_BILLING", "INVOICED", "PARTIALLY_RELEASED", "FULLY_RELEASED"])
    .default("PROJECTED"),
  releasedAmount: z.coerce.number().nonnegative().default(0),
  releasedAt: z.coerce.date().optional().nullable(),
});

export type CommissionSplit = z.infer<typeof CommissionSplitSchema>;

/**
 * Full Deal & Reservation Closing Model Schema
 */
export const DealSchema = z
  .object({
    id: z.string().uuid(),
    dealNumber: z.string().min(1), // e.g., "DL-2026-0089"
    leadId: z.string().uuid(),
    quotationId: z.string().uuid(),
    propertyId: z.string().uuid(),
    closingAgentId: z.string().uuid(),
    stage: DealStageEnum.default("RESERVED"),
    financingType: FinancingTypeEnum,

    // Financial Snapshot at Closing
    totalContractPrice: z.coerce.number().positive(),
    netCommissionablePrice: z.coerce
      .number()
      .positive("Net commissionable price is required"),
    totalCommissionRatePercent: z.coerce
      .number()
      .min(0.5)
      .max(15)
      .default(5.0),
    grossCommissionTotal: z.coerce.number().nonnegative(),

    // Dates
    reservationDate: z.coerce.date(),
    targetLoanTakeoutDate: z.coerce.date().optional().nullable(),
    actualClosedDate: z.coerce.date().optional().nullable(),

    // Collections & Checklists
    requirementsChecklist: z.array(DealRequirementItemSchema).default([]),
    paymentProofs: z.array(PaymentProofSchema).default([]),
    commissionSplits: z.array(CommissionSplitSchema).default([]),

    notes: z.string().max(4000).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .refine(
    (deal) => {
      if (deal.commissionSplits.length === 0) return true;
      const totalSplit = deal.commissionSplits.reduce(
        (acc, split) => acc + split.splitPercentage,
        0
      );
      return Math.abs(totalSplit - 100) < 0.01;
    },
    {
      message: "Commission split percentages across recipients must sum to 100%",
      path: ["commissionSplits"],
    }
  );

export type Deal = z.infer<typeof DealSchema>;

/**
 * Helper to compute projected vs. collected commission metrics for a Deal
 */
export function computeDealCommissionMetrics(deal: Pick<
  Deal,
  "netCommissionablePrice" | "totalCommissionRatePercent" | "commissionSplits"
>) {
  const grossCommissionPool =
    deal.netCommissionablePrice * (deal.totalCommissionRatePercent / 100);

  const totalNetProjected = deal.commissionSplits.reduce(
    (sum, s) => sum + s.netCommissionAmount,
    0
  );
  const totalCollected = deal.commissionSplits.reduce(
    (sum, s) => sum + s.releasedAmount,
    0
  );
  const remainingCollectible = Math.max(0, totalNetProjected - totalCollected);

  return {
    grossCommissionPool,
    totalNetProjected,
    totalCollected,
    remainingCollectible,
    collectionProgressPercent:
      totalNetProjected > 0 ? (totalCollected / totalNetProjected) * 100 : 0,
  };
}

