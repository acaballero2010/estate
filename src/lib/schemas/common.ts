import { z } from "zod";
import { PropertyTypeEnum } from "./lead";

/**
 * Real Estate Agent / Broker Schema
 */
export const AgentSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(["AGENT", "TEAM_LEADER", "BROKER", "ADMIN"]).default("AGENT"),
  prcLicenseNumber: z.string().optional().nullable(),
  dhsudRegistrationNo: z.string().optional().nullable(),
  phone: z.string().min(7),
  avatarUrl: z.string().url().optional().nullable(),
  agencyName: z.string().default("PropFlow Realty Group"),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
});

export type Agent = z.infer<typeof AgentSchema>;

/**
 * Property / Unit Inventory Schema
 */
export const PropertySchema = z.object({
  id: z.string().uuid(),
  projectName: z.string().min(1),
  developerName: z.string().min(1),
  unitCode: z.string().min(1), // e.g., "Tower A - 1804"
  propertyType: PropertyTypeEnum,
  locationCity: z.string().min(1),
  address: z.string().min(1),
  floorAreaSqm: z.coerce.number().positive(),
  lotAreaSqm: z.coerce.number().nonnegative().default(0),
  bedrooms: z.coerce.number().int().nonnegative().default(1),
  bathrooms: z.coerce.number().int().nonnegative().default(1),
  parkingSlots: z.coerce.number().int().nonnegative().default(0),
  listPrice: z.coerce.number().positive(),
  reservationFee: z.coerce.number().nonnegative().default(25000),
  status: z
    .enum(["AVAILABLE", "ON_HOLD", "RESERVED", "SOLD"])
    .default("AVAILABLE"),
  turnoverDate: z.string().optional(), // e.g., "Q4 2027 (Pre-selling)" or "RFO"
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).default([]),
  videoWalkthroughUrl: z.string().url().optional().or(z.literal("")),
  createdAt: z.coerce.date(),
});

export type Property = z.infer<typeof PropertySchema>;

/**
 * Create Property Form Input Schema (for React Hook Form)
 */
export const CreatePropertyInputSchema = PropertySchema.omit({
  id: true,
  createdAt: true,
});

export type CreatePropertyInput = z.infer<typeof CreatePropertyInputSchema>;

/**
 * Meta Messenger / Omnichannel Chat Message Schema
 */
export const MessageSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  senderType: z.enum(["LEAD", "AGENT", "SYSTEM_BOT"]),
  senderId: z.string(),
  channel: z.enum(["FACEBOOK_MESSENGER", "INTERNAL_NOTE", "SMS", "EMAIL"]).default("FACEBOOK_MESSENGER"),
  metaMid: z
    .string()
    .optional()
    .describe("Meta Graph API Message ID for webhook idempotency"),
  content: z.string().min(1),
  attachedQuotationId: z.string().uuid().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  deliveryStatus: z
    .enum(["SENDING", "SENT", "DELIVERED", "READ", "FAILED"])
    .default("SENT"),
  createdAt: z.coerce.date(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Saved Quick-Reply Snippet for Messenger Hub
 */
export const SavedReplySnippetSchema = z.object({
  id: z.string().uuid(),
  shortcut: z.string().min(2), // e.g. "/tripping", "/bankreq"
  title: z.string().min(1),
  category: z.enum(["FAQ", "TRIPPING", "PAYMENT_TERMS", "REQUIREMENTS"]),
  bodyTemplate: z.string().min(1),
});

export type SavedReplySnippet = z.infer<typeof SavedReplySnippetSchema>;

