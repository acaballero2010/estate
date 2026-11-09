import type { Property } from "@/lib/schemas";

export interface InvestmentYieldAnalysis {
  monthlyRentEstimated: number;
  annualRentGross: number;
  grossRentalYieldPercent: number;
  annualAppreciationRatePercent: number;
  projectedTotalAnnualReturnPercent: number;
  rentRatePerSqm: number;
}

export function calculatePropertyInvestmentYield(
  prop: Property
): InvestmentYieldAnalysis {
  const city = (prop.locationCity || "").toLowerCase();
  const address = (prop.address || "").toLowerCase();

  let rentRatePerSqm = 800;
  if (
    city.includes("taguig") ||
    city.includes("bgc") ||
    city.includes("makati") ||
    address.includes("bgc")
  ) {
    rentRatePerSqm = 1050; // Premium CBD rate
  } else if (
    city.includes("ortigas") ||
    city.includes("pasig") ||
    city.includes("mandaluyong")
  ) {
    rentRatePerSqm = 850;
  } else if (city.includes("cebu")) {
    rentRatePerSqm = 780;
  } else if (
    city.includes("quezon") ||
    city.includes("new manila") ||
    city.includes("san juan")
  ) {
    rentRatePerSqm = 680;
  } else if (
    city.includes("nuvali") ||
    city.includes("laguna") ||
    city.includes("cavite")
  ) {
    rentRatePerSqm = 480;
  }

  const effectiveArea = Math.max(prop.floorAreaSqm || 40, 20);
  const monthlyRentEstimated = Math.round(effectiveArea * rentRatePerSqm);
  const annualRentGross = monthlyRentEstimated * 12;
  const grossRentalYieldPercent = +(
    (annualRentGross / (prop.listPrice || 10000000)) *
    100
  ).toFixed(1);
  const annualAppreciationRatePercent = 7.5; // Average prime masterplan capital growth
  const projectedTotalAnnualReturnPercent = +(
    grossRentalYieldPercent + annualAppreciationRatePercent
  ).toFixed(1);

  return {
    monthlyRentEstimated,
    annualRentGross,
    grossRentalYieldPercent,
    annualAppreciationRatePercent,
    projectedTotalAnnualReturnPercent,
    rentRatePerSqm,
  };
}

export interface VicinityLandmark {
  name: string;
  category: "RETAIL" | "HEALTHCARE" | "EDUCATION" | "TRANSIT";
  distanceText: string;
  travelMinutesText: string;
  badge: string;
}

