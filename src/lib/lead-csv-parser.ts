import type { CreateLeadInput, Lead, PipelineStage, PropertyType } from "./schemas/lead";

export type CsvPresetType = "AUTO_DETECT" | "META_ADS" | "DEVELOPER_SHEET" | "PROPFLOW_TEMPLATE";

export interface ColumnMappingConfig {
  fullNameCol?: string;
  firstNameCol?: string;
  lastNameCol?: string;
  phoneCol?: string;
  emailCol?: string;
  budgetCol?: string;
  budgetMinCol?: string;
  budgetMaxCol?: string;
  locationCol?: string;
  propertyTypeCol?: string;
  financingCol?: string;
  campaignCol?: string;
  notesCol?: string;
}

export interface ImportLeadDefaults {
  defaultStage: PipelineStage;
  defaultSource: CreateLeadInput["source"];
  defaultPriority: CreateLeadInput["priority"];
  defaultPropertyType: PropertyType;
  customCampaignTag: string;
  skipDuplicates: boolean;
}

export interface ParsedLeadPreview {
  index: number;
  rawRow: Record<string, string>;
  leadInput: CreateLeadInput;
  isDuplicate: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Normalizes Philippine / international phone numbers.
 * Handles Meta Lead Ads 'p:+63...' format, spaces, hyphens, and local 09xx format.
 */
export function cleanPhoneNumber(raw: string | undefined | null): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Strip Meta prefix like "p:" or "tel:"
  cleaned = cleaned.replace(/^(p:|tel:)/i, "").trim();

  // Remove parentheses, hyphens, spaces, dots
  const digitsOnly = cleaned.replace(/[^\d+]/g, "");

  // Format Philippine mobile numbers nicely
  if (digitsOnly.startsWith("+63") && digitsOnly.length === 13) {
    const p = digitsOnly.slice(3);
    return `+63 ${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  } else if (digitsOnly.startsWith("639") && digitsOnly.length === 12) {
    const p = digitsOnly.slice(2);
    return `+63 ${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  } else if (digitsOnly.startsWith("09") && digitsOnly.length === 11) {
    const p = digitsOnly.slice(1);
    return `+63 ${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  } else if (digitsOnly.startsWith("9") && digitsOnly.length === 10) {
    return `+63 ${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }

  return cleaned || "";
}

/**
 * Splits a full name string ("Juan Dela Cruz" or "Dela Cruz, Juan") into First & Last names.
 */
export function splitFullName(fullName: string | undefined | null): { firstName: string; lastName: string } {
  if (!fullName || !fullName.trim()) {
    return { firstName: "Prospective", lastName: "Buyer" };
  }

  const trimmed = fullName.trim();

  // Check for "Lastname, Firstname" format
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        firstName: parts.slice(1).join(" ") || "Prospective",
        lastName: parts[0] || "Buyer",
      };
    }
  }

  // Check for "Firstname Lastname" or "Firstname Middle Lastname"
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return { firstName: tokens[0] || "Prospective", lastName: "Buyer" };
  }

  const lastName = tokens[tokens.length - 1] || "Buyer";
  const firstName = tokens.slice(0, tokens.length - 1).join(" ") || "Prospective";
  return { firstName, lastName };
}

/**
 * Parses currency and shorthand strings like "₱ 5.5M", "5M", "5,500,000", "8M - 12M".
 */
export function parseBudgetString(raw: string | undefined | null): { min: number; max: number } {
  if (!raw) return { min: 2000000, max: 8000000 };

  const str = raw.trim();

  // If there's a range like "5M - 8M" or "5M to 8M"
  const rangeMatch = str.match(/([0-9.,]+)\s*(?:M|m|k|K)?\s*(?:-|to|–)\s*([0-9.,]+)\s*(M|m|k|K)?/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    const parsePart = (val: string, unitHint?: string) => {
      const num = parseFloat(val.replace(/,/g, ""));
      if (isNaN(num)) return 0;
      if (unitHint && unitHint.toLowerCase() === "m") return num * 1000000;
      if (num < 1000) return num * 1000000; // shorthand e.g. 5 means 5M in PH real estate
      return num;
    };
    const min = parsePart(rangeMatch[1], rangeMatch[3]);
    const max = parsePart(rangeMatch[2], rangeMatch[3]);
    if (max > 0) {
      return { min: min > 0 ? min : 0, max: Math.max(min, max) };
    }
  }

  // Check for "M" notation like "8.5M" or "Php 8.5M"
  const millionMatch = str.match(/([0-9.,]+)\s*(?:M|million)/i);
  if (millionMatch && millionMatch[1]) {
    const num = parseFloat(millionMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) {
      const target = Math.round(num * 1000000);
      return { min: Math.max(0, target * 0.7), max: target };
    }
  }

  // General number cleanup
  const digits = str.replace(/[^0-9.]/g, "");
  const num = parseFloat(digits);
  if (!isNaN(num) && num > 0) {
    // If number is small like "5", assume millions
    const parsed = num < 500 ? num * 1000000 : num;
    return { min: Math.max(0, Math.round(parsed * 0.75)), max: Math.round(parsed) };
  }

  return { min: 2500000, max: 7500000 };
}

