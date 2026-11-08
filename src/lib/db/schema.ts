import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type {
  BuyerDocument,
  DealRequirementItem,
  CommissionSplit,
  QuotationCalculationInput,
} from "@/lib/schemas";

// PostgreSQL Native Enums
export const pipelineStagePgEnum = pgEnum("pipeline_stage", [
  "NEW_LEAD",
  "CONTACTED",
  "SITE_TRIPPING",
  "PROPOSAL_SENT",
  "RESERVATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export const leadSourcePgEnum = pgEnum("lead_source", [
  "FACEBOOK_MESSENGER",
  "WEB_CAPTURE_FORM",
  "MANUAL_ENTRY",
  "WALK_IN_OPEN_HOUSE",
  "REFERRAL",
  "PORTAL_INQUIRY",
]);

export const financingTypePgEnum = pgEnum("financing_type", [
  "BANK_FINANCING",
  "PAG_IBIG_HDMF",
  "IN_HOUSE_FINANCING",
  "SPOT_DEFERRED_CASH",
]);

export const dealStagePgEnum = pgEnum("deal_stage", [
  "RESERVED",
  "DOCUMENTATION_PENDING",
  "EQUITY_PAYING",
  "LOAN_PROCESSING",
  "LOGGED_FOR_TAKEOUT",
  "CLOSED_RELEASED",
  "CANCELLED_FORFEITED",
]);

// 1. Agents Table
export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  role: varchar("role", { length: 32 }).default("AGENT").notNull(),
  prcLicenseNumber: varchar("prc_license_number", { length: 64 }),
  dhsudRegistrationNo: varchar("dhsud_registration_no", { length: 64 }),
  phone: varchar("phone", { length: 32 }).notNull(),
  avatarUrl: text("avatar_url"),
  agencyName: varchar("agency_name", { length: 160 })
    .default("PropFlow Realty Group")
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. Properties / Units Inventory Table
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectName: varchar("project_name", { length: 180 }).notNull(),
  developerName: varchar("developer_name", { length: 160 }).notNull(),
  unitCode: varchar("unit_code", { length: 64 }).notNull(),
  propertyType: varchar("property_type", { length: 48 }).notNull(),
  locationCity: varchar("location_city", { length: 120 }).notNull(),
  address: text("address").notNull(),
  floorAreaSqm: numeric("floor_area_sqm", { precision: 10, scale: 2 }).notNull(),
  lotAreaSqm: numeric("lot_area_sqm", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  bedrooms: integer("bedrooms").default(1).notNull(),
  bathrooms: integer("bathrooms").default(1).notNull(),
  parkingSlots: integer("parking_slots").default(0).notNull(),
  listPrice: numeric("list_price", { precision: 15, scale: 2 }).notNull(),
  reservationFee: numeric("reservation_fee", { precision: 12, scale: 2 })
    .default("25000")
    .notNull(),
  status: varchar("status", { length: 32 }).default("AVAILABLE").notNull(),
  turnoverDate: varchar("turnover_date", { length: 64 }),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 3. Leads Table (with RLS Agent Isolation support)
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignedAgentId: uuid("assigned_agent_id")
      .references(() => agents.id, { onDelete: "restrict" })
      .notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }).notNull(),
    messengerPsid: varchar("messenger_psid", { length: 128 }).unique(),
    stage: pipelineStagePgEnum("stage").default("NEW_LEAD").notNull(),
    source: leadSourcePgEnum("source").default("MANUAL_ENTRY").notNull(),
    priority: varchar("priority", { length: 16 }).default("MEDIUM").notNull(),
    budgetMin: numeric("budget_min", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    budgetMax: numeric("budget_max", { precision: 15, scale: 2 }).notNull(),
    preferredLocations: jsonb("preferred_locations")
      .$type<string[]>()
      .default([])
      .notNull(),
    preferredPropertyTypes: jsonb("preferred_property_types")
      .$type<string[]>()
      .default([])
      .notNull(),
    financingPreference: varchar("financing_preference", { length: 32 })
      .default("BANK")
      .notNull(),
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    documents: jsonb("documents")
      .$type<BuyerDocument[]>()
      .default([])
      .notNull(),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_leads_agent_stage").on(table.assignedAgentId, table.stage),
    index("idx_leads_messenger_psid").on(table.messengerPsid),
  ]
);

