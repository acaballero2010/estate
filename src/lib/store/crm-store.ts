import { create } from "zustand";
import type {
  Lead,
  PipelineStage,
  Property,
  CreatePropertyInput,
  Quotation,
  Message,
  SavedReplySnippet,
  Deal,
  CreateLeadInput,
} from "@/lib/schemas";
import {
  loadOrSeedAgentFirestoreWorkspace,
  persistAgentDocument,
} from "@/lib/firebase/firestore-sync";

const AGENT_ID = "00000000-0000-4000-8000-000000000001";

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    projectName: "The Meridian Park Residences",
    developerName: "Ayala Premier Estates",
    unitCode: "Tower B - 2408 (2BR Corner)",
    propertyType: "CONDOMINIUM",
    locationCity: "Bonifacio Global City, Taguig",
    address: "34th Street cor. 9th Ave, BGC, Taguig",
    floorAreaSqm: 84.5,
    lotAreaSqm: 0,
    bedrooms: 2,
    bathrooms: 2,
    parkingSlots: 1,
    listPrice: 18500000,
    reservationFee: 100000,
    status: "AVAILABLE",
    turnoverDate: "Q4 2027 (Pre-selling)",
    description:
      "Corner 2-Bedroom residence featuring floor-to-ceiling double-glazed windows, wrap-around balcony overlooking the BGC golf course and skyline, European gourmet kitchen, and smart home automation.",
    amenities: [
      "50m Lap Pool & Sky Deck",
      "Private Residents Lounge",
      "Fitness & Wellness Studio",
      "24/7 Concierge & Security",
      "Direct High Street Park Access",
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    ],
    videoWalkthroughUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    listedByAgentId: "accredited-master-inventory",
    createdAt: new Date("2026-09-10T08:00:00Z"),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    projectName: "Solana Verde Executive Village",
    developerName: "Crestview Land Corp",
    unitCode: "Blk 14 Lot 8 (Aria Model)",
    propertyType: "HOUSE_AND_LOT",
    locationCity: "Nuvali, Santa Rosa, Laguna",
    address: "Solana Spine Road, Nuvali South",
    floorAreaSqm: 142.0,
    lotAreaSqm: 180.0,
    bedrooms: 4,
    bathrooms: 3,
    parkingSlots: 2,
    listPrice: 9450000,
    reservationFee: 50000,
    status: "AVAILABLE",
    turnoverDate: "Ready for Occupancy (RFO)",
    description:
      "Modern tropical 4-Bedroom single-detached RFO home on a prime elevated lot in Nuvali South. Features high ceilings, lanai garden patio, maid's quarters, and 2-car covered carport.",
    amenities: [
      "2-Hectare Central Clubhouse",
      "Tree-Lined Jogging Trails",
      "Basketball & Tennis Courts",
      "24/7 Roving Village Security",
      "5 Mins to Solenad & Xavier School",
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    videoWalkthroughUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    listedByAgentId: "accredited-master-inventory",
    createdAt: new Date("2026-09-15T08:00:00Z"),
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    projectName: "Astra Horizon Towers",
    developerName: "MetroCore Developments",
    unitCode: "North Wing - 1105 (1BR Balcony)",
    propertyType: "CONDOMINIUM",
    locationCity: "IT Park, Cebu City",
    address: "Salinas Drive, Lahug, Cebu City",
    floorAreaSqm: 38.0,
    lotAreaSqm: 0,
    bedrooms: 1,
    bathrooms: 1,
    parkingSlots: 0,
    listPrice: 4850000,
    reservationFee: 25000,
    status: "AVAILABLE",
    turnoverDate: "Q2 2028 (Pre-selling)",
    description:
      "High-yield investment 1-Bedroom condo unit right inside Cebu IT Park. Designed for short-term Airbnb and executive leasing with fiber-ready workspaces and resort-inspired podium amenities.",
    amenities: [
      "Co-Working Sky Lounge",
      "Infinity Edge Pool",
      "Airbnb Property Management Desk",
      "Ground Floor Retail Arcade",
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    ],
    videoWalkthroughUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4",
    listedByAgentId: "accredited-master-inventory",
    createdAt: new Date("2026-10-01T08:00:00Z"),
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    projectName: "Kensington Courtyard Townhomes",
    developerName: "Vanguard Urban Living",
    unitCode: "Unit C-09 (3BR End Unit)",
    propertyType: "TOWNHOUSE",
    locationCity: "New Manila, Quezon City",
    address: "Hemady St., New Manila, QC",
    floorAreaSqm: 165.0,
    lotAreaSqm: 92.0,
    bedrooms: 3,
    bathrooms: 3,
    parkingSlots: 2,
    listPrice: 14200000,
    reservationFee: 50000,
    status: "RESERVED",
    turnoverDate: "Ready for Occupancy (RFO)",
    description:
      "Exclusive low-density gated compound of 3-storey luxury townhomes in New Manila. Features solid narra hardwood floors, private roof deck terrace, and flood-free prime location.",
    amenities: [
      "Gated Compound w/ CCTV",
      "Private Roof Deck",
      "Solar-Ready Roofing",
      "2-Car Covered Garage",
    ],
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    ],
    videoWalkthroughUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    listedByAgentId: "accredited-master-inventory",
    createdAt: new Date("2026-10-12T08:00:00Z"),
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    assignedAgentId: AGENT_ID,
    firstName: "Camille",
    lastName: "Soriano",
    email: "camille.soriano@gmail.com",
    phone: "+63 917 842 1190",
    messengerPsid: "psid_meta_99281721",
    stage: "NEW_LEAD",
    source: "FACEBOOK_MESSENGER",
    priority: "HOT",
    budgetMin: 8000000,
    budgetMax: 11000000,
    preferredLocations: ["Nuvali, Santa Rosa", "Alabang"],
    preferredPropertyTypes: ["HOUSE_AND_LOT"],
    financingPreference: "BANK",
    notes:
      "Inquired via Facebook Ad campaign for Solana Verde RFO units. Looking to move in within 6 months with family.",
    tags: ["OFW Buyer", "RFO Priority", "Bank Pre-Approved"],
    documents: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        name: "Passport_DataPage_Soriano.pdf",
        type: "GOVERNMENT_ID",
        fileUrl: "https://example.com/docs/passport-soriano.pdf",
        verified: true,
        uploadedAt: new Date("2026-11-05T10:15:00Z"),
      },
    ],
    lastContactedAt: new Date("2026-11-08T06:50:00Z"),
    nextFollowUpAt: new Date("2026-11-09T10:00:00Z"),
    createdAt: new Date("2026-11-06T09:30:00Z"),
    updatedAt: new Date("2026-11-08T06:50:00Z"),
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    assignedAgentId: AGENT_ID,
    firstName: "Rafael",
    lastName: "Villanueva",
    email: "r.villanueva@techcorp.ph",
    phone: "+63 918 330 4921",
    messengerPsid: "psid_meta_77412980",
    stage: "SITE_TRIPPING",
    source: "WEB_CAPTURE_FORM",
    priority: "HIGH",
    budgetMin: 15000000,
    budgetMax: 20000000,
    preferredLocations: ["Bonifacio Global City, Taguig", "Makati CBD"],
    preferredPropertyTypes: ["CONDOMINIUM"],
    financingPreference: "BANK",
    notes:
      "Confirmed showroom viewing this Saturday at 2:00 PM for The Meridian Park 2BR corner unit.",
    tags: ["C-Level Exec", "Weekend Tripping"],
    documents: [],
    lastContactedAt: new Date("2026-11-07T16:20:00Z"),
    nextFollowUpAt: new Date("2026-11-08T14:00:00Z"),
    createdAt: new Date("2026-11-02T11:00:00Z"),
    updatedAt: new Date("2026-11-07T16:20:00Z"),
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    assignedAgentId: AGENT_ID,
    firstName: "Patricia",
    lastName: "Lim-Chua",
    email: "patricia.chua@yahoo.com",
    phone: "+63 920 911 7742",
    messengerPsid: "psid_meta_66102934",
    stage: "PROPOSAL_SENT",
    source: "REFERRAL",
    priority: "HOT",
    budgetMin: 12000000,
    budgetMax: 15500000,
    preferredLocations: ["New Manila, Quezon City", "San Juan"],
    preferredPropertyTypes: ["TOWNHOUSE"],
    financingPreference: "BANK",
    notes:
      "Sent sample computation for Kensington Courtyard Unit C-09 with 20% DP over 24 months. Reviewing with spouse.",
    tags: ["Referral", "24m Equity"],
    documents: [
      {
        id: "30000000-0000-4000-8000-000000000002",
        name: "Drivers_License_Chua.pdf",
        type: "GOVERNMENT_ID",
        fileUrl: "https://example.com/docs/dl-chua.pdf",
        verified: true,
        uploadedAt: new Date("2026-11-04T09:00:00Z"),
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        name: "ITR_2316_2025_Chua.pdf",
        type: "PROOF_OF_INCOME",
        fileUrl: "https://example.com/docs/itr-chua.pdf",
        verified: true,
        uploadedAt: new Date("2026-11-05T14:30:00Z"),
      },
    ],
    lastContactedAt: new Date("2026-11-07T19:45:00Z"),
    nextFollowUpAt: new Date("2026-11-09T15:00:00Z"),
    createdAt: new Date("2026-10-28T08:00:00Z"),
    updatedAt: new Date("2026-11-07T19:45:00Z"),
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    assignedAgentId: AGENT_ID,
    firstName: "Jerome",
    lastName: "Mendoza",
    email: "jmendoza.cebu@gmail.com",
    phone: "+63 998 552 3019",
    messengerPsid: "psid_meta_44918231",
    stage: "CONTACTED",
    source: "FACEBOOK_MESSENGER",
    priority: "MEDIUM",
    budgetMin: 4000000,
    budgetMax: 5500000,
    preferredLocations: ["IT Park, Cebu City", "Mandaue"],
    preferredPropertyTypes: ["CONDOMINIUM"],
    financingPreference: "PAG_IBIG",
    notes:
      "Interested in Astra Horizon 1BR for Airbnb rental investment. Requested Pag-IBIG 30-year computation.",
    tags: ["Airbnb Investor", "Pag-IBIG HDMF"],
    documents: [],
    lastContactedAt: new Date("2026-11-07T11:15:00Z"),
    nextFollowUpAt: new Date("2026-11-10T09:00:00Z"),
    createdAt: new Date("2026-11-04T15:20:00Z"),
    updatedAt: new Date("2026-11-07T11:15:00Z"),
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    assignedAgentId: AGENT_ID,
    firstName: "Dr. Elena",
    lastName: "Gomez-Tan",
    email: "dr.elenatan@stlukes.com.ph",
    phone: "+63 917 501 8899",
    stage: "RESERVATION",
    source: "WALK_IN_OPEN_HOUSE",
    priority: "HOT",
    budgetMin: 16000000,
    budgetMax: 22000000,
    preferredLocations: ["Bonifacio Global City, Taguig"],
    preferredPropertyTypes: ["CONDOMINIUM"],
    financingPreference: "BANK",
    notes:
      "Paid ₱100,000 Reservation Fee for Meridian Park 2BR. Completing post-dated checks and signed Buyer Info Sheet.",
    tags: ["Medical Professional", "Reserved Unit"],
    documents: [
      {
        id: "30000000-0000-4000-8000-000000000004",
        name: "Signed_Reservation_Agreement_Tan.pdf",
        type: "RESERVATION_FORM",
        fileUrl: "https://example.com/docs/ra-tan.pdf",
        verified: true,
        uploadedAt: new Date("2026-11-06T17:00:00Z"),
      },
    ],
    lastContactedAt: new Date("2026-11-07T18:00:00Z"),
    nextFollowUpAt: new Date("2026-11-09T11:00:00Z"),
    createdAt: new Date("2026-10-20T10:00:00Z"),
    updatedAt: new Date("2026-11-07T18:00:00Z"),
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    assignedAgentId: AGENT_ID,
    firstName: "Kenneth",
    lastName: "Bautista",
    email: "kbautista@globalfreight.com",
    phone: "+63 917 779 2010",
    stage: "CLOSED_WON",
    source: "REFERRAL",
    priority: "HIGH",
    budgetMin: 9000000,
    budgetMax: 10500000,
    preferredLocations: ["Nuvali, Santa Rosa"],
    preferredPropertyTypes: ["HOUSE_AND_LOT"],
    financingPreference: "BANK",
    notes:
      "Bank loan Letter of Guarantee (LOG) released by BPI. Unit turned over.",
    tags: ["Closed Won", "BPI Housing Loan"],
    documents: [],
    lastContactedAt: new Date("2026-11-01T12:00:00Z"),
    nextFollowUpAt: null,
    createdAt: new Date("2026-09-12T08:00:00Z"),
    updatedAt: new Date("2026-11-01T12:00:00Z"),
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    leadId: "20000000-0000-4000-8000-000000000001",
    senderType: "LEAD",
    senderId: "psid_meta_99281721",
    channel: "FACEBOOK_MESSENGER",
    metaMid: "m_meta_001",
    content:
      "Hi Marco! Saw your Facebook post on Solana Verde Nuvali RFO 4BR house and lot. Is Block 14 Lot 8 still available?",
    deliveryStatus: "READ",
    createdAt: new Date("2026-11-08T06:40:00Z"),
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    leadId: "20000000-0000-4000-8000-000000000001",
    senderType: "AGENT",
    senderId: AGENT_ID,
    channel: "FACEBOOK_MESSENGER",
    metaMid: "m_meta_002",
    content:
      "Good morning Camille! Yes, Block 14 Lot 8 (Aria Model - 142 sqm floor area, 180 sqm lot) is currently available and Ready for Occupancy. Would you like me to send over the sample bank computation with 20% stretched down payment?",
    deliveryStatus: "READ",
    createdAt: new Date("2026-11-08T06:44:00Z"),
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    leadId: "20000000-0000-4000-8000-000000000001",
    senderType: "LEAD",
    senderId: "psid_meta_99281721",
    channel: "FACEBOOK_MESSENGER",
    metaMid: "m_meta_003",
    content:
      "Yes please! Kindly include a 15-year bank financing option and let me know the reservation requirements.",
    deliveryStatus: "READ",
    createdAt: new Date("2026-11-08T06:50:00Z"),
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    leadId: "20000000-0000-4000-8000-000000000002",
    senderType: "LEAD",
    senderId: "psid_meta_77412980",
    channel: "FACEBOOK_MESSENGER",
    metaMid: "m_meta_004",
    content:
      "Hi Marco, confirming our BGC showroom viewing this Saturday at 2 PM. Where is the parking entrance for guests?",
    deliveryStatus: "READ",
    createdAt: new Date("2026-11-07T16:20:00Z"),
  },
  {
    id: "40000000-0000-4000-8000-000000000005",
    leadId: "20000000-0000-4000-8000-000000000004",
    senderType: "LEAD",
    senderId: "psid_meta_44918231",
    channel: "FACEBOOK_MESSENGER",
    metaMid: "m_meta_005",
    content:
      "Hello sir, how much is the monthly equity for Astra Horizon 1BR in Cebu IT Park if 36 months DP?",
    deliveryStatus: "DELIVERED",
    createdAt: new Date("2026-11-07T11:15:00Z"),
  },
];