/**
 * Maps freeform text to standard PropertyType enum.
 */
export function mapPropertyType(val: string | undefined | null): PropertyType {
  if (!val) return "CONDOMINIUM";
  const s = val.toLowerCase();
  if (s.includes("condo") || s.includes("suite") || s.includes("unit") || s.includes("tower") || s.includes("studio") || s.includes("1br") || s.includes("2br")) {
    return "CONDOMINIUM";
  }
  if (s.includes("townhouse") || s.includes("duplex")) {
    return "TOWNHOUSE";
  }
  if (s.includes("commercial") || s.includes("office") || s.includes("retail")) {
    return "COMMERCIAL_UNIT";
  }
  if (s.includes("lot only") || s.includes("residential lot") || s.includes("land") || s.includes("vacant lot")) {
    return "RESIDENTIAL_LOT";
  }
  if (s.includes("house") || s.includes("single detached") || s.includes("villa") || s.includes("subdivision")) {
    return "HOUSE_AND_LOT";
  }
  return "CONDOMINIUM";
}

/**
 * Maps freeform text to standard financing options.
 */
export function mapFinancing(val: string | undefined | null): CreateLeadInput["financingPreference"] {
  if (!val) return "BANK";
  const s = val.toLowerCase();
  if (s.includes("pag-ibig") || s.includes("hdmf") || s.includes("pagibig")) return "PAG_IBIG";
  if (s.includes("in-house") || s.includes("developer") || s.includes("in house")) return "IN_HOUSE";
  if (s.includes("cash") || s.includes("spot")) return "SPOT_CASH";
  if (s.includes("undecided") || s.includes("flexible")) return "UNDECIDED";
  return "BANK";
}

/**
 * Detects the best column mapping config based on CSV headers and an optional preset hint.
 */
export function detectColumnMapping(headers: string[], presetHint: CsvPresetType = "AUTO_DETECT"): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {};
  const lowerHeaders = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));

  const findMatch = (regexes: RegExp[]) => {
    for (const regex of regexes) {
      const match = lowerHeaders.find((item) => regex.test(item.lower));
      if (match) return match.original;
    }
    return undefined;
  };

  // Full Name vs First/Last
  mapping.fullNameCol = findMatch([
    /^(full[_\s]?name|client[_\s]?name|buyer[_\s]?name|lead[_\s]?name|prospect[_\s]?name|inquirer)$/i,
    /(full[_\s]?name|client[_\s]?name|buyer[_\s]?name)/i,
    /^name$/i,
  ]);

  mapping.firstNameCol = findMatch([
    /^(first[_\s]?name|given[_\s]?name|fname)$/i,
    /(first[_\s]?name|given[_\s]?name)/i,
  ]);

  mapping.lastNameCol = findMatch([
    /^(last[_\s]?name|surname|family[_\s]?name|lname)$/i,
    /(last[_\s]?name|surname)/i,
  ]);

  // Phone
  mapping.phoneCol = findMatch([
    /^(phone[_\s]?number|mobile[_\s]?no|mobile[_\s]?number|contact[_\s]?no|contact[_\s]?number)$/i,
    /(phone|mobile|cell|contact[_\s]?no|contact[_\s]?num|tel)/i,
  ]);

  // Email
  mapping.emailCol = findMatch([
    /^(email|e-mail|email[_\s]?address)$/i,
    /(email|e-mail)/i,
  ]);

  // Budget
  mapping.budgetCol = findMatch([
    /(target[_\s]?budget|tcp[_\s]?budget|tcp|price[_\s]?range|budget|price|investment)/i,
  ]);
  mapping.budgetMinCol = findMatch([/(budget[_\s]?min|min[_\s]?budget|minimum[_\s]?budget)/i]);
  mapping.budgetMaxCol = findMatch([/(budget[_\s]?max|max[_\s]?budget|maximum[_\s]?budget)/i]);

  // Location / Project
  mapping.locationCol = findMatch([
    /(preferred[_\s]?location|project[_\s]?interested|project[_\s]?name|property[_\s]?interested|location|project|city|development)/i,
  ]);

  // Property Type / Unit
  mapping.propertyTypeCol = findMatch([
    /(preferred[_\s]?property[_\s]?type|unit[_\s]?type|property[_\s]?type|unit[_\s]?interest|bedrooms|model)/i,
  ]);

  // Financing
  mapping.financingCol = findMatch([
    /(financing[_\s]?preference|financing[_\s]?option|payment[_\s]?term|financing|payment[_\s]?scheme)/i,
  ]);

  // Campaign / Ad Name
  mapping.campaignCol = findMatch([
    /(campaign[_\s]?name|ad[_\s]?name|form[_\s]?name|adset[_\s]?name|source|lead[_\s]?source)/i,
  ]);

  // Notes
  mapping.notesCol = findMatch([
    /(notes|remarks|comment|inquiry[_\s]?details|message)/i,
  ]);

  return mapping;
}