// 4. Quotations Table
export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNumber: varchar("reference_number", { length: 48 })
      .notNull()
      .unique(),
    leadId: uuid("lead_id")
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    agentId: uuid("agent_id")
      .references(() => agents.id, { onDelete: "restrict" })
      .notNull(),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 24 }).default("DRAFT").notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    calculationInput: jsonb("calculation_input")
      .$type<QuotationCalculationInput>()
      .notNull(),
    agentNotes: text("agent_notes"),
    disclaimerText: text("disclaimer_text").notNull(),
    pdfUrl: text("pdf_url"),
    shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_quotations_lead").on(table.leadId)]
);

// 5. Deals & Closing Room Table
export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dealNumber: varchar("deal_number", { length: 48 }).notNull().unique(),
    leadId: uuid("lead_id")
      .references(() => leads.id, { onDelete: "restrict" })
      .notNull(),
    quotationId: uuid("quotation_id")
      .references(() => quotations.id, { onDelete: "restrict" })
      .notNull(),
    propertyId: uuid("property_id")
      .references(() => properties.id, { onDelete: "restrict" })
      .notNull(),
    closingAgentId: uuid("closing_agent_id")
      .references(() => agents.id, { onDelete: "restrict" })
      .notNull(),
    stage: dealStagePgEnum("stage").default("RESERVED").notNull(),
    financingType: financingTypePgEnum("financing_type").notNull(),
    totalContractPrice: numeric("total_contract_price", {
      precision: 15,
      scale: 2,
    }).notNull(),
    netCommissionablePrice: numeric("net_commissionable_price", {
      precision: 15,
      scale: 2,
    }).notNull(),
    totalCommissionRatePercent: numeric("total_commission_rate_percent", {
      precision: 5,
      scale: 2,
    })
      .default("5.00")
      .notNull(),
    grossCommissionTotal: numeric("gross_commission_total", {
      precision: 15,
      scale: 2,
    }).notNull(),
    reservationDate: timestamp("reservation_date", {
      withTimezone: true,
    }).notNull(),
    targetLoanTakeoutDate: timestamp("target_loan_takeout_date", {
      withTimezone: true,
    }),
    actualClosedDate: timestamp("actual_closed_date", {
      withTimezone: true,
    }),
    requirementsChecklist: jsonb("requirements_checklist")
      .$type<DealRequirementItem[]>()
      .default([])
      .notNull(),
    commissionSplits: jsonb("commission_splits")
      .$type<CommissionSplit[]>()
      .default([])
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_deals_agent_stage").on(table.closingAgentId, table.stage)]
);

// 6. Meta Messenger & Omnichannel Messages Table
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    senderType: varchar("sender_type", { length: 24 }).notNull(), // LEAD | AGENT | SYSTEM_BOT
    senderId: varchar("sender_id", { length: 128 }).notNull(),
    channel: varchar("channel", { length: 32 })
      .default("FACEBOOK_MESSENGER")
      .notNull(),
    metaMid: varchar("meta_mid", { length: 160 }).unique(),
    content: text("content").notNull(),
    attachedQuotationId: uuid("attached_quotation_id").references(
      () => quotations.id,
      { onDelete: "set null" }
    ),
    attachmentUrl: text("attachment_url"),
    deliveryStatus: varchar("delivery_status", { length: 24 })
      .default("SENT")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_messages_lead_created").on(table.leadId, table.createdAt)]
);

// Drizzle Relations
export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedAgent: one(agents, {
    fields: [leads.assignedAgentId],
    references: [agents.id],
  }),
  quotations: many(quotations),
  messages: many(messages),
  deals: many(deals),
}));

