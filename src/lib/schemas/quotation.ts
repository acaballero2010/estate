import { z } from "zod";

/**
 * Supported Real Estate Financing Channels
 */
export const FinancingTypeEnum = z.enum([
  "BANK_FINANCING",
  "PAG_IBIG_HDMF",
  "IN_HOUSE_FINANCING",
  "SPOT_DEFERRED_CASH",
]);

export type FinancingType = z.infer<typeof FinancingTypeEnum>;

export const FINANCING_TYPE_DEFAULTS: Record<
  FinancingType,
  { label: string; defaultInterestRate: number; maxTenorYears: number; minDpPercent: number }
> = {
  BANK_FINANCING: {
    label: "Bank Financing",
    defaultInterestRate: 7.5,
    maxTenorYears: 20,
    minDpPercent: 10,
  },
  PAG_IBIG_HDMF: {
    label: "Pag-IBIG / HDMF Housing Loan",
    defaultInterestRate: 6.25,
    maxTenorYears: 30,
    minDpPercent: 5,
  },
  IN_HOUSE_FINANCING: {
    label: "In-House Developer Financing",
    defaultInterestRate: 14.0,
    maxTenorYears: 10,
    minDpPercent: 20,
  },
  SPOT_DEFERRED_CASH: {
    label: "Spot / Deferred Cash (0% Interest)",
    defaultInterestRate: 0,
    maxTenorYears: 2,
    minDpPercent: 100,
  },
};

/**
 * Quotation Calculator Input Schema (React Hook Form + Zod)
 */
export const QuotationCalculationInputSchema = z
  .object({
    projectName: z.string().trim().min(1, "Project name is required"),
    unitCode: z.string().trim().min(1, "Unit / Block-Lot code is required"),
    floorAreaSqm: z.coerce.number().positive("Floor area must be > 0"),
    lotAreaSqm: z.coerce.number().nonnegative().optional().default(0),

    // Pricing & Discounts
    listPrice: z.coerce
      .number()
      .positive("List price must be greater than zero"),
    promoDiscountPercent: z.coerce
      .number()
      .min(0, "Discount cannot be negative")
      .max(50, "Discount cannot exceed 50%")
      .default(0),
    miscFeesPercent: z.coerce
      .number()
      .min(0)
      .max(20)
      .default(6.5)
      .describe("Transfer taxes, registration, and move-in fees %"),
    includeMiscInTcp: z.boolean().default(true),

    // Down Payment & Reservation Rules
    reservationFee: z.coerce
      .number()
      .nonnegative("Reservation fee cannot be negative")
      .default(25000),
    downPaymentPercent: z.coerce
      .number()
      .min(0, "Down payment % cannot be negative")
      .max(100, "Down payment % cannot exceed 100%")
      .default(20),
    downPaymentTermMonths: z.coerce
      .number()
      .int()
      .min(1, "Minimum 1 month (Spot DP)")
      .max(60, "Maximum 60 months equity period")
      .default(24),
    annualLumpsumAmount: z.coerce
      .number()
      .nonnegative("Balloon lumpsum cannot be negative")
      .optional()
      .default(0),
    isStepUpEquity: z.boolean().optional().default(false),

    // Loan Amortization Rules
    financingType: FinancingTypeEnum.default("BANK_FINANCING"),
    annualInterestRate: z.coerce
      .number()
      .min(0, "Interest rate cannot be negative")
      .max(35, "Interest rate cannot exceed 35%")
      .default(7.5),
    loanTenorYears: z.coerce
      .number()
      .int()
      .min(1, "Minimum loan tenor is 1 year")
      .max(30, "Maximum loan tenor is 30 years")
      .default(15),
  })
  .superRefine((data, ctx) => {
    if (
      data.financingType === "PAG_IBIG_HDMF" &&
      data.loanTenorYears > 30
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pag-IBIG financing allows a maximum tenor of 30 years",
        path: ["loanTenorYears"],
      });
    }
    if (
      data.financingType === "IN_HOUSE_FINANCING" &&
      data.loanTenorYears > 15
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In-house financing typically caps at 15 years",
        path: ["loanTenorYears"],
      });
    }
  });

