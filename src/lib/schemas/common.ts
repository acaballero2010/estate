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
  prcExpiryDate: z.string().optional().nullable(),
  dhsudRegistrationNo: z.string().optional().nullable(),
  dhsudExpiryDate: z.string().optional().nullable(),
  licensingBodyLogoUrl: z.string().optional().nullable(),
  boardAffiliation: z.string().optional().nullable(),
  awards: z.array(z.string()).default([]),
  bioHeadline: z.string().optional().nullable(),
  phone: z.string().min(7),
  avatarUrl: z.string().optional().nullable(),
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
  listedByAgentId: z.string().optional().nullable(),
  listedByAgentName: z.string().optional().nullable(),
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

/**
 * Site Tripping / Showroom Viewing Schedule Schema
 */
export const TrippingScheduleSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  propertyId: z.string(),
  scheduledDate: z.string(), // YYYY-MM-DD
  scheduledTime: z.string(), // HH:mm
  meetingPoint: z.string(),
  status: z
    .enum(["CONFIRMED", "COMPLETED", "RESCHEDULED", "CANCELLED"])
    .default("CONFIRMED"),
  notes: z.string().default(""),
  createdAt: z.string().optional(),
});

export type TrippingScheduleItem = z.infer<typeof TrippingScheduleSchema>;

/**
 * Agent Meta Messenger Channel Configuration Schema
 */
export const AgentMessengerSettingsSchema = z.object({
  pageId: z.string().min(1, "Facebook Page ID is required"),
  pageName: z.string().default(""),
  pageAccessToken: z.string().min(1, "Page Access Token is required"),
  appSecret: z.string().optional().default(""),
  verifyToken: z.string().default("propflow_meta_verify_secret_2026"),
  isConnected: z.boolean().default(false),
  lastVerifiedAt: z.string().nullable().optional(),
  autoReplyGreeting: z.boolean().default(true),
  greetingMessage: z
    .string()
    .default(
      "Hi {name}! Thanks for reaching out to us. Are you interested in pre-selling or ready-for-occupancy units?"
    ),
  updatedAt: z.string().optional(),
});

export type AgentMessengerSettings = z.infer<typeof AgentMessengerSettingsSchema>;


