import { create } from "zustand";
import type {
  Lead,
  BuyerDocument,
  PipelineStage,
  Property,
  CreatePropertyInput,
  Quotation,
  Message,
  SavedReplySnippet,
  Deal,
  BankLoanDetails,
  CommissionTranche,
  CoBrokerageDetails,
  CreateLeadInput,
  AgentMessengerSettings,
  TrippingScheduleItem,
} from "@/lib/schemas";
import {
  loadOrSeedAgentFirestoreWorkspace,
  persistAgentDocument,
  deleteAgentDocument,
  loadAgentMessengerSettings,
  saveAgentMessengerSettings,
} from "@/lib/firebase/firestore-sync";
import {
  buildPersonalizedGreetingReply,
  parseBuyerMessengerIntent,
} from "@/lib/messenger-auto-responder";

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
        status: "VERIFIED",
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
        status: "VERIFIED",
        uploadedAt: new Date("2026-11-04T09:00:00Z"),
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        name: "ITR_2316_2025_Chua.pdf",
        type: "PROOF_OF_INCOME",
        fileUrl: "https://example.com/docs/itr-chua.pdf",
        verified: true,
        status: "VERIFIED",
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
        status: "VERIFIED",
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
    bankLoanDetails: {
      partnerBank: "BPI_FAMILY",
      applicationRefNo: "BPI-HL-2026-88912",
      loanOfficerName: "Ma. Cristina Valenzuela",
      loanOfficerPhone: "+63 917 555 4321",
      loanOfficerEmail: "mcvalenzuela@bpi.com.ph",
      targetLoanAmount: 15450460, // 80% balance
      approvedLoanAmount: 15450460,
      loanShortfall: 0,
      logStatus: "NOTICE_OF_APPROVAL",
      targetLogDate: new Date("2027-10-15T00:00:00Z"),
      actualLogReleaseDate: null,
      incomeDocsChecklist: [
        { code: "BIR_2316", label: "BIR Form 2316 / Hospital Practice ITR", collected: true },
        { code: "PAYSLIPS_3M", label: "Latest 3 Months Compensation Slips", collected: true },
        { code: "COE_COMPENSATION", label: "Certificate of Medical Practice & Compensation", collected: true },
        { code: "BANK_STATEMENTS_6M", label: "6 Months BPI Account Statements", collected: true },
        { code: "GOV_ID_2X", label: "2 Valid PRC/Passport Government IDs", collected: true },
      ],
      remarks: "BPI Private Wealth approved 80% loan with 6.75% 5-year fixed interest rate. Awaiting final appraisal inspection report for LOG release.",
    },
    commissionTranches: [
      {
        id: "tranche-0104-1",
        trancheNumber: 1,
        name: "Tranche 1 (Reservation & 1st DP Cleared)",
        milestoneCondition: "Cleared 1st monthly DP + Verified RAF",
        percentage: 20,
        grossAmount: 179450,
        withholdingTaxAmount: 17945,
        netAmount: 161505,
        status: "RELEASED",
        expectedClearanceDate: new Date("2026-11-15T00:00:00Z"),
        actualReleaseDate: new Date("2026-11-16T10:00:00Z"),
        orNumber: "OR-AYALA-89211",
      },
      {
        id: "tranche-0104-2",
        trancheNumber: 2,
        name: "Tranche 2 (10% Equity Milestone)",
        milestoneCondition: "10% of total TCP collected by developer",
        percentage: 40,
        grossAmount: 358900,
        withholdingTaxAmount: 35890,
        netAmount: 323010,
        status: "PENDING",
        expectedClearanceDate: new Date("2027-04-30T00:00:00Z"),
        actualReleaseDate: null,
      },
      {
        id: "tranche-0104-3",
        trancheNumber: 3,
        name: "Tranche 3 (Bank Takeout / Full Liquidation)",
        milestoneCondition: "BPI Family loan proceeds credited to developer",
        percentage: 40,
        grossAmount: 358900,
        withholdingTaxAmount: 35890,
        netAmount: 323010,
        status: "PENDING",
        expectedClearanceDate: new Date("2027-10-30T00:00:00Z"),
        actualReleaseDate: null,
      },
    ],
    coBrokerageDetails: {
      isCoBrokered: true,
      externalBrokerName: "Atty. Katrina Alcantara, REB",
      externalBrokerPrcLicense: "PRC REB #0031844",
      externalBrokerDhsudReg: "DHSUD-NCR-B-04/24-9122",
      externalBrokerageAgency: "Apex Prime Realty & Associates",
      externalBrokerPhone: "+63 917 889 2341",
      externalBrokerEmail: "katrina.alcantara@apexrealty.ph",
      coBrokeRole: "SELLING_BROKER",
      coBrokeSharePercent: 50,
      coBrokeGrossAmount: 448625,
      moaSigned: true,
      moaSignedDate: new Date("2026-11-06T16:30:00Z"),
      remarks: "50/50 External Co-Brokerage Split for BGC high-tier buyer. Client endorsed with signed MOA.",
    },
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
    bankLoanDetails: {
      partnerBank: "METROBANK",
      applicationRefNo: "MB-HL-2026-14022",
      loanOfficerName: "Eduardo Concepcion",
      loanOfficerPhone: "+63 918 444 8822",
      loanOfficerEmail: "econcepcion@metrobank.com.ph",
      targetLoanAmount: 8051400,
      approvedLoanAmount: 8051400,
      loanShortfall: 0,
      logStatus: "TAKEOUT_COMPLETE",
      targetLogDate: new Date("2026-10-25T00:00:00Z"),
      actualLogReleaseDate: new Date("2026-10-26T00:00:00Z"),
      incomeDocsChecklist: [
        { code: "BIR_2316", label: "ITR Form 2316", collected: true },
        { code: "PAYSLIPS_3M", label: "3 Months Payslips", collected: true },
        { code: "COE_COMPENSATION", label: "Certificate of Employment", collected: true },
        { code: "BANK_STATEMENTS_6M", label: "6 Months Bank Statements", collected: true },
      ],
      remarks: "Metrobank Letter of Guarantee executed & full liquidation disbursed to Ayala Premier.",
    },
    commissionTranches: [
      {
        id: "tranche-0088-1",
        trancheNumber: 1,
        name: "Tranche 1 (Reservation Cleared)",
        milestoneCondition: "RAF Cleared",
        percentage: 20,
        grossAmount: 94500,
        withholdingTaxAmount: 9450,
        netAmount: 85050,
        status: "RELEASED",
        expectedClearanceDate: new Date("2026-10-01T00:00:00Z"),
        actualReleaseDate: new Date("2026-10-02T00:00:00Z"),
        orNumber: "OR-AYALA-77401",
      },
      {
        id: "tranche-0088-2",
        trancheNumber: 2,
        name: "Tranche 2 (10% Equity Stage)",
        milestoneCondition: "10% Equity Cleared",
        percentage: 40,
        grossAmount: 189000,
        withholdingTaxAmount: 18900,
        netAmount: 170100,
        status: "RELEASED",
        expectedClearanceDate: new Date("2026-10-15T00:00:00Z"),
        actualReleaseDate: new Date("2026-10-16T00:00:00Z"),
        orNumber: "OR-AYALA-77820",
      },
      {
        id: "tranche-0088-3",
        trancheNumber: 3,
        name: "Tranche 3 (Takeout Liquidation)",
        milestoneCondition: "Metrobank LOG Released",
        percentage: 40,
        grossAmount: 189000,
        withholdingTaxAmount: 18900,
        netAmount: 170100,
        status: "RELEASED",
        expectedClearanceDate: new Date("2026-11-01T00:00:00Z"),
        actualReleaseDate: new Date("2026-11-01T12:00:00Z"),
        orNumber: "OR-AYALA-78210",
      },
    ],
    notes: "Full 100% commission released upon BPI LOG takeout.",
    createdAt: new Date("2026-09-18T10:00:00Z"),
    updatedAt: new Date("2026-11-04T15:00:00Z"),
  },
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    referenceNumber: "QT-2026-4412",
    revisionNumber: 1,
    parentQuotationId: null,
    leadId: "20000000-0000-4000-8000-000000000003", // Patricia Lim-Chua
    agentId: AGENT_ID,
    propertyId: "10000000-0000-4000-8000-000000000003", // Kensington Courtyard
    status: "VIEWED",
    validUntil: new Date("2026-11-20T00:00:00Z"),
    calculationInput: {
      projectName: "Kensington Courtyard Townhomes",
      unitCode: "Unit C-09 (3-Storey Luxury Townhouse)",
      floorAreaSqm: 165,
      lotAreaSqm: 95,
      listPrice: 14800000,
      promoDiscountPercent: 2.5,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: 100000,
      downPaymentPercent: 20,
      downPaymentTermMonths: 24,
      annualLumpsumAmount: 0,
      isStepUpEquity: false,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 20,
    },
    agentNotes:
      "Original 24-month equity proposal sent via Messenger. Client requested stretched 36-month equity.",
    disclaimerText:
      "Prices, discounts, and interest rates are subject to change without prior notice. Final loan approval is subject to bank credit evaluation.",
    pdfUrl: null,
    shareToken: "patricia-c09",
    createdAt: new Date("2026-11-04T10:00:00Z"),
    updatedAt: new Date("2026-11-05T14:30:00Z"),
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    referenceNumber: "QT-2026-4412-R2",
    revisionNumber: 2,
    parentQuotationId: "70000000-0000-4000-8000-000000000001",
    leadId: "20000000-0000-4000-8000-000000000003", // Patricia Lim-Chua
    agentId: AGENT_ID,
    propertyId: "10000000-0000-4000-8000-000000000003",
    status: "SENT",
    validUntil: new Date("2026-11-25T00:00:00Z"),
    calculationInput: {
      projectName: "Kensington Courtyard Townhomes",
      unitCode: "Unit C-09 (3-Storey Luxury Townhouse)",
      floorAreaSqm: 165,
      lotAreaSqm: 95,
      listPrice: 14800000,
      promoDiscountPercent: 2.5,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: 100000,
      downPaymentPercent: 20,
      downPaymentTermMonths: 36,
      annualLumpsumAmount: 0,
      isStepUpEquity: true,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 20,
    },
    agentNotes:
      "Revision 2: Stretched down payment to 36 months with Step-Up equity structure to lower monthly cash outlay.",
    disclaimerText:
      "Prices, discounts, and interest rates are subject to change without prior notice. Final loan approval is subject to bank credit evaluation.",
    pdfUrl: null,
    shareToken: "patricia-c09-r2",
    createdAt: new Date("2026-11-07T11:20:00Z"),
    updatedAt: new Date("2026-11-07T11:20:00Z"),
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    referenceNumber: "QT-2026-3820",
    revisionNumber: 1,
    parentQuotationId: null,
    leadId: "20000000-0000-4000-8000-000000000002", // Rafael Villanueva
    agentId: AGENT_ID,
    propertyId: "10000000-0000-4000-8000-000000000001", // The Meridian Park
    status: "VIEWED",
    validUntil: new Date("2026-11-22T00:00:00Z"),
    calculationInput: {
      projectName: "The Meridian Park Residences",
      unitCode: "Tower B - 2408 (2BR Corner)",
      floorAreaSqm: 84.5,
      lotAreaSqm: 0,
      listPrice: 18500000,
      promoDiscountPercent: 3.0,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: 100000,
      downPaymentPercent: 20,
      downPaymentTermMonths: 24,
      annualLumpsumAmount: 150000,
      isStepUpEquity: false,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.25,
      loanTenorYears: 15,
    },
    agentNotes:
      "Prepared for Saturday showroom viewing. Includes annual balloon lumpsums on months 12 and 24.",
    disclaimerText:
      "Prices, discounts, and interest rates are subject to change without prior notice. Final loan approval is subject to bank credit evaluation.",
    pdfUrl: null,
    shareToken: "rafael-bgc-2408",
    createdAt: new Date("2026-11-06T14:00:00Z"),
    updatedAt: new Date("2026-11-07T08:15:00Z"),
  },
  {
    id: "70000000-0000-4000-8000-000000000004",
    referenceNumber: "QT-2026-1194",
    revisionNumber: 1,
    parentQuotationId: null,
    leadId: "20000000-0000-4000-8000-000000000006", // Engr. Dominic Velasco
    agentId: AGENT_ID,
    propertyId: "10000000-0000-4000-8000-000000000002", // Solana Verde
    status: "ACCEPTED",
    validUntil: new Date("2026-10-30T00:00:00Z"),
    calculationInput: {
      projectName: "Solana Verde Country Homes",
      unitCode: "Block 14 Lot 8 (3BR Single Detached)",
      floorAreaSqm: 120,
      lotAreaSqm: 150,
      listPrice: 9450000,
      promoDiscountPercent: 0,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: 50000,
      downPaymentPercent: 15,
      downPaymentTermMonths: 18,
      annualLumpsumAmount: 0,
      isStepUpEquity: false,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 20,
    },
    agentNotes:
      "Accepted and converted to Deal DL-2026-0088. Reservation fee paid via Metrobank.",
    disclaimerText:
      "Official computation accepted upon reservation agreement signing.",
    pdfUrl: null,
    shareToken: "dominic-solana-b14",
    createdAt: new Date("2026-09-18T09:00:00Z"),
    updatedAt: new Date("2026-09-18T10:00:00Z"),
  },
];