export const SAVED_REPLY_SNIPPETS: SavedReplySnippet[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    shortcut: "/tripping",
    title: "Site Tripping & Showroom Schedule",
    category: "TRIPPING",
    bodyTemplate:
      "We conduct daily guided showroom & site viewings between 9:00 AM and 5:00 PM. May I know your preferred date and time so I can reserve a visitor pass and dedicated parking slot for you?",
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    shortcut: "/reservation",
    title: "Standard Unit Reservation Steps",
    category: "REQUIREMENTS",
    bodyTemplate:
      "To officially hold and block the unit under your name, we only need: (1) 2 Valid Government IDs, (2) Signed Buyer Information Sheet, and (3) Reservation Fee via Bank Transfer/Check. The reservation fee is 100% deductible from your Down Payment.",
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    shortcut: "/bankreq",
    title: "Bank Financing Pre-Approval Checklist",
    category: "REQUIREMENTS",
    bodyTemplate:
      "For smooth Bank Home Loan accreditation, kindly prepare: Latest 3 months Payslips or COE with Compensation, Latest ITR Form 2316, and 6 months Bank Statements. For OFWs: Active Job Contract + Proof of Remittance.",
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    shortcut: "/promodp",
    title: "Early Move-In / Stretched DP Promo",
    category: "PAYMENT_TERMS",
    bodyTemplate:
      "Good news! This month we have an exclusive promo offering a 3% Early Booking Discount and 0% interest stretched Down Payment up to 24–36 months.",
  },
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    dealNumber: "DL-2026-0104",
    leadId: "20000000-0000-4000-8000-000000000005",
    quotationId: "70000000-0000-4000-8000-000000000001",
    propertyId: "10000000-0000-4000-8000-000000000001",
    closingAgentId: AGENT_ID,
    stage: "EQUITY_PAYING",
    financingType: "BANK_FINANCING",
    totalContractPrice: 19313075,
    netCommissionablePrice: 17945000,
    totalCommissionRatePercent: 5.0,
    grossCommissionTotal: 897250,
    reservationDate: new Date("2026-11-06T15:00:00Z"),
    targetLoanTakeoutDate: new Date("2027-10-30T00:00:00Z"),
    actualClosedDate: null,
    requirementsChecklist: [
      {
        id: "80000000-0000-4000-8000-000000000001",
        code: "RA_SIGNED",
        label: "Signed Reservation Agreement & Buyer Info Sheet",
        requiredForFinancing: ["BANK_FINANCING", "PAG_IBIG_HDMF", "IN_HOUSE_FINANCING"],
        status: "VERIFIED",
        verifiedAt: new Date("2026-11-06T17:00:00Z"),
      },
      {
        id: "80000000-0000-4000-8000-000000000002",
        code: "GOV_ID_2X",
        label: "2 Valid Government IDs (Spouses w/ 3 Specimen Signatures)",
        requiredForFinancing: ["BANK_FINANCING", "PAG_IBIG_HDMF"],
        status: "VERIFIED",
        verifiedAt: new Date("2026-11-06T17:05:00Z"),
      },
      {
        id: "80000000-0000-4000-8000-000000000003",
        code: "PROOF_OF_INCOME",
        label: "ITR Form 2316 / Hospital Practice Audited Financial Statement",
        requiredForFinancing: ["BANK_FINANCING"],
        status: "SUBMITTED",
      },
      {
        id: "80000000-0000-4000-8000-000000000004",
        code: "PDC_ISSUED",
        label: "24 Post-Dated Checks (PDCs) or Auto-Debit Arrangement Form",
        requiredForFinancing: ["BANK_FINANCING", "IN_HOUSE_FINANCING"],
        status: "PENDING",
      },
    ],
    paymentProofs: [
      {
        id: "90000000-0000-4000-8000-000000000001",
        dealId: "60000000-0000-4000-8000-000000000001",
        paymentType: "RESERVATION_FEE",
        amountPaid: 100000,
        paymentMethod: "BANK_TRANSFER",
        referenceNo: "BPI-INST-99482716",
        receiptImageUrl: "https://example.com/receipts/bpi-99482716.jpg",
        paidAt: new Date("2026-11-06T14:52:00Z"),
        verified: true,
      },
    ],
    commissionSplits: [
      {
        id: "95000000-0000-4000-8000-000000000001",
        recipientId: AGENT_ID,
        recipientName: "Marco Reyes, REB (Selling Agent)",
        role: "SELLING_AGENT",
        splitPercentage: 65,
        grossAmount: 583212.5,
        withholdingTaxRate: 10,
        netCommissionAmount: 524891.25,
        releaseStatus: "PARTIALLY_RELEASED",
        releasedAmount: 150000,
      },
      {
        id: "95000000-0000-4000-8000-000000000002",
        recipientId: "00000000-0000-4000-8000-000000000002",
        recipientName: "Victorino Santos (Sales Director)",
        role: "SALES_DIRECTOR",
        splitPercentage: 20,
        grossAmount: 179450,
        withholdingTaxRate: 10,
        netCommissionAmount: 161505,
        releaseStatus: "PROJECTED",
        releasedAmount: 0,
      },
      {
        id: "95000000-0000-4000-8000-000000000003",
        recipientId: "00000000-0000-4000-8000-000000000003",
        recipientName: "PropFlow Realty Brokerage",
        role: "LICENSED_BROKER",
        splitPercentage: 15,
        grossAmount: 134587.5,
        withholdingTaxRate: 10,
        netCommissionAmount: 121128.75,
        releaseStatus: "PROJECTED",
        releasedAmount: 0,
      },
    ],
    notes: "Client prefers BPI or Metrobank Private Wealth for housing loan takeout.",
    createdAt: new Date("2026-11-06T15:00:00Z"),
    updatedAt: new Date("2026-11-07T18:00:00Z"),
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    dealNumber: "DL-2026-0088",
    leadId: "20000000-0000-4000-8000-000000000006",
    quotationId: "70000000-0000-4000-8000-000000000002",
    propertyId: "10000000-0000-4000-8000-000000000002",
    closingAgentId: AGENT_ID,
    stage: "CLOSED_RELEASED",
    financingType: "BANK_FINANCING",
    totalContractPrice: 10064250,
    netCommissionablePrice: 9450000,
    totalCommissionRatePercent: 5.0,
    grossCommissionTotal: 472500,
    reservationDate: new Date("2026-09-18T10:00:00Z"),
    targetLoanTakeoutDate: new Date("2026-10-28T00:00:00Z"),
    actualClosedDate: new Date("2026-11-01T12:00:00Z"),
    requirementsChecklist: [
      {
        id: "80000000-0000-4000-8000-000000000005",
        code: "RA_SIGNED",
        label: "Signed Reservation Agreement & Contract to Sell (CTS)",
        requiredForFinancing: ["BANK_FINANCING"],
        status: "VERIFIED",
      },
      {
        id: "80000000-0000-4000-8000-000000000006",
        code: "BANK_LOG",
        label: "Bank Letter of Guarantee (LOG) & Loan Signing",
        requiredForFinancing: ["BANK_FINANCING"],
        status: "VERIFIED",
      },
    ],
    paymentProofs: [
      {
        id: "90000000-0000-4000-8000-000000000002",
        dealId: "60000000-0000-4000-8000-000000000002",
        paymentType: "RESERVATION_FEE",
        amountPaid: 50000,
        paymentMethod: "BANK_TRANSFER",
        referenceNo: "MBTC-77120934",
        receiptImageUrl: "https://example.com/receipts/mbtc-77120934.jpg",
        paidAt: new Date("2026-09-18T09:40:00Z"),
        verified: true,
      },
    ],
    commissionSplits: [
      {
        id: "95000000-0000-4000-8000-000000000004",
        recipientId: AGENT_ID,
        recipientName: "Marco Reyes, REB (Selling Agent)",
        role: "SELLING_AGENT",
        splitPercentage: 70,
        grossAmount: 330750,
        withholdingTaxRate: 10,
        netCommissionAmount: 297675,
        releaseStatus: "FULLY_RELEASED",
        releasedAmount: 297675,
        releasedAt: new Date("2026-11-04T15:00:00Z"),
      },
      {
        id: "95000000-0000-4000-8000-000000000005",
        recipientId: "00000000-0000-4000-8000-000000000003",
        recipientName: "PropFlow Realty Brokerage",
        role: "LICENSED_BROKER",
        splitPercentage: 30,
        grossAmount: 141750,
        withholdingTaxRate: 10,
        netCommissionAmount: 127575,
        releaseStatus: "FULLY_RELEASED",
        releasedAmount: 127575,
        releasedAt: new Date("2026-11-04T15:00:00Z"),
      },
    ],
    notes: "Full 100% commission released upon BPI LOG takeout.",
    createdAt: new Date("2026-09-18T10:00:00Z"),
    updatedAt: new Date("2026-11-04T15:00:00Z"),
  },
];