export function getPropertyVicinityLandmarks(
  prop: Property
): VicinityLandmark[] {
  const loc = `${prop.locationCity} ${prop.address}`.toLowerCase();

  if (loc.includes("bgc") || loc.includes("taguig") || loc.includes("fort")) {
    return [
      {
        name: "Bonifacio High Street & Amphitheater",
        category: "RETAIL",
        distanceText: "600m",
        travelMinutesText: "3 mins walk",
        badge: "Lifestyle Arcade",
      },
      {
        name: "Uptown Mall & Mitsukoshi BGC",
        category: "RETAIL",
        distanceText: "950m",
        travelMinutesText: "4 mins drive",
        badge: "Luxury Shopping",
      },
      {
        name: "St. Luke's Medical Center Global City",
        category: "HEALTHCARE",
        distanceText: "1.2 km",
        travelMinutesText: "5 mins drive",
        badge: "JCI Accredited",
      },
      {
        name: "International School Manila (ISM) & BSM",
        category: "EDUCATION",
        distanceText: "1.4 km",
        travelMinutesText: "6 mins drive",
        badge: "IB World School",
      },
      {
        name: "Metro Manila Subway (BGC Station)",
        category: "TRANSIT",
        distanceText: "800m",
        travelMinutesText: "4 mins walk",
        badge: "Direct Subway Line",
      },
      {
        name: "NAIA Terminal 3 International Airport",
        category: "TRANSIT",
        distanceText: "7.8 km",
        travelMinutesText: "16 mins via Skyway",
        badge: "Airport Express",
      },
    ];
  }

  if (
    loc.includes("new manila") ||
    loc.includes("quezon") ||
    loc.includes("san juan")
  ) {
    return [
      {
        name: "Robinsons Magnolia Mall & The Garden",
        category: "RETAIL",
        distanceText: "1.1 km",
        travelMinutesText: "4 mins drive",
        badge: "Community Mall",
      },
      {
        name: "St. Luke's Medical Center Quezon City",
        category: "HEALTHCARE",
        distanceText: "2.3 km",
        travelMinutesText: "8 mins drive",
        badge: "Premier Tertiary Hospital",
      },
      {
        name: "Xavier School & ICA Greenhills",
        category: "EDUCATION",
        distanceText: "2.8 km",
        travelMinutesText: "10 mins drive",
        badge: "Prestigious Academies",
      },
      {
        name: "St. Paul University Quezon City",
        category: "EDUCATION",
        distanceText: "850m",
        travelMinutesText: "3 mins drive",
        badge: "Heritage Campus",
      },
      {
        name: "LRT-2 Gilmore Station & Tech Hub",
        category: "TRANSIT",
        distanceText: "700m",
        travelMinutesText: "3 mins walk",
        badge: "Rapid Rail Transit",
      },
    ];
  }

  if (
    loc.includes("nuvali") ||
    loc.includes("santa rosa") ||
    loc.includes("laguna") ||
    loc.includes("alabang")
  ) {
    return [
      {
        name: "Ayala Malls Solenad & Lakeside Promenade",
        category: "RETAIL",
        distanceText: "1.5 km",
        travelMinutesText: "4 mins drive",
        badge: "Al Fresco Dining",
      },
      {
        name: "QualiMed Hospital Nuvali",
        category: "HEALTHCARE",
        distanceText: "1.8 km",
        travelMinutesText: "5 mins drive",
        badge: "Full Service Medical",
      },
      {
        name: "Xavier School Nuvali & Miriam College",
        category: "EDUCATION",
        distanceText: "2.2 km",
        travelMinutesText: "6 mins drive",
        badge: "Top University Feeder",
      },
      {
        name: "CALAX (Cavite-Laguna Expressway) Interchange",
        category: "TRANSIT",
        distanceText: "2.5 km",
        travelMinutesText: "5 mins drive",
        badge: "Direct SLEX Access",
      },
    ];
  }

  if (loc.includes("cebu")) {
    return [
      {
        name: "Ayala Malls Central Bloc & The Walk",
        category: "RETAIL",
        distanceText: "350m",
        travelMinutesText: "2 mins walk",
        badge: "24/7 Lifestyle Hub",
      },
      {
        name: "Cebu Doctors' University Hospital",
        category: "HEALTHCARE",
        distanceText: "3.2 km",
        travelMinutesText: "10 mins drive",
        badge: "University Medical Center",
      },
      {
        name: "University of the Philippines Cebu",
        category: "EDUCATION",
        distanceText: "1.9 km",
        travelMinutesText: "6 mins drive",
        badge: "National University",
      },
      {
        name: "Mactan-Cebu International Airport (MCIA)",
        category: "TRANSIT",
        distanceText: "12.5 km",
        travelMinutesText: "25 mins drive",
        badge: "International Gateway",
      },
    ];
  }

  // Default Metro Manila vicinities
  return [
    {
      name: "Premier Commercial & Lifestyle Mall",
      category: "RETAIL",
      distanceText: "1.2 km",
      travelMinutesText: "5 mins drive",
      badge: "Shopping & Dining",
    },
    {
      name: "Tertiary Hospital & Medical Center",
      category: "HEALTHCARE",
      distanceText: "2.0 km",
      travelMinutesText: "7 mins drive",
      badge: "Emergency & Specialty Care",
    },
    {
      name: "Accredited International School",
      category: "EDUCATION",
      distanceText: "1.8 km",
      travelMinutesText: "6 mins drive",
      badge: "K-12 Education",
    },
    {
      name: "Expressway Interchange & Transit Station",
      category: "TRANSIT",
      distanceText: "1.5 km",
      travelMinutesText: "5 mins drive",
      badge: "Citywide Access",
    },
  ];
}