export const INITIAL_TRIPPINGS: TrippingScheduleItem[] = [
  {
    id: "trip-001",
    leadId: "20000000-0000-4000-8000-000000000002",
    propertyId: "10000000-0000-4000-8000-000000000001",
    scheduledDate: "2026-11-14",
    scheduledTime: "14:00",
    meetingPoint: "The Meridian Park Main Pavilion, 34th St., BGC",
    status: "CONFIRMED",
    notes: "VIP Guest Parking Slot #12 reserved. Prepare 2BR Corner scale model.",
    createdAt: new Date("2026-11-08T06:40:00Z").toISOString(),
  },
  {
    id: "trip-002",
    leadId: "20000000-0000-4000-8000-000000000001",
    propertyId: "10000000-0000-4000-8000-000000000002",
    scheduledDate: "2026-11-15",
    scheduledTime: "10:30",
    meetingPoint: "Solana Verde Clubhouse Gate, Nuvali South",
    status: "CONFIRMED",
    notes: "Inspecting Aria RFO Model House (Block 14 Lot 8) with family.",
    createdAt: new Date("2026-11-08T07:00:00Z").toISOString(),
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
  trippings: TrippingScheduleItem[];
  selectedLeadId: string | null;
  messengerSettings: AgentMessengerSettings | null;

  // Actions
  syncWithAgentAccount: (agentUid: string | null) => Promise<void>;
  updateMessengerSettings: (settings: Partial<AgentMessengerSettings>) => Promise<void>;
  setSelectedLeadId: (id: string | null) => void;
  moveLeadStage: (leadId: string, targetStage: PipelineStage) => void;
  addLead: (input: CreateLeadInput) => Lead;
  bulkAddLeads: (inputs: CreateLeadInput[]) => Lead[];
  addProperty: (input: CreatePropertyInput) => Property;
  bulkAddProperties: (inputs: CreatePropertyInput[]) => Property[];
  updateProperty: (propertyId: string, input: Partial<CreatePropertyInput>) => Property | null;
  updatePropertyStatus: (propertyId: string, status: Property["status"]) => void;
  deleteProperty: (propertyId: string) => void;
  addTripping: (trip: Omit<TrippingScheduleItem, "id" | "createdAt">) => TrippingScheduleItem;
  updateTrippingStatus: (id: string, status: TrippingScheduleItem["status"]) => void;
  deleteTripping: (id: string) => void;
  addLeadNote: (leadId: string, noteText: string) => void;
  sendMessage: (
    leadId: string,
    content: string,
    attachedQuotationId?: string
  ) => Message;
  sendClientPortalMessage: (
    leadId: string,
    content: string,
    attachedQuotationId?: string
  ) => Message;
  receiveWebhookMessage: (
    psid: string,
    senderName: string,
    content: string,
    metaMid?: string
  ) => { leadId: string; isNewLead: boolean; autoReplied: boolean };
  saveQuotation: (quotation: Quotation) => void;
  updateQuotationStatus: (quotationId: string, status: Quotation["status"]) => void;
  addLeadDocument: (
    leadId: string,
    doc: {
      name: string;
      type: BuyerDocument["type"];
      fileUrl: string;
      verified?: boolean;
    }
  ) => BuyerDocument;
  updateLeadDocumentStatus: (
    leadId: string,
    documentId: string,
    status: "PENDING" | "VERIFIED" | "REJECTED",
    remarks?: string
  ) => void;
  deleteLeadDocument: (leadId: string, documentId: string) => void;
  updateLeadTags: (leadId: string, tags: string[]) => void;
  toggleDealRequirementStatus: (dealId: string, requirementId: string) => void;
  updateDealStage: (dealId: string, stage: Deal["stage"]) => void;
  updateDealBankLoanDetails: (dealId: string, details: Partial<BankLoanDetails>) => void;
  toggleDealIncomeDoc: (dealId: string, docCode: string) => void;
  updateDealTrancheStatus: (dealId: string, trancheId: string, status: CommissionTranche["status"]) => void;
  updateDealCoBrokerage: (dealId: string, details: Partial<CoBrokerageDetails>) => void;
  disburseDealCommission: (dealId: string) => void;
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
  syncLiveMessages: (liveMessages: Message[]) => void;
  syncLiveLeads: (liveLeads: Lead[]) => void;
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

function deleteLocalCustomProperty(propertyId: string, agentUid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = `propflow_properties_${agentUid || "default"}`;
    const existing = getLocalCustomProperties(agentUid);
    const updated = existing.filter((p) => p.id !== propertyId);
    localStorage.setItem(key, JSON.stringify(updated));
    if (agentUid && agentUid !== "default") {
      const defaultExisting = getLocalCustomProperties("default");
      const defaultUpdated = defaultExisting.filter((p) => p.id !== propertyId);
      localStorage.setItem("propflow_properties_default", JSON.stringify(defaultUpdated));
    }
  } catch (e) {
    console.warn("localStorage property delete failed:", e);
  }
}

function getLocalQuotations(agentUid?: string | null): Quotation[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `propflow_quotations_${agentUid || "default"}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((q: Record<string, unknown>) => ({
      ...(q as unknown as Quotation),
      validUntil: new Date((q.validUntil as string) || Date.now() + 7 * 86400000),
      createdAt: new Date((q.createdAt as string) || Date.now()),
      updatedAt: new Date((q.updatedAt as string) || Date.now()),
    }));
  } catch {
    return [];
  }
}

function saveLocalQuotation(quotation: Quotation, agentUid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = `propflow_quotations_${agentUid || "default"}`;
    const existing = getLocalQuotations(agentUid);
    const updated = [quotation, ...existing.filter((q) => q.id !== quotation.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn("localStorage quotation save failed:", e);
  }
}

function getLocalTrippings(agentUid?: string | null): TrippingScheduleItem[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `propflow_trippings_${agentUid || "default"}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveLocalTripping(trip: TrippingScheduleItem, agentUid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = `propflow_trippings_${agentUid || "default"}`;
    const existing = getLocalTrippings(agentUid);
    const updated = [trip, ...existing.filter((t) => t.id !== trip.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn("localStorage tripping save failed:", e);
  }
}

function deleteLocalTripping(tripId: string, agentUid?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = `propflow_trippings_${agentUid || "default"}`;
    const existing = getLocalTrippings(agentUid);
    const updated = existing.filter((t) => t.id !== tripId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn("localStorage tripping delete failed:", e);
  }
}

export const useCrmStore = create<CrmState>((set, get) => ({
  activeAgentUid: null,
  isSyncingFirestore: false,
  leads: INITIAL_LEADS,
  properties: INITIAL_PROPERTIES,
  messages: INITIAL_MESSAGES,
  deals: INITIAL_DEALS,
  quotations: INITIAL_QUOTATIONS,
  trippings: INITIAL_TRIPPINGS,
  selectedLeadId: INITIAL_LEADS[0]?.id ?? null,
  messengerSettings: null,

  syncWithAgentAccount: async (agentUid) => {
    if (!agentUid) {
      const localProps = getLocalCustomProperties("default");
      const propMap = new Map<string, Property>();
      INITIAL_PROPERTIES.forEach((p) => propMap.set(p.id, p));
      localProps.forEach((p) => propMap.set(p.id, p));

      const localQuotes = getLocalQuotations("default");
      const quoteMap = new Map<string, Quotation>();
      INITIAL_QUOTATIONS.forEach((q) => quoteMap.set(q.id, q));
      localQuotes.forEach((q) => quoteMap.set(q.id, q));

      const localTrips = getLocalTrippings("default");
      const tripMap = new Map<string, TrippingScheduleItem>();
      INITIAL_TRIPPINGS.forEach((t) => tripMap.set(t.id, t));
      localTrips.forEach((t) => tripMap.set(t.id, t));

      const demoSettings = await loadAgentMessengerSettings("demo-agent-marco");

      set({
        activeAgentUid: null,
        leads: INITIAL_LEADS,
        properties: Array.from(propMap.values()),
        messages: INITIAL_MESSAGES,
        deals: INITIAL_DEALS,
        quotations: Array.from(quoteMap.values()),
        trippings: Array.from(tripMap.values()),
        selectedLeadId: INITIAL_LEADS[0]?.id ?? null,
        messengerSettings: demoSettings,
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
        quotations: INITIAL_QUOTATIONS,
        trippings: INITIAL_TRIPPINGS,
      });

      const agentMessengerSettings = await loadAgentMessengerSettings(agentUid);

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

      // Merge: Initial proposals + local custom quotations + Firestore quotations + in-memory quotations
      const localQuotes = [
        ...getLocalQuotations(agentUid),
        ...getLocalQuotations("default"),
      ];
      const quoteMap = new Map<string, Quotation>();
      INITIAL_QUOTATIONS.forEach((q) => quoteMap.set(q.id, q));
      get().quotations.forEach((q) => quoteMap.set(q.id, q));
      localQuotes.forEach((q) => quoteMap.set(q.id, q));
      workspace.quotations.forEach((q) => quoteMap.set(q.id, q));

      // Merge: Initial trippings + local trippings + Firestore trippings
      const localTrips = [
        ...getLocalTrippings(agentUid),
        ...getLocalTrippings("default"),
      ];
      const tripMap = new Map<string, TrippingScheduleItem>();
      INITIAL_TRIPPINGS.forEach((t) => tripMap.set(t.id, t));
      get().trippings.forEach((t) => tripMap.set(t.id, t));
      localTrips.forEach((t) => tripMap.set(t.id, t));
      (workspace.trippings || []).forEach((t) => tripMap.set(t.id, t));

      set({
        leads: workspace.leads.length > 0 ? workspace.leads : get().leads,
        properties: Array.from(propMap.values()),
        messages: workspace.messages.length > 0 ? workspace.messages : get().messages,
        deals: workspace.deals.length > 0 ? workspace.deals : get().deals,
        quotations: Array.from(quoteMap.values()),
        trippings: Array.from(tripMap.values()),
        selectedLeadId: workspace.leads[0]?.id ?? get().selectedLeadId,
        messengerSettings: agentMessengerSettings,
        isSyncingFirestore: false,
      });
    } catch {
      set({ isSyncingFirestore: false });
    }
  },

  updateMessengerSettings: async (partial) => {
    const current = get().messengerSettings;
    const agentUid = get().activeAgentUid || "demo-agent-marco";
    const updated: AgentMessengerSettings = {
      pageId: partial.pageId ?? current?.pageId ?? "",
      pageName: partial.pageName ?? current?.pageName ?? "",
      pageAccessToken: partial.pageAccessToken ?? current?.pageAccessToken ?? "",
      appSecret: partial.appSecret ?? current?.appSecret ?? "",
      verifyToken: partial.verifyToken ?? current?.verifyToken ?? "propflow_meta_verify_secret_2026",
      isConnected: partial.isConnected ?? current?.isConnected ?? false,
      lastVerifiedAt:
        partial.lastVerifiedAt !== undefined
          ? partial.lastVerifiedAt
          : current?.lastVerifiedAt ?? null,
      autoReplyGreeting:
        partial.autoReplyGreeting ?? current?.autoReplyGreeting ?? true,
      greetingMessage:
        partial.greetingMessage ??
        current?.greetingMessage ??
        "Hi {name}! Thanks for reaching out to us. Are you interested in pre-selling or ready-for-occupancy units?",
      updatedAt: new Date().toISOString(),
    };

    set({ messengerSettings: updated });
    await saveAgentMessengerSettings(agentUid, updated);
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
      tags: input.tags?.length
        ? Array.from(new Set(["CSV Import", ...input.tags]))
        : ["CSV Import"],
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

  updateProperty: (propertyId, input) => {
    const activeUid = get().activeAgentUid;
    let updatedProperty: Property | null = null;

    set((state) => {
      const target = state.properties.find((p) => p.id === propertyId);
      if (!target) return state;

      updatedProperty = {
        ...target,
        ...input,
      };

      return {
        properties: state.properties.map((p) =>
          p.id === propertyId ? updatedProperty! : p
        ),
      };
    });

    if (updatedProperty) {
      const prop = updatedProperty as Property;
      const targetUid =
        activeUid ||
        (prop.listedByAgentId && prop.listedByAgentId !== "agent-direct-listing"
          ? prop.listedByAgentId
          : null);
      saveLocalCustomProperty(prop, targetUid);
      saveLocalCustomProperty(prop, "default");
      if (targetUid) {
        void persistAgentDocument(targetUid, "properties", prop);
      }
    }

    return updatedProperty;
  },

  updatePropertyStatus: (propertyId, status) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, status } : p
      ),
    }));
    const updatedProp = get().properties.find((p) => p.id === propertyId);
    if (updatedProp) {
      const activeUid = get().activeAgentUid;
      const targetUid =
        activeUid ||
        (updatedProp.listedByAgentId && updatedProp.listedByAgentId !== "agent-direct-listing"
          ? updatedProp.listedByAgentId
          : null);
      saveLocalCustomProperty(updatedProp, targetUid);
      saveLocalCustomProperty(updatedProp, "default");
      if (targetUid) {
        void persistAgentDocument(targetUid, "properties", updatedProp);
      }
    }
  },

  deleteProperty: (propertyId) => {
    const activeUid = get().activeAgentUid;
    const target = get().properties.find((p) => p.id === propertyId);

    set((state) => ({
      properties: state.properties.filter((p) => p.id !== propertyId),
    }));

    if (target) {
      const targetUid =
        activeUid ||
        (target.listedByAgentId && target.listedByAgentId !== "agent-direct-listing"
          ? target.listedByAgentId
          : null);
      deleteLocalCustomProperty(propertyId, targetUid);
      deleteLocalCustomProperty(propertyId, "default");
    }
  },

  addTripping: (tripInput) => {
    const id = `trip-${Date.now()}`;
    const newTrip: TrippingScheduleItem = {
      ...tripInput,
      id,
      status: tripInput.status || "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    const activeUid = get().activeAgentUid;
    saveLocalTripping(newTrip, activeUid);
    saveLocalTripping(newTrip, "default");
    if (activeUid) {
      void persistAgentDocument(activeUid, "trippings", newTrip);
    }

    set((state) => ({
      trippings: [newTrip, ...state.trippings.filter((t) => t.id !== id)],
    }));

    if (newTrip.leadId) {
      get().moveLeadStage(newTrip.leadId, "SITE_TRIPPING");
    }

    return newTrip;
  },

  updateTrippingStatus: (id, status) => {
    const activeUid = get().activeAgentUid;
    const target = get().trippings.find((t) => t.id === id);
    if (!target) return;
    const updated: TrippingScheduleItem = { ...target, status };
    saveLocalTripping(updated, activeUid);
    saveLocalTripping(updated, "default");
    if (activeUid) {
      void persistAgentDocument(activeUid, "trippings", updated);
    }
    set((state) => ({
      trippings: state.trippings.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTripping: (id) => {
    const activeUid = get().activeAgentUid;
    deleteLocalTripping(id, activeUid);
    deleteLocalTripping(id, "default");
    if (activeUid) {
      void deleteAgentDocument(activeUid, "trippings", id);
    }
    set((state) => ({
      trippings: state.trippings.filter((t) => t.id !== id),
    }));
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

  sendClientPortalMessage: (leadId, content, attachedQuotationId) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      leadId,
      senderType: "LEAD",
      senderId: leadId,
      channel: "FACEBOOK_MESSENGER",
      content,
      attachedQuotationId: attachedQuotationId ?? null,
      deliveryStatus: "DELIVERED",
      createdAt: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, newMsg],
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              lastContactedAt: new Date(),
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
    const isNewLead = !existingLead;
    const intent = parseBuyerMessengerIntent(content);
    let targetLeadId = existingLead?.id || "";
    let createdLead: Lead | null = null;

    if (!existingLead) {
      const nameParts = senderName.trim().split(" ");
      const firstName = nameParts[0] || "Messenger";
      const lastName = nameParts.slice(1).join(" ") || "Lead";
      createdLead = {
        id: crypto.randomUUID(),
        assignedAgentId: get().activeAgentUid || AGENT_ID,
        firstName,
        lastName,
        email: "",
        phone: "Pending via Messenger",
        messengerPsid: psid,
        stage: "NEW_LEAD",
        source: "FACEBOOK_MESSENGER",
        priority: intent.priority,
        budgetMin: intent.budgetMin,
        budgetMax: intent.budgetMax,
        preferredLocations: intent.preferredLocations,
        preferredPropertyTypes: intent.preferredPropertyTypes,
        financingPreference: intent.financingPreference,
        notes: `Auto-captured via Facebook Messenger: "${content}"`,
        tags: intent.detectedTags,
        documents: [],
        lastContactedAt: null,
        nextFollowUpAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      targetLeadId = createdLead.id;
      set((state) => ({ leads: [createdLead!, ...state.leads] }));
      void persistAgentDocument(get().activeAgentUid, "leads", createdLead);
    }

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
    void persistAgentDocument(get().activeAgentUid, "messages", incomingMsg);

    // Trigger Instant Greeting Auto-Responder for newly captured leads when enabled
    let autoReplied = false;
    const settings = get().messengerSettings;
    if (isNewLead && settings?.autoReplyGreeting) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://propflow.ph";
      const replyContent = buildPersonalizedGreetingReply({
        firstName: createdLead?.firstName || senderName.split(" ")[0] || "there",
        greetingTemplate: settings.greetingMessage,
        intent,
        properties: get().properties,
        portalUrl: `${origin}/showcase?view=client`,
      });

      const autoMsg: Message = {
        id: crypto.randomUUID(),
        leadId: targetLeadId,
        senderType: "AGENT",
        senderId: get().activeAgentUid || AGENT_ID,
        channel: "FACEBOOK_MESSENGER",
        metaMid: `m_auto_${Date.now()}`,
        content: replyContent,
        deliveryStatus: "SENT",
        createdAt: new Date(Date.now() + 300),
      };

      set((state) => ({
        messages: [...state.messages, autoMsg],
        leads: state.leads.map((l) =>
          l.id === targetLeadId
            ? {
                ...l,
                stage: l.stage === "NEW_LEAD" ? "CONTACTED" : l.stage,
                lastContactedAt: new Date(),
                updatedAt: new Date(),
              }
            : l
        ),
      }));

      void persistAgentDocument(get().activeAgentUid, "messages", autoMsg);
      const syncedLead = get().leads.find((l) => l.id === targetLeadId);
      if (syncedLead) {
        void persistAgentDocument(get().activeAgentUid, "leads", syncedLead);
      }

      if (settings.isConnected && settings.pageAccessToken && typeof window !== "undefined") {
        void fetch("/api/messenger/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientPsid: psid,
            text: replyContent,
            pageAccessToken: settings.pageAccessToken,
          }),
        }).catch(() => {});
      }

      autoReplied = true;
    }

    return { leadId: targetLeadId, isNewLead, autoReplied };
  },

  saveQuotation: (quotation) => {
    set((state) => ({
      quotations: [quotation, ...state.quotations.filter((q) => q.id !== quotation.id)],
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
    saveLocalQuotation(quotation, get().activeAgentUid);
    saveLocalQuotation(quotation, "default");
    void persistAgentDocument(get().activeAgentUid, "quotations", quotation);
    const updatedLead = get().leads.find((l) => l.id === quotation.leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
  },

  updateQuotationStatus: (quotationId, status) => {
    set((state) => ({
      quotations: state.quotations.map((q) =>
        q.id === quotationId ? { ...q, status, updatedAt: new Date() } : q
      ),
    }));
    const updated = get().quotations.find((q) => q.id === quotationId);
    if (updated) {
      saveLocalQuotation(updated, get().activeAgentUid);
      saveLocalQuotation(updated, "default");
      void persistAgentDocument(get().activeAgentUid, "quotations", updated);
    }
  },

  addLeadDocument: (leadId, input) => {
    const newDoc: BuyerDocument = {
      id: crypto.randomUUID(),
      name: input.name,
      type: input.type,
      fileUrl: input.fileUrl,
      verified: Boolean(input.verified),
      status: input.verified ? "VERIFIED" : "PENDING",
      uploadedAt: new Date(),
    };

    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              documents: [
                newDoc,
                ...l.documents.filter(
                  (d) => d.type !== input.type || d.id === newDoc.id
                ),
              ],
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    const updatedLead = get().leads.find((l) => l.id === leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
    return newDoc;
  },

  updateLeadDocumentStatus: (leadId, documentId, status, remarks) => {
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              documents: l.documents.map((d) =>
                d.id === documentId
                  ? {
                      ...d,
                      status,
                      verified: status === "VERIFIED",
                      remarks: remarks !== undefined ? remarks : d.remarks,
                    }
                  : d
              ),
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    const updatedLead = get().leads.find((l) => l.id === leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
  },

  deleteLeadDocument: (leadId, documentId) => {
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              documents: l.documents.filter((d) => d.id !== documentId),
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    const updatedLead = get().leads.find((l) => l.id === leadId);
    if (updatedLead) {
      void persistAgentDocument(get().activeAgentUid, "leads", updatedLead);
    }
  },

  updateLeadTags: (leadId, tags) => {
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              tags,
              updatedAt: new Date(),
            }
          : l
      ),
    }));

    const updatedLead = get().leads.find((l) => l.id === leadId);
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

  updateDealStage: (dealId, stage) => {
    set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage,
              updatedAt: new Date(),
              actualClosedDate:
                stage === "CLOSED_RELEASED" && !deal.actualClosedDate
                  ? new Date()
                  : deal.actualClosedDate,
            }
          : deal
      ),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  updateDealBankLoanDetails: (dealId, details) => {
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const currentLoan = deal.bankLoanDetails || {
          partnerBank: "BPI_FAMILY",
          applicationRefNo: "",
          loanOfficerName: "",
          loanOfficerPhone: "",
          loanOfficerEmail: "",
          targetLoanAmount: deal.totalContractPrice * 0.8,
          approvedLoanAmount: deal.totalContractPrice * 0.8,
          loanShortfall: 0,
          logStatus: "NOT_STARTED",
          targetLogDate: deal.targetLoanTakeoutDate || null,
          actualLogReleaseDate: null,
          incomeDocsChecklist: [
            { code: "BIR_2316", label: "BIR Form 2316 / Latest ITR", collected: false },
            { code: "PAYSLIPS_3M", label: "Latest 3 Months Official Payslips", collected: false },
            { code: "COE_COMPENSATION", label: "Certificate of Employment & Compensation", collected: false },
            { code: "BANK_STATEMENTS_6M", label: "6 Months Bank Statements", collected: false },
            { code: "GOV_ID_2X", label: "2 Valid Government IDs with Signatures", collected: false },
          ],
        };

        const target = details.targetLoanAmount ?? currentLoan.targetLoanAmount;
        const approved = details.approvedLoanAmount ?? currentLoan.approvedLoanAmount;
        const loanShortfall = Math.max(0, target - approved);

        const updatedLoan: BankLoanDetails = {
          ...currentLoan,
          ...details,
          targetLoanAmount: target,
          approvedLoanAmount: approved,
          loanShortfall,
        };

        return {
          ...deal,
          bankLoanDetails: updatedLoan,
          updatedAt: new Date(),
        };
      }),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  toggleDealIncomeDoc: (dealId, docCode) => {
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const currentLoan = deal.bankLoanDetails || {
          partnerBank: "BPI_FAMILY",
          applicationRefNo: "",
          loanOfficerName: "",
          loanOfficerPhone: "",
          loanOfficerEmail: "",
          targetLoanAmount: deal.totalContractPrice * 0.8,
          approvedLoanAmount: deal.totalContractPrice * 0.8,
          loanShortfall: 0,
          logStatus: "NOT_STARTED",
          targetLogDate: deal.targetLoanTakeoutDate || null,
          actualLogReleaseDate: null,
          incomeDocsChecklist: [
            { code: "BIR_2316", label: "BIR Form 2316 / Latest ITR", collected: false },
            { code: "PAYSLIPS_3M", label: "Latest 3 Months Official Payslips", collected: false },
            { code: "COE_COMPENSATION", label: "Certificate of Employment & Compensation", collected: false },
            { code: "BANK_STATEMENTS_6M", label: "6 Months Bank Statements", collected: false },
            { code: "GOV_ID_2X", label: "2 Valid Government IDs with Signatures", collected: false },
          ],
        };

        const nextDocs = currentLoan.incomeDocsChecklist.map((doc) =>
          doc.code === docCode
            ? {
                ...doc,
                collected: !doc.collected,
                verifiedAt: !doc.collected ? new Date() : null,
              }
            : doc
        );

        return {
          ...deal,
          bankLoanDetails: {
            ...currentLoan,
            incomeDocsChecklist: nextDocs,
          },
          updatedAt: new Date(),
        };
      }),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  updateDealTrancheStatus: (dealId, trancheId, status) => {
    const now = new Date();
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const nextTranches = (deal.commissionTranches || []).map((tranche) =>
          tranche.id === trancheId
            ? {
                ...tranche,
                status,
                actualReleaseDate: status === "RELEASED" ? now : tranche.actualReleaseDate,
              }
            : tranche
        );
        return {
          ...deal,
          commissionTranches: nextTranches,
          updatedAt: now,
        };
      }),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  updateDealCoBrokerage: (dealId, details) => {
    const now = new Date();
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const currentCoBroke = deal.coBrokerageDetails || {
          isCoBrokered: false,
          externalBrokerName: "",
          externalBrokerPrcLicense: "",
          externalBrokerDhsudReg: "",
          externalBrokerageAgency: "",
          externalBrokerPhone: "",
          externalBrokerEmail: "",
          coBrokeRole: "SELLING_BROKER" as const,
          coBrokeSharePercent: 50,
          coBrokeGrossAmount: deal.grossCommissionTotal * 0.5,
          moaSigned: false,
          moaSignedDate: null,
          moaDocumentUrl: null,
          remarks: "",
        };

        const merged: CoBrokerageDetails = {
          ...currentCoBroke,
          ...details,
        };

        // Recalculate co-broke gross amount based on share percent
        if (typeof details.coBrokeSharePercent === "number") {
          merged.coBrokeGrossAmount = (deal.grossCommissionTotal * details.coBrokeSharePercent) / 100;
        }

        return {
          ...deal,
          coBrokerageDetails: merged,
          updatedAt: now,
        };
      }),
    }));
    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }
  },

  disburseDealCommission: (dealId) => {
    const now = new Date();
    let affectedLeadId: string | null = null;

    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        affectedLeadId = deal.leadId;
        const fullyReleasedSplits = deal.commissionSplits.map((split) => ({
          ...split,
          releaseStatus: "FULLY_RELEASED" as const,
          releasedAmount: split.netCommissionAmount,
          releasedAt: split.releasedAt || now,
        }));

        return {
          ...deal,
          stage: "CLOSED_RELEASED" as const,
          actualClosedDate: deal.actualClosedDate || now,
          commissionSplits: fullyReleasedSplits,
          updatedAt: now,
        };
      }),
    }));

    const updatedDeal = get().deals.find((d) => d.id === dealId);
    if (updatedDeal) {
      void persistAgentDocument(get().activeAgentUid, "deals", updatedDeal);
    }

    if (affectedLeadId) {
      get().moveLeadStage(affectedLeadId, "CLOSED_WON");
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
      bankLoanDetails: {
        partnerBank: "BPI_FAMILY",
        applicationRefNo: `BPI-APP-${Math.floor(10000 + Math.random() * 90000)}`,
        loanOfficerName: "Designated Home Loan Specialist",
        loanOfficerPhone: "+63 917 123 4567",
        loanOfficerEmail: "homeloans@bpi.com.ph",
        targetLoanAmount: params.totalContractPrice * 0.8,
        approvedLoanAmount: params.totalContractPrice * 0.8,
        loanShortfall: 0,
        logStatus: "DOCS_COLLECTING",
        targetLogDate: new Date(Date.now() + 300 * 86400000),
        actualLogReleaseDate: null,
        incomeDocsChecklist: [
          { code: "BIR_2316", label: "BIR Form 2316 / Latest ITR with AFS", collected: false },
          { code: "PAYSLIPS_3M", label: "Latest 3 Months Official Payslips", collected: false },
          { code: "COE_COMPENSATION", label: "Certificate of Employment & Compensation", collected: false },
          { code: "BANK_STATEMENTS_6M", label: "6 Months Bank Statements", collected: false },
          { code: "GOV_ID_2X", label: "2 Valid Government IDs with Signatures", collected: true },
        ],
      },
      commissionTranches: [
        {
          id: crypto.randomUUID(),
          trancheNumber: 1,
          name: "Tranche 1 (Reservation & 1st DP Cleared)",
          milestoneCondition: "Cleared 1st monthly DP + Verified RAF",
          percentage: 20,
          grossAmount: grossCommissionTotal * 0.2,
          withholdingTaxAmount: grossCommissionTotal * 0.2 * 0.1,
          netAmount: grossCommissionTotal * 0.2 * 0.9,
          status: "ELIGIBLE",
          expectedClearanceDate: new Date(Date.now() + 30 * 86400000),
          actualReleaseDate: null,
        },
        {
          id: crypto.randomUUID(),
          trancheNumber: 2,
          name: "Tranche 2 (10% Equity Collection)",
          milestoneCondition: "10% of total TCP collected by developer",
          percentage: 40,
          grossAmount: grossCommissionTotal * 0.4,
          withholdingTaxAmount: grossCommissionTotal * 0.4 * 0.1,
          netAmount: grossCommissionTotal * 0.4 * 0.9,
          status: "PENDING",
          expectedClearanceDate: new Date(Date.now() + 180 * 86400000),
          actualReleaseDate: null,
        },
        {
          id: crypto.randomUUID(),
          trancheNumber: 3,
          name: "Tranche 3 (Bank Takeout / Full Liquidation)",
          milestoneCondition: "Bank loan proceeds credited to developer",
          percentage: 40,
          grossAmount: grossCommissionTotal * 0.4,
          withholdingTaxAmount: grossCommissionTotal * 0.4 * 0.1,
          netAmount: grossCommissionTotal * 0.4 * 0.9,
          status: "PENDING",
          expectedClearanceDate: new Date(Date.now() + 365 * 86400000),
          actualReleaseDate: null,
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
                  status: "VERIFIED" as const,
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

  syncLiveMessages: (liveMessages) => {
    if (!liveMessages || liveMessages.length === 0) return;
    set((state) => {
      const msgMap = new Map<string, Message>();
      state.messages.forEach((m) => msgMap.set(m.id, m));
      liveMessages.forEach((m) => msgMap.set(m.id, m));
      const merged = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return { messages: merged };
    });
  },

  syncLiveLeads: (liveLeads) => {
    if (!liveLeads || liveLeads.length === 0) return;
    set((state) => {
      const leadMap = new Map<string, Lead>();
      state.leads.forEach((l) => leadMap.set(l.id, l));
      liveLeads.forEach((l) => leadMap.set(l.id, l));
      return { leads: Array.from(leadMap.values()) };
    });
  },
}));

