import { z } from "zod";

/**
 * Pipeline Stages matching the Kanban Workflow
 */
export const PipelineStageEnum = z.enum([
  "NEW_LEAD",
  "CONTACTED",
  "SITE_TRIPPING",
  "PROPOSAL_SENT",
  "RESERVATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export type PipelineStage = z.infer<typeof PipelineStageEnum>;

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  SITE_TRIPPING: "Site Tripping / Viewing",
  PROPOSAL_SENT: "Proposal / Quotation Sent",
  RESERVATION: "Reservation / Under Contract",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

/**
 * Lead Acquisition Channels
 */
export const LeadSourceEnum = z.enum([
  "FACEBOOK_MESSENGER",
  "WEB_CAPTURE_FORM",
  "MANUAL_ENTRY",
  "WALK_IN_OPEN_HOUSE",
  "REFERRAL",
  "PORTAL_INQUIRY",
]);

export type LeadSource = z.infer<typeof LeadSourceEnum>;

/**
 * Property Categories
 */
export const PropertyTypeEnum = z.enum([
  "CONDOMINIUM",
  "HOUSE_AND_LOT",
  "TOWNHOUSE",
  "RESIDENTIAL_LOT",
  "COMMERCIAL_UNIT",
]);

export type PropertyType = z.infer<typeof PropertyTypeEnum>;

/**
 * Buyer Identity / KYC Document Schema
 */
export const BuyerDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Document name is required"),
  type: z.enum([
    "GOVERNMENT_ID",
    "TIN_ID",
    "PROOF_OF_INCOME",
    "PROOF_OF_BILLING",
    "BIRTH_OR_MARRIAGE_CERT",
    "RESERVATION_FORM",
    "OTHER",
  ]),
  fileUrl: z.string().min(1, "Valid document URL is required"),
  verified: z.boolean().default(false),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
  remarks: z.string().optional(),
  uploadedAt: z.coerce.date(),
});

export type BuyerDocument = z.infer<typeof BuyerDocumentSchema>;

export interface DocumentRequirementDefinition {
  type: BuyerDocument["type"];
  code: string;
  label: string;
  description: string;
  required: boolean;
}

export const STANDARD_KYC_REQUIREMENTS: DocumentRequirementDefinition[] = [
  {
    type: "GOVERNMENT_ID",
    code: "GOV_ID_PRIMARY",
    label: "Primary Government-Issued ID",
    description: "Passport, Driver's License, UMID, or PRC ID (Front & Back)",
    required: true,
  },
  {
    type: "TIN_ID",
    code: "TIN_PROOF",
    label: "Tax Identification Number (TIN)",
    description: "BIR TIN Card, BIR 1904 form, or verified verification slip",
    required: true,
  },
  {
    type: "PROOF_OF_INCOME",
    code: "PROOF_OF_INCOME",
    label: "Proof of Income",
    description: "Latest 3 months payslips, COEC, or Remittance Receipts (OFW)",
    required: true,
  },
  {
    type: "PROOF_OF_BILLING",
    code: "PROOF_OF_BILLING",
    label: "Proof of Billing Address",
    description: "Utility bill (Meralco, Maynilad, Telecom, or Credit Card statement)",
    required: true,
  },
  {
    type: "BIRTH_OR_MARRIAGE_CERT",
    code: "CIVIL_STATUS_CERT",
    label: "PSA Marriage / Birth Certificate",
    description: "PSA Marriage Contract (if married) or PSA Birth Certificate",
    required: false,
  },
  {
    type: "RESERVATION_FORM",
    code: "RESERVATION_AGREEMENT",
    label: "Signed Buyer Information Sheet & Reservation Agreement",
    description: "E-signed developer reservation agreement with terms conformity",
    required: true,
  },
];

/**
 * Lead Interaction / Timeline Activity Log
 */
export const LeadActivitySchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  agentId: z.string().uuid(),
  type: z.enum([
    "STAGE_CHANGED",
    "NOTE_ADDED",
    "MESSENGER_MESSAGE",
    "TRIPPING_SCHEDULED",
    "QUOTATION_GENERATED",
    "CALL_LOGGED",
  ]),
  summary: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.coerce.date(),
});

export type LeadActivity = z.infer<typeof LeadActivitySchema>;

/**
 * Full Lead Model Schema
 */
export const LeadSchema = z
  .object({
    id: z.string().uuid(),
    assignedAgentId: z.string().uuid(),
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .min(7, "Phone number must be at least 7 digits")
      .max(20),
    messengerPsid: z
      .string()
      .optional()
      .describe("Meta Page-Scoped User ID (PSID) for Messenger webhook sync"),
    stage: PipelineStageEnum.default("NEW_LEAD"),
    source: LeadSourceEnum.default("MANUAL_ENTRY"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "HOT"]).default("MEDIUM"),
    budgetMin: z.coerce
      .number()
      .nonnegative("Minimum budget cannot be negative")
      .default(0),
    budgetMax: z.coerce
      .number()
      .positive("Maximum budget must be greater than 0"),
    preferredLocations: z
      .array(z.string().trim().min(1))
      .min(1, "Specify at least one preferred location"),
    preferredPropertyTypes: z
      .array(PropertyTypeEnum)
      .min(1, "Select at least one property type"),
    financingPreference: z
      .enum(["BANK", "PAG_IBIG", "IN_HOUSE", "SPOT_CASH", "UNDECIDED"])
      .default("BANK"),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string()).default([]),
    documents: z.array(BuyerDocumentSchema).default([]),
    lastContactedAt: z.coerce.date().optional().nullable(),
    nextFollowUpAt: z.coerce.date().optional().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  });

export type Lead = z.infer<typeof LeadSchema>;

/**
 * Create / Update Lead Form Input Schema (for React Hook Form)
 */
export const CreateLeadInputSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    phone: z.string().trim().min(7, "Valid contact number is required").max(20),
    messengerPsid: z.string().optional(),
    stage: PipelineStageEnum.default("NEW_LEAD"),
    source: LeadSourceEnum.default("MANUAL_ENTRY"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "HOT"]).default("MEDIUM"),
    budgetMin: z.coerce.number().nonnegative().default(0),
    budgetMax: z.coerce.number().positive("Enter buyer target budget"),
    preferredLocations: z
      .array(z.string().trim().min(1))
      .min(1, "Add at least one preferred location"),
    preferredPropertyTypes: z
      .array(PropertyTypeEnum)
      .min(1, "Select at least one property type"),
    financingPreference: z
      .enum(["BANK", "PAG_IBIG", "IN_HOUSE", "SPOT_CASH", "UNDECIDED"])
      .default("BANK"),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string()).optional(),
    nextFollowUpAt: z.coerce.date().optional().nullable(),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMax"],
  });

export type CreateLeadInput = z.infer<typeof CreateLeadInputSchema>;

/**
 * Kanban Stage Mutation Payload
 */
export const UpdateLeadStageSchema = z.object({
  leadId: z.string().uuid(),
  targetStage: PipelineStageEnum,
  note: z.string().max(500).optional(),
});

export type UpdateLeadStageInput = z.infer<typeof UpdateLeadStageSchema>;

