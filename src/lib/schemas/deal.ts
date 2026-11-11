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
 * Accredited Philippine Mortgage Financing Partner Banks
 */
export const PartnerBankEnum = z.enum([
  "BPI_FAMILY",
  "BDO_UNIBANK",
  "METROBANK",
  "SECURITY_BANK",
  "RCBC",
  "CHINABANK",
  "UNIONBANK",
  "PAG_IBIG_FUND",
  "IN_HOUSE_DEVELOPER",
  "OTHER",
]);
export type PartnerBank = z.infer<typeof PartnerBankEnum>;

export const PARTNER_BANK_LABELS: Record<PartnerBank, string> = {
  BPI_FAMILY: "BPI Family Savings / BPI Home Loan",
  BDO_UNIBANK: "BDO Unibank Consumer Lending",
  METROBANK: "Metrobank Home Loan / Private Wealth",
  SECURITY_BANK: "Security Bank Home Loan",
  RCBC: "RCBC Home Loans",
  CHINABANK: "China Bank Consumer Finance",
  UNIONBANK: "UnionBank Mortgage",
  PAG_IBIG_FUND: "Pag-IBIG Fund (HDMF Housing Loan)",
  IN_HOUSE_DEVELOPER: "Developer In-House Financing",
  OTHER: "Other Accredited Financial Institution",
};

/**
 * Bank Mortgage Letter of Guarantee (LOG) Lifecycle Stages
 */
export const LogStatusEnum = z.enum([
  "NOT_STARTED",
  "DOCS_COLLECTING",
  "SUBMITTED_TO_BANK",
  "APPRAISAL_ONGOING",
  "NOTICE_OF_APPROVAL", // NOA
  "LOG_RELEASED",        // Letter of Guarantee Officially Released
  "TAKEOUT_COMPLETE",    // Bank Proceeds Liquidated to Developer
  "REJECTED_RE_ENDORSING",
]);
export type LogStatus = z.infer<typeof LogStatusEnum>;

export const LOG_STATUS_LABELS: Record<LogStatus, string> = {
  NOT_STARTED: "Not Started (Equity Period)",
  DOCS_COLLECTING: "Collecting Income Docs",
  SUBMITTED_TO_BANK: "Endorsed / Underwriting",
  APPRAISAL_ONGOING: "Property Appraisal Ongoing",
  NOTICE_OF_APPROVAL: "Notice of Approval (NOA) Issued",
  LOG_RELEASED: "Letter of Guarantee (LOG) Released",
  TAKEOUT_COMPLETE: "Loan Takeout & Liquidation Complete",
  REJECTED_RE_ENDORSING: "Declined (Re-endorsing to Partner Bank)",
};

/**
 * Income Requirements Checklist for Philippine Bank Loans
 */
export const BankIncomeDocSchema = z.object({
  code: z.string(),
  label: z.string(),
  collected: z.boolean().default(false),
  verifiedAt: z.coerce.date().optional().nullable(),
  remarks: z.string().optional(),
});
export type BankIncomeDoc = z.infer<typeof BankIncomeDocSchema>;

export const BankLoanDetailsSchema = z.object({
  partnerBank: PartnerBankEnum.default("BPI_FAMILY"),
  applicationRefNo: z.string().default(""),
  loanOfficerName: z.string().default(""),
  loanOfficerPhone: z.string().default(""),
  loanOfficerEmail: z.string().default(""),
  targetLoanAmount: z.coerce.number().nonnegative().default(0),
  approvedLoanAmount: z.coerce.number().nonnegative().default(0),
  loanShortfall: z.coerce.number().default(0), // Balance to be covered if bank appraises below TCP
  logStatus: LogStatusEnum.default("NOT_STARTED"),
  targetLogDate: z.coerce.date().optional().nullable(),
  actualLogReleaseDate: z.coerce.date().optional().nullable(),
  logDocumentUrl: z.string().optional().nullable(),
  incomeDocsChecklist: z.array(BankIncomeDocSchema).default([]),
  remarks: z.string().optional(),
});
export type BankLoanDetails = z.infer<typeof BankLoanDetailsSchema>;

/**
 * Multi-Tranche Developer Commission Voucher
 */
export const CommissionTrancheSchema = z.object({
  id: z.string().uuid(),
  trancheNumber: z.number().int().min(1).max(5),
  name: z.string(), // e.g. "Tranche 1 (Reservation & 1st DP)"
  milestoneCondition: z.string(), // e.g. "Cleared 1st monthly DP + Verified RAF"
  percentage: z.number().min(0).max(100), // e.g. 20%
  grossAmount: z.number().nonnegative(),
  withholdingTaxAmount: z.number().nonnegative(), // 10% CWT
  netAmount: z.number().nonnegative(),
  status: z.enum(["PENDING", "ELIGIBLE", "INVOICED", "RELEASED", "DELAYED"]).default("PENDING"),
  expectedClearanceDate: z.coerce.date().optional().nullable(),
  actualReleaseDate: z.coerce.date().optional().nullable(),
  bir2307Url: z.string().optional().nullable(),
  orNumber: z.string().optional().nullable(),
});
export type CommissionTranche = z.infer<typeof CommissionTrancheSchema>;

/**
 * Co-Brokerage (50/50 External Broker) Transaction Details
 */
export const CoBrokerRoleEnum = z.enum([
  "SELLING_BROKER",
  "LISTING_BROKER",
  "REFERRAL_BROKER",
]);
export type CoBrokerRole = z.infer<typeof CoBrokerRoleEnum>;

export const CoBrokerageDetailsSchema = z.object({
  isCoBrokered: z.boolean().default(false),
  externalBrokerName: z.string().optional().default(""),
  externalBrokerPrcLicense: z.string().optional().default(""),
  externalBrokerDhsudReg: z.string().optional().default(""),
  externalBrokerageAgency: z.string().optional().default(""),
  externalBrokerPhone: z.string().optional().default(""),
  externalBrokerEmail: z.string().optional().default(""),
  coBrokeRole: CoBrokerRoleEnum.default("SELLING_BROKER"),
  coBrokeSharePercent: z.number().min(0).max(100).default(50),
  coBrokeGrossAmount: z.number().nonnegative().default(0),
  moaSigned: z.boolean().default(false),
  moaSignedDate: z.coerce.date().optional().nullable(),
  moaDocumentUrl: z.string().optional().nullable(),
  remarks: z.string().optional().default(""),
});
export type CoBrokerageDetails = z.infer<typeof CoBrokerageDetailsSchema>;

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

    // Advanced Enterprise Workflows
    bankLoanDetails: BankLoanDetailsSchema.optional(),
    commissionTranches: z.array(CommissionTrancheSchema).default([]),
    coBrokerageDetails: CoBrokerageDetailsSchema.optional(),

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