interface CrmState {
  activeAgentUid: string | null;
  isSyncingFirestore: boolean;
  leads: Lead[];
  properties: Property[];
  messages: Message[];
  deals: Deal[];
  quotations: Quotation[];
  selectedLeadId: string | null;

  // Actions
  syncWithAgentAccount: (agentUid: string | null) => Promise<void>;
  setSelectedLeadId: (id: string | null) => void;
  moveLeadStage: (leadId: string, targetStage: PipelineStage) => void;
  addLead: (input: CreateLeadInput) => Lead;
  bulkAddLeads: (inputs: CreateLeadInput[]) => Lead[];
  addProperty: (input: CreatePropertyInput) => Property;
  bulkAddProperties: (inputs: CreatePropertyInput[]) => Property[];
  updatePropertyStatus: (propertyId: string, status: Property["status"]) => void;
  addLeadNote: (leadId: string, noteText: string) => void;
  sendMessage: (
    leadId: string,
    content: string,
    attachedQuotationId?: string
  ) => Message;
  receiveWebhookMessage: (
    psid: string,
    senderName: string,
    content: string,
    metaMid?: string
  ) => void;
  saveQuotation: (quotation: Quotation) => void;
  toggleDealRequirementStatus: (dealId: string, requirementId: string) => void;
  createDealFromReservation: (params: {
    leadId: string;
    propertyId: string;
    quotationId?: string;
    totalContractPrice: number;
    netCommissionablePrice: number;
    financingType: Deal["financingType"];
    reservationFee: number;
    paymentMethod: "BANK_TRANSFER" | "GCASH_MAYA" | "CHECK_PDC" | "CREDIT_CARD";
    referenceNo: string;
    receiptImageUrl: string;
    signatureDataUrl?: string;
  }) => Deal;
}