export type QuotationCalculationInput = z.infer<
  typeof QuotationCalculationInputSchema
>;

/**
 * Single Row in the Payment / Amortization Schedule
 */
export interface PaymentScheduleRow {
  installmentNumber: number;
  stage: "RESERVATION" | "DOWN_PAYMENT" | "LOAN_AMORTIZATION";
  dueDateOffsetMonths: number;
  label: string;
  amountDue: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
}

/**
 * Computed Quotation Output Summary
 */
export interface QuotationComputationResult {
  netListPrice: number;
  discountAmount: number;
  miscFeesAmount: number;
  totalContractPrice: number;
  grossDownPayment: number;
  netDownPayment: number;
  monthlyDownPayment: number;
  loanableBalance: number;
  monthlyAmortization: number;
  requiredGrossMonthlyIncome: number; // Standard 30% Debt-to-Income bank rule
  totalLoanPayments: number;
  totalInterestPaid: number;
  downPaymentSchedule: PaymentScheduleRow[];
  annualLoanSummary: {
    year: number;
    annualPayment: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }[];
}

/**
 * Pure deterministic calculation engine for Real Estate Quotation & Amortization
 */
export function computePropertyQuotation(
  input: QuotationCalculationInput
): QuotationComputationResult {
  const discountAmount = input.listPrice * (input.promoDiscountPercent / 100);
  const netListPrice = Math.max(0, input.listPrice - discountAmount);
  const miscFeesAmount = netListPrice * (input.miscFeesPercent / 100);

  const totalContractPrice = input.includeMiscInTcp
    ? netListPrice + miscFeesAmount
    : netListPrice;

  const grossDownPayment =
    totalContractPrice * (input.downPaymentPercent / 100);
  const netDownPayment = Math.max(0, grossDownPayment - input.reservationFee);

  // Annual Balloon / Lumpsum Equity Calculation (Months 12, 24, 36, etc.)
  const lumpsumCount = Math.floor(input.downPaymentTermMonths / 12);
  const requestedLumpsum = Math.max(0, input.annualLumpsumAmount ?? 0);
  const maxAllowedPerLumpsum =
    lumpsumCount > 0 ? (netDownPayment * 0.8) / lumpsumCount : 0;
  const effectiveAnnualLumpsum = Math.min(requestedLumpsum, maxAllowedPerLumpsum);
  const totalLumpsumEquity = effectiveAnnualLumpsum * lumpsumCount;
  const regularEquityPool = Math.max(0, netDownPayment - totalLumpsumEquity);

  const monthlyDownPayment =
    input.downPaymentTermMonths > 0
      ? regularEquityPool / input.downPaymentTermMonths
      : 0;

  const loanableBalance = Math.max(0, totalContractPrice - grossDownPayment);

  // Standard fixed-rate monthly amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const totalLoanMonths = input.loanTenorYears * 12;
  const monthlyInterestRate = input.annualInterestRate / 100 / 12;

  let monthlyAmortization = 0;
  if (loanableBalance > 0 && totalLoanMonths > 0) {
    if (monthlyInterestRate === 0) {
      monthlyAmortization = loanableBalance / totalLoanMonths;
    } else {
      const compoundFactor = Math.pow(1 + monthlyInterestRate, totalLoanMonths);
      monthlyAmortization =
        (loanableBalance * (monthlyInterestRate * compoundFactor)) /
        (compoundFactor - 1);
    }
  }

  const totalLoanPayments = monthlyAmortization * totalLoanMonths;
  const totalInterestPaid = Math.max(0, totalLoanPayments - loanableBalance);

  // Bank qualification rule: Monthly amortization should not exceed 30% of GMI
  const requiredGrossMonthlyIncome =
    monthlyAmortization > 0 ? monthlyAmortization / 0.3 : 0;

  // Build Down Payment Equity Schedule (supports Standard Equal, Annual Balloon, and Step-Up Escalating)
  const downPaymentSchedule: PaymentScheduleRow[] = [];
  let runningEquityBalance = netDownPayment;

  // Step-Up Escalating calculations (e.g. Year 1: 0.7x, Year 2: 1.0x, Year 3+: 1.3x weight)
  const totalYears = Math.ceil(input.downPaymentTermMonths / 12);
  const getStepUpWeight = (month: number) => {
    if (!input.isStepUpEquity || totalYears <= 1) return 1.0;
    const yearNumber = Math.ceil(month / 12);
    if (yearNumber === 1) return 0.7; // Lower starter payment in Year 1
    if (yearNumber === 2) return 1.0; // Standard in Year 2
    return 1.3; // Stretched higher in Year 3+
  };

  let totalWeightSum = 0;
  for (let m = 1; m <= input.downPaymentTermMonths; m++) {
    totalWeightSum += getStepUpWeight(m);
  }

  const baseUnitEquity = totalWeightSum > 0 ? regularEquityPool / totalWeightSum : 0;

  for (let m = 1; m <= input.downPaymentTermMonths; m++) {
    const isBalloonMonth = m % 12 === 0 && effectiveAnnualLumpsum > 0;
    const baseMonthEquity = input.isStepUpEquity
      ? baseUnitEquity * getStepUpWeight(m)
      : monthlyDownPayment;

    const installmentDue =
      baseMonthEquity + (isBalloonMonth ? effectiveAnnualLumpsum : 0);
    runningEquityBalance = Math.max(0, runningEquityBalance - installmentDue);

    const yearNumber = Math.ceil(m / 12);
    const stepLabel = input.isStepUpEquity ? ` [Step-Up Yr ${yearNumber}]` : "";
    const balloonLabel = isBalloonMonth ? " (+ Balloon Lumpsum)" : "";

    downPaymentSchedule.push({
      installmentNumber: m,
      stage: "DOWN_PAYMENT",
      dueDateOffsetMonths: m,
      label: `Equity Month ${m} of ${input.downPaymentTermMonths}${stepLabel}${balloonLabel}`,
      amountDue: installmentDue,
      principalComponent: installmentDue,
      interestComponent: 0,
      remainingBalance: runningEquityBalance,
    });
  }

  // Build Annual Loan Amortization Summary
  const annualLoanSummary: QuotationComputationResult["annualLoanSummary"] = [];
  let remainingLoanPrincipal = loanableBalance;

  if (loanableBalance > 0) {
    for (let yr = 1; yr <= input.loanTenorYears; yr++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      for (let m = 1; m <= 12; m++) {
        const interestForMonth = remainingLoanPrincipal * monthlyInterestRate;
        const principalForMonth = Math.min(
          remainingLoanPrincipal,
          monthlyAmortization - interestForMonth
        );
        yearlyInterest += interestForMonth;
        yearlyPrincipal += principalForMonth;
        remainingLoanPrincipal = Math.max(
          0,
          remainingLoanPrincipal - principalForMonth
        );
      }

      annualLoanSummary.push({
        year: yr,
        annualPayment: yearlyPrincipal + yearlyInterest,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        endingBalance: remainingLoanPrincipal,
      });
    }
  }

  return {
    netListPrice,
    discountAmount,
    miscFeesAmount,
    totalContractPrice,
    grossDownPayment,
    netDownPayment,
    monthlyDownPayment,
    loanableBalance,
    monthlyAmortization,
    requiredGrossMonthlyIncome,
    totalLoanPayments,
    totalInterestPaid,
    downPaymentSchedule,
    annualLoanSummary,
  };
}

/**
 * Persisted Quotation Entity Schema
 */
export const QuotationSchema = z.object({
  id: z.string().uuid(),
  referenceNumber: z.string().min(1), // e.g., "QT-2026-0042"
  leadId: z.string().uuid(),
  agentId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  status: z
    .enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "EXPIRED"])
    .default("DRAFT"),
  validUntil: z.coerce.date(),
  calculationInput: QuotationCalculationInputSchema,
  agentNotes: z.string().max(2000).optional(),
  disclaimerText: z
    .string()
    .default(
      "Prices, discounts, and interest rates are subject to change without prior notice. Final loan approval and interest rates are determined by the financing institution upon credit evaluation."
    ),
  pdfUrl: z.string().url().optional().nullable(),
  shareToken: z.string().min(8),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Quotation = z.infer<typeof QuotationSchema>;