/**
 * Parses raw CSV rows into validated CreateLeadInput items with duplicate detection.
 */
export function processCsvRows(
  rows: Record<string, string>[],
  mapping: ColumnMappingConfig,
  defaults: ImportLeadDefaults,
  existingLeads: Lead[]
): ParsedLeadPreview[] {
  const existingPhones = new Set(
    existingLeads.map((l) => l.phone.replace(/[^\d]/g, "")).filter((p) => p.length >= 7)
  );
  const existingEmails = new Set(
    existingLeads.map((l) => l.email?.toLowerCase().trim()).filter(Boolean) as string[]
  );

  return rows.map((row, index) => {
    const validationErrors: string[] = [];

    // Extract names
    let firstName = "";
    let lastName = "";

    if (mapping.fullNameCol && row[mapping.fullNameCol]?.trim()) {
      const split = splitFullName(row[mapping.fullNameCol]);
      firstName = split.firstName;
      lastName = split.lastName;
    } else {
      firstName = (mapping.firstNameCol && row[mapping.firstNameCol]?.trim()) || "";
      lastName = (mapping.lastNameCol && row[mapping.lastNameCol]?.trim()) || "";
    }

    if (!firstName && !lastName) {
      firstName = "Prospective";
      lastName = `Lead #${index + 1}`;
    } else if (!firstName) {
      firstName = "Prospective";
    } else if (!lastName) {
      lastName = "Buyer";
    }

    // Extract & format phone
    const rawPhone = (mapping.phoneCol && row[mapping.phoneCol]) || "";
    const phone = cleanPhoneNumber(rawPhone) || "+63 900 000 0000";

    // Extract email
    const emailRaw = (mapping.emailCol && row[mapping.emailCol]?.trim().toLowerCase()) || "";
    const email = emailRaw && emailRaw.includes("@") ? emailRaw : "";

    // Extract budget
    let budgetMin = 0;
    let budgetMax = 5000000;

    const rawMinVal = mapping.budgetMinCol ? row[mapping.budgetMinCol] : undefined;
    const rawMaxVal = mapping.budgetMaxCol ? row[mapping.budgetMaxCol] : undefined;
    const rawBudgetVal = mapping.budgetCol ? row[mapping.budgetCol] : undefined;

    if (rawMinVal) {
      budgetMin = parseFloat(rawMinVal.replace(/[^0-9.]/g, "")) || 0;
    }
    if (rawMaxVal) {
      budgetMax = parseFloat(rawMaxVal.replace(/[^0-9.]/g, "")) || 5000000;
    } else if (rawBudgetVal) {
      const parsedRange = parseBudgetString(rawBudgetVal);
      budgetMin = parsedRange.min;
      budgetMax = parsedRange.max;
    }

    if (budgetMax <= 0) budgetMax = 5000000;
    if (budgetMin > budgetMax) budgetMin = 0;

    // Extract location
    const rawLoc = (mapping.locationCol && row[mapping.locationCol]?.trim()) || "";
    const preferredLocations = rawLoc
      ? rawLoc.split(/[;,|]/).map((s) => s.trim()).filter(Boolean)
      : ["Metro Manila"];

    // Extract property type
    const rawProp = mapping.propertyTypeCol ? row[mapping.propertyTypeCol] : undefined;
    const propertyType = rawProp ? mapPropertyType(rawProp) : defaults.defaultPropertyType;

    // Extract financing
    const rawFin = mapping.financingCol ? row[mapping.financingCol] : undefined;
    const financing = rawFin ? mapFinancing(rawFin) : "BANK";

    // Extract campaign / tags
    const campaignVal = (mapping.campaignCol && row[mapping.campaignCol]?.trim()) || "";
    const tags: string[] = [];
    if (defaults.customCampaignTag.trim()) {
      tags.push(defaults.customCampaignTag.trim());
    }
    if (campaignVal) {
      tags.push(campaignVal);
    }

    // Extract notes
    const rawNotes = (mapping.notesCol && row[mapping.notesCol]?.trim()) || "";
    const notesParts = [
      rawNotes,
      campaignVal ? `Campaign Source: ${campaignVal}` : "",
      rawLoc ? `Inquired Project: ${rawLoc}` : "",
    ].filter(Boolean);
    const notes = notesParts.length ? notesParts.join(" | ") : "Bulk imported lead.";

    // Duplicate Check
    const cleanPhoneDigits = phone.replace(/[^\d]/g, "");
    let isDuplicate = false;
    let duplicateReason = "";

    if (cleanPhoneDigits.length >= 7 && existingPhones.has(cleanPhoneDigits)) {
      isDuplicate = true;
      duplicateReason = `Duplicate phone number: ${phone}`;
    } else if (email && existingEmails.has(email)) {
      isDuplicate = true;
      duplicateReason = `Duplicate email: ${email}`;
    }

    const leadInput: CreateLeadInput = {
      firstName,
      lastName,
      email,
      phone,
      stage: defaults.defaultStage,
      source: defaults.defaultSource,
      priority: defaults.defaultPriority,
      budgetMin,
      budgetMax,
      preferredLocations: preferredLocations.length ? preferredLocations : ["Metro Manila"],
      preferredPropertyTypes: [propertyType],
      financingPreference: financing,
      notes,
      tags: tags.length ? tags : undefined,
    };

    return {
      index,
      rawRow: row,
      leadInput,
      isDuplicate,
      duplicateReason,
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
}

/**
 * Sample CSV Templates generator
 */
export function getSampleCsvTemplate(preset: "META_ADS" | "DEVELOPER_SHEET" | "PROPFLOW_TEMPLATE"): { filename: string; content: string } {
  switch (preset) {
    case "META_ADS":
      return {
        filename: "facebook_lead_ads_sample.csv",
        content: `campaign_name,ad_name,full_name,phone_number,email,what_is_your_target_budget?,preferred_city
The Fort BGC Luxury Units,BGC Penthouse 2BR,Carlos Miguel Tan,p:+639178881234,carlos.tan@gmail.com,15000000 to 22000000,Taguig City - BGC
Makati Sky Suites Q4 Promo,Makati Executive 1BR,Atty. Bea Santos,p:+639185559876,bea.santos.law@gmail.com,8.5M,Makati CBD
Ortigas Central Park Pre-Selling,Studio Early Bird,Engr. Daniel Lim,p:+639209994321,engr.lim@yahoo.com,4.5M,Pasig - Ortigas Center
Cebu IT Park Residences,Investment Studio,Dr. Angela Cruz,p:+639173336543,dr.angela.cruz@med.ph,3.8M,Cebu City`,
      };

    case "DEVELOPER_SHEET":
      return {
        filename: "developer_leads_sample.csv",
        content: `Client Name,Mobile No,Email Address,Project / Property,Unit Type,TCP Budget,Financing Option,Remarks
"Zobel, Rafael",0917-888-1234,rafael.zobel@ayala.com.ph,Park Central Towers Makati,3BR Sky Villa,₱ 45,000,000,Bank Financing,VIP buyer referred by Ayala Premier
"Villanueva, Maria Elena",0918-777-6543,elena.v@globe.com.ph,Avida Towers Verge,1-Bedroom Deluxe,5.8M,Pag-IBIG,Inquired through SM Mall Roadshow booth
"Sy, Kenneth Brian",0922-333-8899,kenneth.sy@smdc.ph,Gold Residences NAIA,2BR Corner Unit,₱ 12,000,000,Spot Cash,Looking for high rental yield property near airport
"Alcantara, Patricia",0917-555-4433,patricia.a@megaworld.com.ph,Uptown Arts Residence,Studio Executive,8.2M,In-House,OFW based in Singapore returning in December`,
      };

    case "PROPFLOW_TEMPLATE":
    default:
      return {
        filename: "propflow_crm_lead_template.csv",
        content: `firstName,lastName,email,phone,stage,source,priority,budgetMin,budgetMax,preferredLocations,preferredPropertyTypes,financingPreference,notes
Rafael,Zobel,rafael.zobel@ayala.com.ph,+63 917 888 1234,NEW_LEAD,PORTAL_INQUIRY,HOT,15000000,25000000,"Bonifacio Global City; Makati CBD",CONDOMINIUM,BANK,High-floor corner 2BR/3BR with 2 parking slots.
Elena,Villanueva,elena.v@gmail.com,+63 918 777 6543,NEW_LEAD,FACEBOOK_MESSENGER,HIGH,4500000,6500000,Mandaluyong; Pasig,CONDOMINIUM,BANK,Interested in flexible down payment promo.
Kenneth,Sy,kenneth.sy@enterprise.ph,+63 922 333 8899,NEW_LEAD,WALK_IN_OPEN_HOUSE,MEDIUM,10000000,14000000,Paranaque; Pasay,CONDOMINIUM,SPOT_CASH,Airport corridor real estate investment.`,
      };
  }
}