function getLocalCustomProperties(agentUid?: string | null): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `propflow_properties_${agentUid || "default"}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: Record<string, unknown>) => ({
      ...(p as unknown as Property),
      createdAt: new Date((p.createdAt as string) || Date.now()),
    }));
  } catch {
    return [];
  }
}

function saveLocalCustomProperty(property: Property, agentUid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = `propflow_properties_${agentUid || "default"}`;
    const existing = getLocalCustomProperties(agentUid);
    const updated = [property, ...existing.filter((p) => p.id !== property.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn("localStorage property save failed:", e);
  }
}

export const useCrmStore = create<CrmState>((set, get) => ({
  activeAgentUid: null,
  isSyncingFirestore: false,
  leads: INITIAL_LEADS,
  properties: INITIAL_PROPERTIES,
  messages: INITIAL_MESSAGES,
  deals: INITIAL_DEALS,
  quotations: [],
  selectedLeadId: INITIAL_LEADS[0]?.id ?? null,

  syncWithAgentAccount: async (agentUid) => {
    if (!agentUid) {
      const localProps = getLocalCustomProperties("default");
      const propMap = new Map<string, Property>();
      INITIAL_PROPERTIES.forEach((p) => propMap.set(p.id, p));
      localProps.forEach((p) => propMap.set(p.id, p));

      set({
        activeAgentUid: null,
        leads: INITIAL_LEADS,
        properties: Array.from(propMap.values()),
        messages: INITIAL_MESSAGES,
        deals: INITIAL_DEALS,
        quotations: [],
        selectedLeadId: INITIAL_LEADS[0]?.id ?? null,
        isSyncingFirestore: false,
      });
      return;
    }
    set({ activeAgentUid: agentUid, isSyncingFirestore: true });
    try {
      const workspace = await loadOrSeedAgentFirestoreWorkspace(agentUid, {
        leads: INITIAL_LEADS,
        properties: INITIAL_PROPERTIES,
        messages: INITIAL_MESSAGES,
        deals: INITIAL_DEALS,
        quotations: [],
      });

      // Merge: Master developer catalog + local custom properties + Firestore properties + in-memory store properties
      const localProps = [
        ...getLocalCustomProperties(agentUid),
        ...getLocalCustomProperties("default"),
      ];
      const propMap = new Map<string, Property>();
      INITIAL_PROPERTIES.forEach((p) => propMap.set(p.id, p));
      get().properties.forEach((p) => propMap.set(p.id, p));
      localProps.forEach((p) => propMap.set(p.id, p));
      workspace.properties.forEach((p) => propMap.set(p.id, p));

      set({
        leads: workspace.leads.length > 0 ? workspace.leads : get().leads,
        properties: Array.from(propMap.values()),
        messages: workspace.messages.length > 0 ? workspace.messages : get().messages,
        deals: workspace.deals.length > 0 ? workspace.deals : get().deals,
        quotations: workspace.quotations.length > 0 ? workspace.quotations : get().quotations,
        selectedLeadId: workspace.leads[0]?.id ?? get().selectedLeadId,
        isSyncingFirestore: false,
      });
    } catch {
      set({ isSyncingFirestore: false });
    }
  },

  setSelectedLeadId: (id) => set({ selectedLeadId: id }),

  moveLeadStage: (leadId, targetStage) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? { ...lead, stage: targetStage, updatedAt: new Date() }
          : lead
      ),
    }));
    const updated = get().leads.find((l) => l.id === leadId);
    if (updated) {
      void persistAgentDocument(get().activeAgentUid, "leads", updated);
    }
  },

  addLead: (input) => {
    const newLead: Lead = {
      ...input,
      id: crypto.randomUUID(),
      assignedAgentId: get().activeAgentUid || AGENT_ID,
      tags: ["New Capture"],
      documents: [],
      lastContactedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      leads: [newLead, ...state.leads],
      selectedLeadId: newLead.id,
    }));
    void persistAgentDocument(get().activeAgentUid, "leads", newLead);
    return newLead;
  },

  bulkAddLeads: (inputs) => {
    const agentUid = get().activeAgentUid || AGENT_ID;
    const createdList: Lead[] = inputs.map((input) => ({
      ...input,
      id: crypto.randomUUID(),
      assignedAgentId: agentUid,
      tags: ["CSV Import"],
      documents: [],
      lastContactedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    set((state) => ({
      leads: [...createdList, ...state.leads],
    }));
    createdList.forEach((lead) => {
      void persistAgentDocument(get().activeAgentUid, "leads", lead);
    });
    return createdList;
  },

  addProperty: (input) => {
    const activeUid = get().activeAgentUid;
    const resolvedAgentId = input.listedByAgentId || activeUid || "agent-direct-listing";
    const newProperty: Property = {
      ...input,
      id: crypto.randomUUID(),
      listedByAgentId: resolvedAgentId,
      createdAt: new Date(),
    };
    set((state) => ({
      properties: [newProperty, ...state.properties.filter((p) => p.id !== newProperty.id)],
    }));
    const targetUid = activeUid || (resolvedAgentId !== "agent-direct-listing" ? resolvedAgentId : null);
    saveLocalCustomProperty(newProperty, targetUid);
    saveLocalCustomProperty(newProperty, "default");
    if (targetUid) {
      void persistAgentDocument(targetUid, "properties", newProperty);
    }
    return newProperty;
  },

  bulkAddProperties: (inputs) => {
    const activeUid = get().activeAgentUid;
    const createdList: Property[] = inputs.map((input) => {
      const resolvedAgentId = input.listedByAgentId || activeUid || "agent-direct-listing";
      return {
        ...input,
        id: crypto.randomUUID(),
        listedByAgentId: resolvedAgentId,
        createdAt: new Date(),
      };
    });
    set((state) => ({
      properties: [...createdList, ...state.properties],
    }));
    createdList.forEach((prop) => {
      const targetUid = activeUid || (prop.listedByAgentId !== "agent-direct-listing" ? prop.listedByAgentId : null);
      saveLocalCustomProperty(prop, targetUid);
      saveLocalCustomProperty(prop, "default");
      if (targetUid) {
        void persistAgentDocument(targetUid, "properties", prop);
      }
    });
    return createdList;
  },

  updatePropertyStatus: (propertyId, status) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, status } : p
      ),
    }));
    const updatedProp = get().properties.find((p) => p.id === propertyId);
    if (updatedProp) {
      void persistAgentDocument(get().activeAgentUid, "properties", updatedProp);
    }
  },

  addLeadNote: (leadId, noteText) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              notes: lead.notes
                ? `${lead.notes}\n\n[${new Date().toLocaleDateString()}]: ${noteText}`
                : noteText,
              updatedAt: new Date(),
            }
          : lead
      ),
    }));
    const updated = get().leads.find((l) => l.id === leadId);
    if (updated) {
      void persistAgentDocument(get().activeAgentUid, "leads", updated);
    }
  },

  sendMessage: (leadId, content, attachedQuotationId) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      leadId,
      senderType: "AGENT",
      senderId: get().activeAgentUid || AGENT_ID,
      channel: "FACEBOOK_MESSENGER",
      content,
      attachedQuotationId: attachedQuotationId ?? null,
      deliveryStatus: "SENT",
      createdAt: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              lastContactedAt: new Date(),
              stage: l.stage === "NEW_LEAD" ? "CONTACTED" : l.stage,
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    void persistAgentDocument(get().activeAgentUid, "messages", newMsg);
    const updatedLead = get().leads.find((l) => l.id === leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
    return newMsg;
  },

  receiveWebhookMessage: (psid, senderName, content, metaMid) => {
    const existingLead = get().leads.find((l) => l.messengerPsid === psid);
    let targetLeadId = existingLead?.id;

    if (!existingLead) {
      const nameParts = senderName.trim().split(" ");
      const firstName = nameParts[0] || "Messenger";
      const lastName = nameParts.slice(1).join(" ") || "Lead";
      const createdLead: Lead = {
        id: crypto.randomUUID(),
        assignedAgentId: AGENT_ID,
        firstName,
        lastName,
        email: "",
        phone: "Pending via Messenger",
        messengerPsid: psid,
        stage: "NEW_LEAD",
        source: "FACEBOOK_MESSENGER",
        priority: "HIGH",
        budgetMin: 5000000,
        budgetMax: 10000000,
        preferredLocations: ["Metro Manila"],
        preferredPropertyTypes: ["CONDOMINIUM"],
        financingPreference: "BANK",
        notes: "Auto-captured via Facebook Messenger Webhook.",
        tags: ["Messenger Webhook"],
        documents: [],
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      targetLeadId = createdLead.id;
      set((state) => ({ leads: [createdLead, ...state.leads] }));
    }

    if (targetLeadId) {
      const incomingMsg: Message = {
        id: crypto.randomUUID(),
        leadId: targetLeadId,
        senderType: "LEAD",
        senderId: psid,
        channel: "FACEBOOK_MESSENGER",
        metaMid: metaMid ?? `m_${Date.now()}`,
        content,
        deliveryStatus: "DELIVERED",
        createdAt: new Date(),
      };
      set((state) => ({
        messages: [...state.messages, incomingMsg],
      }));
    }
  },

  saveQuotation: (quotation) => {
    set((state) => ({
      quotations: [quotation, ...state.quotations],
      leads: state.leads.map((l) =>
        l.id === quotation.leadId
          ? {
              ...l,
              stage:
                l.stage === "NEW_LEAD" ||
                l.stage === "CONTACTED" ||
                l.stage === "SITE_TRIPPING"
                  ? "PROPOSAL_SENT"
                  : l.stage,
              updatedAt: new Date(),
            }
          : l
      ),
    }));
    void persistAgentDocument(get().activeAgentUid, "quotations", quotation);
    const updatedLead = get().leads.find((l) => l.id === quotation.leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
  },

  toggleDealRequirementStatus: (dealId, requirementId) => {
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const nextChecklist = deal.requirementsChecklist.map((req) => {
          if (req.id !== requirementId) return req;
          const nextStatus =
            req.status === "PENDING"
              ? "SUBMITTED"
              : req.status === "SUBMITTED"
              ? "VERIFIED"
              : "PENDING";
          return {
            ...req,
            status: nextStatus as "PENDING" | "SUBMITTED" | "VERIFIED",
            verifiedAt: nextStatus === "VERIFIED" ? new Date() : null,
          };
        });
        return { ...deal, requirementsChecklist: nextChecklist };
      }),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  createDealFromReservation: (params) => {
    const dealId = crypto.randomUUID();
    const dealNumber = `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const grossCommissionTotal = params.netCommissionablePrice * 0.05;
    const agentUid = get().activeAgentUid || AGENT_ID;

    const newDeal: Deal = {
      id: dealId,
      dealNumber,
      leadId: params.leadId,
      quotationId: params.quotationId ?? crypto.randomUUID(),
      propertyId: params.propertyId,
      closingAgentId: agentUid,
      stage: "RESERVED",
      financingType: params.financingType,
      totalContractPrice: params.totalContractPrice,
      netCommissionablePrice: params.netCommissionablePrice,
      totalCommissionRatePercent: 5.0,
      grossCommissionTotal,
      reservationDate: new Date(),
      targetLoanTakeoutDate: new Date(Date.now() + 365 * 86400000),
      actualClosedDate: null,
      requirementsChecklist: [
        {
          id: crypto.randomUUID(),
          code: "RA_SIGNED",
          label: "Digital E-Signed Reservation Agreement & Buyer Info Sheet",
          requiredForFinancing: [
            "BANK_FINANCING",
            "PAG_IBIG_HDMF",
            "IN_HOUSE_FINANCING",
            "SPOT_DEFERRED_CASH",
          ],
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          code: "GOV_ID_2X",
          label: "2 Valid Government IDs with 3 Specimen Signatures",
          requiredForFinancing: ["BANK_FINANCING", "PAG_IBIG_HDMF"],
          status: "SUBMITTED",
        },
        {
          id: crypto.randomUUID(),
          code: "PROOF_OF_INCOME",
          label: "Latest ITR Form 2316 / COE with Compensation / Payslips",
          requiredForFinancing: ["BANK_FINANCING", "PAG_IBIG_HDMF"],
          status: "PENDING",
        },
        {
          id: crypto.randomUUID(),
          code: "PDC_ISSUED",
          label: "Post-Dated Checks (PDCs) or Auto-Debit Arrangement Form",
          requiredForFinancing: ["BANK_FINANCING", "IN_HOUSE_FINANCING"],
          status: "PENDING",
        },
      ],
      paymentProofs: [
        {
          id: crypto.randomUUID(),
          dealId,
          paymentType: "RESERVATION_FEE",
          amountPaid: params.reservationFee,
          paymentMethod: params.paymentMethod,
          referenceNo: params.referenceNo,
          receiptImageUrl: params.receiptImageUrl,
          paidAt: new Date(),
          verified: true,
        },
      ],
      commissionSplits: [
        {
          id: crypto.randomUUID(),
          recipientId: agentUid,
          recipientName: "Marco Reyes, REB (Selling Agent)",
          role: "SELLING_AGENT",
          splitPercentage: 65,
          grossAmount: grossCommissionTotal * 0.65,
          withholdingTaxRate: 10,
          netCommissionAmount: grossCommissionTotal * 0.65 * 0.9,
          releaseStatus: "PROJECTED",
          releasedAmount: 0,
        },
        {
          id: crypto.randomUUID(),
          recipientId: "00000000-0000-4000-8000-000000000002",
          recipientName: "Victorino Santos (Sales Director)",
          role: "SALES_DIRECTOR",
          splitPercentage: 20,
          grossAmount: grossCommissionTotal * 0.2,
          withholdingTaxRate: 10,
          netCommissionAmount: grossCommissionTotal * 0.2 * 0.9,
          releaseStatus: "PROJECTED",
          releasedAmount: 0,
        },
        {
          id: crypto.randomUUID(),
          recipientId: "00000000-0000-4000-8000-000000000003",
          recipientName: "PropFlow Realty Brokerage",
          role: "LICENSED_BROKER",
          splitPercentage: 15,
          grossAmount: grossCommissionTotal * 0.15,
          withholdingTaxRate: 10,
          netCommissionAmount: grossCommissionTotal * 0.15 * 0.9,
          releaseStatus: "PROJECTED",
          releasedAmount: 0,
        },
      ],
      notes: "Created automatically via Buyer Portal E-Signature & Reservation Fee Receipt submission.",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      deals: [newDeal, ...state.deals],
      properties: state.properties.map((p) =>
        p.id === params.propertyId ? { ...p, status: "RESERVED" } : p
      ),
      leads: state.leads.map((l) =>
        l.id === params.leadId
          ? {
              ...l,
              stage: "RESERVATION",
              documents: [
                ...l.documents,
                {
                  id: crypto.randomUUID(),
                  name: `Signed_RA_${dealNumber}.png`,
                  type: "RESERVATION_FORM" as const,
                  fileUrl:
                    params.signatureDataUrl || params.receiptImageUrl || "https://example.com/ra.png",
                  verified: true,
                  uploadedAt: new Date(),
                },
              ],
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    void persistAgentDocument(get().activeAgentUid, "deals", newDeal);
    const updatedProp = get().properties.find((p) => p.id === params.propertyId);
    if (updatedProp) {
      void persistAgentDocument(get().activeAgentUid, "properties", updatedProp);
    }
    const updatedLead = get().leads.find((l) => l.id === params.leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }

    return newDeal;
  },
}));

