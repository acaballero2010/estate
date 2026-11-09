"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bath,
  BedDouble,
  Building2,
  Calculator,
  CalendarCheck,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  Film,
  Globe2,
  GraduationCap,
  HeartPulse,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Navigation,
  Pencil,
  Phone,
  PlayCircle,
  RotateCcw,
  Ruler,
  Activity,
  BarChart3,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Info,
  Presentation,
  Ticket,
  Train,
  TrendingUp,
  Trophy,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Property } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  convertFromPhp,
  CURRENCY_CONFIGS,
  formatCompactCurrency,
  formatCurrency,
  normalizePhoneForWhatsApp,
  normalizePhoneForTel,
  type SupportedCurrency,
} from "@/lib/utils";
import {
  getSafePropertyImageUrl,
  handleImageFallbackError,
} from "@/lib/property-images";
import { PanoramaViewer } from "@/components/showcase/panorama-viewer";
import {
  calculatePropertyInvestmentYield,
  getPropertyVicinityLandmarks,
} from "@/lib/showcase-utils";
import {
  recordShowcaseEvent,
  loadShowcaseAnalytics,
  type ShowcaseAnalyticsSummary,
} from "@/lib/showcase-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialShareCardModal } from "@/components/marketing/social-share-card-modal";
import { EditPropertyModal } from "@/components/properties/edit-property-modal";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface RoomHotspot {
  id: string;
  name: string;
  category: "LIVING" | "BEDROOM" | "KITCHEN" | "BATHROOM" | "OUTDOOR";
  dimensions: string;
  areaSqm: number;
  description: string;
  features: string[];
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  photoIndex: number;
}

function getRoomIcon(category: RoomHotspot["category"]) {
  switch (category) {
    case "BEDROOM":
      return <BedDouble className="h-3.5 w-3.5" />;
    case "BATHROOM":
      return <Bath className="h-3.5 w-3.5" />;
    case "KITCHEN":
      return <Utensils className="h-3.5 w-3.5" />;
    case "OUTDOOR":
      return <Compass className="h-3.5 w-3.5" />;
    case "LIVING":
    default:
      return <Home className="h-3.5 w-3.5" />;
  }
}

function getLandmarkCategoryIcon(category: string) {
  switch (category) {
    case "RETAIL":
      return <ShoppingBag className="h-4 w-4 text-amber-500 shrink-0" />;
    case "HEALTHCARE":
      return <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />;
    case "EDUCATION":
      return <GraduationCap className="h-4 w-4 text-blue-500 shrink-0" />;
    case "TRANSIT":
      return <Train className="h-4 w-4 text-emerald-500 shrink-0" />;
    default:
      return <MapPin className="h-4 w-4 text-primary shrink-0" />;
  }
}

function getPropertyHotspots(property: Property): RoomHotspot[] {
  const totalArea = property.floorAreaSqm || 60;
  const isMultiBed = (property.bedrooms || 1) >= 2;
  const isCondo = property.propertyType === "CONDOMINIUM";

  const livingArea = +(totalArea * 0.35).toFixed(1);
  const masterArea = +(totalArea * (isMultiBed ? 0.28 : 0.4)).toFixed(1);
  const kitchenArea = +(totalArea * 0.15).toFixed(1);
  const bathArea = +(totalArea * 0.1).toFixed(1);
  const balconyArea = +(totalArea * 0.12).toFixed(1);

  const hotspots: RoomHotspot[] = [
    {
      id: "living",
      name: "Living & Dining Lounge",
      category: "LIVING",
      dimensions: `${(Math.sqrt(livingArea) * 1.1).toFixed(1)}m × ${(
        Math.sqrt(livingArea) * 0.9
      ).toFixed(1)}m`,
      areaSqm: livingArea,
      description:
        "Sunlit open-concept living area with floor-to-ceiling panoramic glass panels and direct balcony access.",
      features: [
        "Imported porcelain tile flooring",
        "Recessed LED cove illumination",
        "Multi-split inverter AC readiness",
        "High 2.9m finished ceiling",
      ],
      x: 37.5,
      y: 35,
      photoIndex: 0,
    },
    {
      id: "master",
      name: "Master Bedroom Suite",
      category: "BEDROOM",
      dimensions: `${(Math.sqrt(masterArea) * 1.05).toFixed(1)}m × ${(
        Math.sqrt(masterArea) * 0.95
      ).toFixed(1)}m`,
      areaSqm: masterArea,
      description:
        "Spacious master haven configured for King bed layout, acoustic double-pane glazing, and private bath access.",
      features: [
        "Laminated wood plank flooring",
        "Walk-in wardrobe recess",
        "Dedicated reading nook",
        "USB-C bedside power conduits",
      ],
      x: 82,
      y: 35,
      photoIndex: 1 < (property.galleryImages?.length || 0) ? 1 : 0,
    },
    {
      id: "kitchen",
      name: "Gourmet Chef Kitchen",
      category: "KITCHEN",
      dimensions: `${(Math.sqrt(kitchenArea) * 1.2).toFixed(1)}m × ${(
        Math.sqrt(kitchenArea) * 0.8
      ).toFixed(1)}m`,
      areaSqm: kitchenArea,
      description:
        "Ergonomic modular culinary kitchen with engineered quartz countertops, soft-close cabinets, and ventilation ducting.",
      features: [
        "Engineered quartz splashback & counter",
        "Under-cabinet task lighting",
        "Stainless steel undermount sink",
        "Induction range-hood provision",
      ],
      x: 37.5,
      y: 77,
      photoIndex: 2 < (property.galleryImages?.length || 0) ? 2 : 0,
    },
    {
      id: "bath",
      name: "Master En-Suite Bathroom",
      category: "BATHROOM",
      dimensions: `${(Math.sqrt(bathArea) * 1.1).toFixed(1)}m × ${(
        Math.sqrt(bathArea) * 0.9
      ).toFixed(1)}m`,
      areaSqm: bathArea,
      description:
        "Spa-grade sanctuary featuring frameless tempered glass shower enclosure and German sanitary ware.",
      features: [
        "Grohe / Kohler rain-shower system",
        "Dual-flush eco-sanitary water closet",
        "Large vanity mirror with defogger",
        "Anti-slip ceramic floor tiles",
      ],
      x: 66,
      y: 22,
      photoIndex: 0,
    },
    {
      id: "balcony",
      name: isCondo ? "Skyline Lanai Balcony" : "Garden Porch & Lanai",
      category: "OUTDOOR",
      dimensions: `${(Math.sqrt(balconyArea) * 1.5).toFixed(1)}m × ${(
        Math.sqrt(balconyArea) * 0.65
      ).toFixed(1)}m`,
      areaSqm: balconyArea,
      description:
        "Outdoor viewing deck providing uninterrupted views, fresh breeze, and morning sun exposure.",
      features: [
        "Tempered glass safety balustrade",
        "Weather-resistant terracotta paving",
        "Waterproof outdoor electrical outlet",
        "Vertical planter wall ready",
      ],
      x: 12.5,
      y: 52,
      photoIndex: 0,
    },
  ];

  if (isMultiBed) {
    const bed2Area = +(totalArea * 0.18).toFixed(1);
    hotspots.push({
      id: "bed2",
      name: "Bedroom 2 / Study Room",
      category: "BEDROOM",
      dimensions: `${(Math.sqrt(bed2Area) * 1.05).toFixed(1)}m × ${(
        Math.sqrt(bed2Area) * 0.95
      ).toFixed(1)}m`,
      areaSqm: bed2Area,
      description:
        "Versatile secondary bedroom suitable for queen bed, children's nursery, or hybrid work-from-home executive study.",
      features: [
        "Built-in closet system",
        "Corner casement window",
        "High-speed Cat6 ethernet port",
        "Dimmable warm lighting",
      ],
      x: 75,
      y: 74,
      photoIndex: 1 < (property.galleryImages?.length || 0) ? 1 : 0,
    });
  }

  return hotspots;
}

function ShowcaseStorefrontContent() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId");
  const viewParam = searchParams.get("view");
  const isDemoMode = searchParams.get("demo") === "true";
  const { properties, addLead, updateProperty, messengerSettings } = useCrmStore();
  const { user, agentProfile } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // If view=client is in query, or if no agent user is authenticated, render in Client View
  const isClientView = isMounted
    ? viewParam === "client" || (!user && !agentProfile)
    : true;

  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [turnoverFilter, setTurnoverFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [sortOption, setSortOption] = React.useState<string>("FEATURED");
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>("PHP");
  const [hasCopiedShowcaseLink, setHasCopiedShowcaseLink] = React.useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = React.useState(false);
  const [isCredibilityModalOpen, setIsCredibilityModalOpen] = React.useState(false);
  const [analyticsSummary, setAnalyticsSummary] =
    React.useState<ShowcaseAnalyticsSummary | null>(null);

  // Track page view for prospective buyers & load analytics for agent
  React.useEffect(() => {
    if (isClientView) {
      void recordShowcaseEvent({
        eventType: "PAGE_VIEW",
        agentUid: agentProfile?.uid,
      });
    } else {
      void loadShowcaseAnalytics(agentProfile?.uid || "demo-agent-marco").then(
        setAnalyticsSummary
      );
    }
  }, [isClientView, agentProfile]);

  // VIP Brochure & Showroom Pass Inquiry Modal State
  const [inquiryProperty, setInquiryProperty] = React.useState<Property | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = React.useState(false);
  const [inquiryFirstName, setInquiryFirstName] = React.useState("");
  const [inquiryLastName, setInquiryLastName] = React.useState("");
  const [inquiryEmail, setInquiryEmail] = React.useState("");
  const [inquiryPhone, setInquiryPhone] = React.useState("");
  const [inquiryIntent, setInquiryIntent] = React.useState("INVESTMENT_3_6M");
  const [inquiryFinancing, setInquiryFinancing] = React.useState<
    "BANK" | "SPOT_CASH" | "PAG_IBIG" | "IN_HOUSE"
  >("BANK");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = React.useState(false);
  const [registeredLeadId, setRegisteredLeadId] = React.useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] =
    React.useState<Property | null>(() => {
      if (initialPropertyId) {
        return properties.find((p) => p.id === initialPropertyId) ?? null;
      }
      return null;
    });
  const [selectedSocialProperty, setSelectedSocialProperty] =
    React.useState<Property | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = React.useState(false);
  const [editingProperty, setEditingProperty] = React.useState<Property | null>(null);

  // Keep selectedProperty in sync with store updates (e.g. after editing)
  React.useEffect(() => {
    if (selectedProperty) {
      const refreshed = properties.find((p) => p.id === selectedProperty.id);
      if (refreshed && refreshed !== selectedProperty) {
        setSelectedProperty(refreshed);
      }
    }
  }, [properties, selectedProperty]);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<string>("photos");
  const [selectedHotspotId, setSelectedHotspotId] =
    React.useState<string>("living");

  const hotspots = React.useMemo(() => {
    return selectedProperty ? getPropertyHotspots(selectedProperty) : [];
  }, [selectedProperty]);

  const activeHotspot = React.useMemo(() => {
    return hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];
  }, [hotspots, selectedHotspotId]);

  React.useEffect(() => {
    if (initialPropertyId) {
      const matched = properties.find((p) => p.id === initialPropertyId);
      if (matched) {
        setSelectedProperty(matched);
        setActivePhotoIndex(0);
        setActiveTab("photos");
        setSelectedHotspotId("living");
      }
    }
  }, [initialPropertyId, properties]);

  const filteredProperties = React.useMemo(() => {
    return properties
      .filter((p) => {
        // Category filter
        if (categoryFilter !== "ALL" && p.propertyType !== categoryFilter) {
          return false;
        }

        // Turnover status filter
        const turnover = (p.turnoverDate || "").toLowerCase();
        if (turnoverFilter === "RFO") {
          const isRfo = turnover.includes("rfo") || turnover.includes("ready");
          if (!isRfo) return false;
        } else if (turnoverFilter === "PRE_SELLING") {
          const isPreSelling = turnover.includes("pre-selling") || turnover.includes("202");
          if (!isPreSelling) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            p.projectName.toLowerCase().includes(q) ||
            p.developerName.toLowerCase().includes(q) ||
            p.unitCode.toLowerCase().includes(q) ||
            p.locationCity.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === "PRICE_ASC") return a.listPrice - b.listPrice;
        if (sortOption === "PRICE_DESC") return b.listPrice - a.listPrice;
        if (sortOption === "AREA_DESC") return b.floorAreaSqm - a.floorAreaSqm;
        return 0; // Default order
      });
  }, [properties, categoryFilter, turnoverFilter, searchQuery, sortOption]);

  const handleOpenTourModal = (prop: Property) => {
    setSelectedProperty(prop);
    setActivePhotoIndex(0);
    setActiveTab("photos");
    setSelectedHotspotId("living");

    void recordShowcaseEvent({
      eventType: "PROPERTY_CLICK",
      propertyId: prop.id,
      projectName: prop.projectName,
      unitCode: prop.unitCode,
      agentUid: agentProfile?.uid,
    });
  };

  const handleOpenPanoramaModal = (prop: Property) => {
    setSelectedProperty(prop);
    setActivePhotoIndex(0);
    setActiveTab("panorama");
    setSelectedHotspotId("living");

    void recordShowcaseEvent({
      eventType: "PANORAMA_360_VIEW",
      propertyId: prop.id,
      projectName: prop.projectName,
      unitCode: prop.unitCode,
      agentUid: agentProfile?.uid,
    });
  };

  const handleCopyShowcaseLink = (propId?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://propflow.ph";
    const url = propId
      ? `${origin}/showcase?propertyId=${propId}&view=client`
      : `${origin}/showcase?view=client`;
    navigator.clipboard.writeText(url);
    setHasCopiedShowcaseLink(true);
    toast.success("Client showcase link copied! Prospective buyers will open this clean buyer storefront.");
    setTimeout(() => setHasCopiedShowcaseLink(false), 2500);
  };

  const handleOpenInquiryModal = (prop: Property, defaultIntent?: string) => {
    setInquiryProperty(prop);
    if (defaultIntent) setInquiryIntent(defaultIntent);
    setRegisteredLeadId(null);
    setIsInquiryModalOpen(true);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProperty) return;

    if (!inquiryFirstName.trim() || !inquiryLastName.trim() || !inquiryPhone.trim()) {
      toast.error("Please fill in your name and contact number.");
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const intentLabelMap: Record<string, string> = {
        INVESTMENT_3_6M: "Investment within 3-6 months",
        IMMEDIATE_RFO: "Immediate Move-in (RFO)",
        RETIREMENT_FAMILY: "Primary residence / Family",
        OFW_OVERSEAS: "Overseas / OFW Portfolio",
      };

      const newLead = addLead({
        firstName: inquiryFirstName.trim(),
        lastName: inquiryLastName.trim(),
        email: inquiryEmail.trim() || undefined,
        phone: inquiryPhone.trim(),
        source: "PORTAL_INQUIRY",
        priority: "HOT",
        stage: "NEW_LEAD",
        budgetMin: inquiryProperty.listPrice * 0.85,
        budgetMax: inquiryProperty.listPrice * 1.15,
        preferredLocations: [inquiryProperty.locationCity],
        preferredPropertyTypes: [inquiryProperty.propertyType],
        financingPreference: inquiryFinancing,
        notes: `Inquired via Showcase Storefront for ${inquiryProperty.projectName} (${inquiryProperty.unitCode}) - ${inquiryProperty.developerName}. Requested VIP Pass & E-Brochure. Buying Intent: ${intentLabelMap[inquiryIntent] || inquiryIntent}.`,
      });

      setRegisteredLeadId(newLead.id);

      void recordShowcaseEvent({
        eventType: "VIP_PASS_REQUEST",
        propertyId: inquiryProperty.id,
        projectName: inquiryProperty.projectName,
        unitCode: inquiryProperty.unitCode,
        agentUid: agentProfile?.uid,
      });

      toast.success(
        `VIP Pass confirmed for ${inquiryProperty.projectName}! Your consultant will contact you via WhatsApp.`
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not register inquiry. Please try again.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. AGENT CONTROL BAR (Rendered ONLY when agent is logged in AND not explicitly in client preview) */}
      {isMounted && !isClientView && user && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b bg-slate-950 px-4 py-2 text-white shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] bg-emerald-500/10 font-semibold gap-1">
              <Presentation className="h-3 w-3" /> Sales Presentation Mode
            </Badge>
            <span className="text-slate-300 text-xs hidden sm:inline">
              Branded as: <strong>{agentProfile?.fullName || user.email}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs text-slate-200 border-white/20 bg-white/5 hover:bg-white/15 gap-1.5"
              onClick={() => setIsAnalyticsModalOpen(true)}
            >
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{analyticsSummary?.totalPageViews || 24} Views</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs text-slate-200 border-white/20 bg-white/5 hover:bg-white/15"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", "client");
                window.location.href = url.toString();
              }}
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-primary" />
              Preview Client View
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              onClick={() => handleCopyShowcaseLink()}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Showcase to Client</span>
            </Button>
            <Link
              href="/dashboard"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 ml-2 font-medium"
            >
              <span>Back to CRM</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. PUBLIC LUXURY SITE HEADER (Unified across Landing, Showcase, and Tools) */}
      <SiteHeader />

      {/* Interactive Showroom Demo Banner for SaaS Prospects */}
      {isMounted && (!user || isDemoMode) && (
        <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs text-center flex flex-wrap items-center justify-center gap-2 text-primary font-medium print:hidden">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Interactive Showroom Demo: This is the verified digital showroom experience your prospective buyers and OFW investors receive.</span>
          <Link href="/login" className="underline font-semibold hover:text-primary/80">
            Sign up as an Agent to create your branded showroom →
          </Link>
        </div>
      )}

      {/* Verified Consultant Credibility Bar */}
      {isMounted && agentProfile?.fullName && (
        <div className="border-b border-border/40 bg-muted/30 px-4 py-2">
          <div className="container flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsCredibilityModalOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-[11px] font-semibold"
              title="Click to view verified regulatory credentials"
            >
              {agentProfile.avatarUrl ? (
                <img
                  src={agentProfile.avatarUrl}
                  alt={agentProfile.fullName || "Agent"}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Accredited Consultant: {agentProfile.fullName}</span>
              {agentProfile.prcLicenseNumber && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({agentProfile.prcLicenseNumber})
                </span>
              )}
              <span className="text-[10px] underline opacity-80 ml-1">View Credentials</span>
            </button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                <Link href="/inquire">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Book Site Tripping</span>
                </Link>
              </Button>
              {user && isClientView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("view");
                    window.location.href = url.toString();
                  }}
                >
                  Exit Client View
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container space-y-6 py-6 flex-1">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-secondary/40 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="new" className="gap-1.5 text-xs">
                  <Film className="h-3.5 w-3.5" /> Interactive Property Showcase &amp; Virtual Tours
                </Badge>
                <Badge variant="outline" className="text-xs bg-background/80 font-mono">
                  {filteredProperties.length} Units Available
                </Badge>
              </div>
              <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
                Explore Model Units, Architectural Photos &amp; Video Walkthroughs
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Tour our accredited Condominiums, Executive Villages, and Townhomes in high-definition. Inspect interactive room hotspots, watch walkthrough videos, and simulate instant monthly equity computations.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              {!isClientView ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-background shadow-sm hover:border-primary"
                  onClick={() => handleCopyShowcaseLink()}
                >
                  {hasCopiedShowcaseLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-primary" />
                      <span>Share Showcase to Client</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-sm"
                  asChild
                >
                  <Link href="/inquire">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>Book Site Tripping</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

        {/* Currency Switcher for Overseas & OFW Buyers */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Display Currency:</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Indicative conversion for OFWs and international investors
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {(Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]).map((curr) => {
              const conf = CURRENCY_CONFIGS[curr];
              const isSelected = selectedCurrency === curr;
              return (
                <Button
                  key={curr}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setSelectedCurrency(curr)}
                >
                  <span>{conf.flag}</span>
                  <span className="font-semibold">{conf.code}</span>
                  {curr !== "PHP" && (
                    <span className="text-[10px] opacity-75 hidden md:inline">
                      (≈ ₱{conf.phpRate})
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          {/* Keyword Search */}
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by estate, developer, city, or unit..."
              className="h-8 pl-8 pr-8 text-xs bg-background shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none"
            >
              <option value="ALL">All Property Categories</option>
              <option value="CONDOMINIUM">Condominiums</option>
              <option value="HOUSE_AND_LOT">House &amp; Lot</option>
              <option value="TOWNHOUSE">Townhomes</option>
              <option value="RESIDENTIAL_LOT">Residential Lots</option>
              <option value="COMMERCIAL_UNIT">Commercial Units</option>
            </select>
          </div>

          {/* Turnover Status */}
          <div className="sm:col-span-2">
            <select
              value={turnoverFilter}
              onChange={(e) => setTurnoverFilter(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none"
            >
              <option value="ALL">All Turnover Dates</option>
              <option value="RFO">Ready for Occupancy (RFO)</option>
              <option value="PRE_SELLING">Pre-selling</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="sm:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm focus:outline-none"
            >
              <option value="FEATURED">Featured Developments</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="AREA_DESC">Floor Area: Largest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verified Consultant Credibility Banner */}
      {isMounted && agentProfile && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md bg-muted">
                  {agentProfile.avatarUrl ? (
                    <img
                      src={agentProfile.avatarUrl}
                      alt={agentProfile.fullName || "Agent"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg font-serif">
                      {agentProfile.fullName?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
                {agentProfile.licensingBodyLogoUrl && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border shadow p-0.5 overflow-hidden">
                    <img
                      src={agentProfile.licensingBodyLogoUrl}
                      alt="Licensing Seal"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-1.5">
                    {agentProfile.fullName}
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  </h3>
                  <Badge variant="won" className="text-[10px] py-0.5 px-2 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    PRC &amp; DHSUD Accredited
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {agentProfile.bioHeadline || `${agentProfile.agencyName || "PropFlow Luxury Real Estate"} • Real Estate Broker`}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-mono">
                  {agentProfile.prcLicenseNumber && (
                    <span>{agentProfile.prcLicenseNumber}</span>
                  )}
                  {agentProfile.dhsudRegistrationNo && (
                    <span>• {agentProfile.dhsudRegistrationNo}</span>
                  )}
                  {agentProfile.boardAffiliation && (
                    <span className="hidden sm:inline">• {agentProfile.boardAffiliation}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setIsCredibilityModalOpen(true)}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>View Credentials</span>
              </Button>
              {agentProfile.phone && (
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  asChild
                >
                  <a
                    href={`https://wa.me/${agentProfile.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${agentProfile.fullName}, I'm browsing your property showcase catalog.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </Button>
              )}
            </div>
          </div>

          {agentProfile.awards && agentProfile.awards.length > 0 && (
            <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground mr-1 uppercase tracking-wider">
                Accolades &amp; Badges:
              </span>
              {agentProfile.awards.map((award, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20"
                >
                  <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                  {award}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Storefront Media Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProperties.length === 0 ? (
          <div className="col-span-1 md:col-span-2 rounded-2xl border border-dashed p-12 text-center bg-muted/10">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-3 text-base font-bold">No property developments found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search keywords, turnover status, or category filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("ALL");
                setTurnoverFilter("ALL");
                setSortOption("FEATURED");
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const heroImage = getSafePropertyImageUrl(
              prop.thumbnailUrl || prop.galleryImages?.[0],
              prop.propertyType
            );
            const photoCount = prop.galleryImages?.length || 1;
            const hasVideo = Boolean(prop.videoWalkthroughUrl);
            const estMonthlyDp24 =
              (prop.listPrice * 0.2 - prop.reservationFee) / 24;
            const yieldInfo = calculatePropertyInvestmentYield(prop);

            const displayPrice =
              selectedCurrency === "PHP"
                ? formatCompactCurrency(prop.listPrice)
                : formatCurrency(
                    convertFromPhp(prop.listPrice, selectedCurrency),
                    selectedCurrency,
                    0
                  );

            const displayEquity =
              selectedCurrency === "PHP"
                ? `${formatCurrency(estMonthlyDp24, "PHP", 0)}/mo`
                : `${formatCurrency(
                    convertFromPhp(estMonthlyDp24, selectedCurrency),
                    selectedCurrency,
                    0
                  )}/mo`;

            return (
              <Card
                key={prop.id}
                className="group overflow-hidden flex flex-col justify-between border shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  {/* Hero Cover Image with Media Badges */}
                  <div
                    className="relative h-56 w-full overflow-hidden bg-muted cursor-pointer"
                    onClick={() => handleOpenTourModal(prop)}
                  >
                    <img
                      src={heroImage}
                      alt={prop.projectName}
                      onError={(e) => handleImageFallbackError(e, prop.propertyType)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                      <Badge
                        variant={
                          prop.status === "AVAILABLE" ? "won" : "reservation"
                        }
                        className="text-[10px] shadow"
                      >
                        {prop.status} • {prop.turnoverDate}
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                          <ImageIcon className="h-3 w-3" /> {photoCount} Photos
                        </span>
                        {hasVideo && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-1 text-[10px] font-semibold text-primary-foreground shadow">
                            <Film className="h-3 w-3" /> Video Tour
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Overlay Title & Price */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div className="min-w-0 pr-2">
                        <p className="text-[11px] font-medium text-white/80">
                          {prop.developerName}
                        </p>
                        <h2 className="text-base font-bold leading-tight truncate sm:text-lg">
                          {prop.projectName}
                        </h2>
                        <p className="text-xs text-white/90 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0 text-primary-foreground" />
                          {prop.unitCode} • {prop.locationCity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-white/75 block">
                          List Price
                        </span>
                        <span className="text-base font-bold tabular-nums">
                          {displayPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Specs Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Maximize2 className="h-3.5 w-3.5 text-primary" />
                          {prop.floorAreaSqm} sqm
                        </span>
                        {prop.lotAreaSqm > 0 && (
                          <span>• {prop.lotAreaSqm} sqm Lot</span>
                        )}
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-foreground" />
                          {prop.bedrooms} BR
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5 text-foreground" />
                          {prop.bathrooms} T&amp;B
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="h-3.5 w-3.5 text-foreground" />
                          {prop.parkingSlots} Park
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-primary tabular-nums">
                        Est. Equity: {displayEquity}
                      </span>
                    </div>

                    {/* Rental Yield & Investment ROI Indicator */}
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs border border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-950 dark:text-emerald-300">
                          Gross Yield: {yieldInfo.grossRentalYieldPercent}% / yr
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        ≈ {formatCurrency(yieldInfo.monthlyRentEstimated, "PHP", 0)}/mo rent
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {prop.description ||
                        `Prime ${prop.propertyType.toLowerCase()} residence located at ${prop.address}. Available for flexible Bank, Pag-IBIG, or In-House financing.`}
                    </p>

                    {/* Amenity Chips */}
                    {prop.amenities && prop.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {prop.amenities.slice(0, 4).map((amenity) => (
                          <Badge
                            key={amenity}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="flex flex-col gap-2 border-t bg-muted/20 p-2.5">
                  {/* Top Tier: Virtual Experience & Share */}
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[10px] px-1 gap-1"
                      onClick={() => handleOpenTourModal(prop)}
                    >
                      <PlayCircle className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">Media Tour</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[10px] px-1 gap-1"
                      onClick={() => handleOpenPanoramaModal(prop)}
                    >
                      <RotateCcw className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">360° Tour</span>
                    </Button>
                    {!isClientView ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[10px] px-1 gap-1 text-primary hover:text-primary"
                        onClick={() => {
                          setSelectedSocialProperty(prop);
                          setIsSocialModalOpen(true);
                        }}
                      >
                        <Share2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">Social Card</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[10px] px-1 gap-1"
                        onClick={() => handleOpenTourModal(prop)}
                      >
                        <ImageIcon className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">Photos</span>
                      </Button>
                    )}
                  </div>

                  {/* Bottom Tier: Direct Conversion */}
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] gap-1 border-primary/40 text-foreground hover:bg-primary/5 hover:border-primary font-medium"
                      onClick={() => handleOpenInquiryModal(prop)}
                    >
                      <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">VIP Pass &amp; Brochure</span>
                    </Button>
                    {!isClientView ? (
                      <Button
                        size="sm"
                        className="w-full text-[11px] gap-1 font-medium"
                        asChild
                      >
                        <Link href={`/quotations?propertyId=${prop.id}`}>
                          <Calculator className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Compute Quote</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full text-[11px] gap-1 font-medium bg-primary text-primary-foreground"
                        onClick={() => handleOpenInquiryModal(prop, "INVESTMENT_3_6M")}
                      >
                        <Calculator className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Request Quote</span>
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Interactive Lightbox Modal: Photos Gallery + Floor Plan Hotspots + Video Walkthrough */}
      <Dialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      >
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {selectedProperty && (
            <div className="space-y-4 p-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="new" className="text-[10px]">
                      {selectedProperty.developerName}
                    </Badge>
                    {!isClientView && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] gap-1 px-2 border-primary/40 text-primary hover:bg-primary/10"
                        onClick={() => setEditingProperty(selectedProperty)}
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit Media &amp; Specs</span>
                      </Button>
                    )}
                  </div>
                  <span className="text-base font-serif font-normal text-primary tabular-nums">
                    {formatCurrency(selectedProperty.listPrice, "PHP", 0)}
                  </span>
                </div>
                <DialogTitle className="text-xl font-serif font-normal tracking-tight">
                  {selectedProperty.projectName} — {selectedProperty.unitCode}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedProperty.address} ({selectedProperty.turnoverDate})
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-9">
                  <TabsTrigger value="photos" className="text-xs gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Photos (</span>
                    <span>{selectedProperty.galleryImages?.length || 1}</span>
                    <span className="hidden sm:inline">)</span>
                  </TabsTrigger>
                  <TabsTrigger value="floorplan" className="text-xs gap-1">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    <span>Floor Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="panorama" className="text-xs gap-1">
                    <RotateCcw className="h-3.5 w-3.5 text-primary" />
                    <span>360° Tour</span>
                  </TabsTrigger>
                  <TabsTrigger value="vicinity" className="text-xs gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>Vicinity</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs gap-1">
                    <Film className="h-3.5 w-3.5" />
                    <span>Video</span>
                  </TabsTrigger>
                </TabsList>

                {/* PHOTO GALLERY TAB */}
                <TabsContent value="photos" className="mt-3 space-y-3">
                  <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-xl border bg-black">
                    <img
                      src={getSafePropertyImageUrl(
                        selectedProperty.galleryImages?.[activePhotoIndex] ||
                          selectedProperty.thumbnailUrl,
                        selectedProperty.propertyType
                      )}
                      alt={`${selectedProperty.projectName} view ${
                        activePhotoIndex + 1
                      }`}
                      onError={(e) =>
                        handleImageFallbackError(e, selectedProperty.propertyType)
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Thumbnails Strip */}
                  {selectedProperty.galleryImages &&
                    selectedProperty.galleryImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedProperty.galleryImages.map((imgUrl, idx) => (
                          <button
                            key={imgUrl}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                              activePhotoIndex === idx
                                ? "border-primary ring-2 ring-primary/40"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={getSafePropertyImageUrl(
                                imgUrl,
                                selectedProperty.propertyType
                              )}
                              alt="Thumbnail"
                              onError={(e) =>
                                handleImageFallbackError(
                                  e,
                                  selectedProperty.propertyType
                                )
                              }
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                </TabsContent>

                {/* INTERACTIVE FLOOR PLAN HOTSPOTS TAB */}
                <TabsContent value="floorplan" className="mt-3 space-y-3">
                  {/* Floor Area & Dimension Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold">Architectural Layout:</span>
                      <span className="text-muted-foreground">
                        {selectedProperty.floorAreaSqm} m² Total Floor Area
                      </span>
                      <span className="text-muted-foreground hidden sm:inline">·</span>
                      <span className="text-muted-foreground hidden sm:inline">
                        {selectedProperty.bedrooms} Bed · {selectedProperty.bathrooms} Bath
                      </span>
                    </div>
                    <span className="text-[11px] text-primary font-medium">
                      💡 Click room markers to inspect specifications
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Blueprint SVG Layout Canvas with Hotspots */}
                    <div className="lg:col-span-7 space-y-2">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070b14] shadow-inner select-none">
                        {/* Blueprint SVG vector */}
                        <svg
                          viewBox="0 0 800 520"
                          className="h-full w-full pointer-events-none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs>
                            <pattern
                              id="bpGrid"
                              width="20"
                              height="20"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M 20 0 L 0 0 0 20"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="0.5"
                                strokeOpacity="0.35"
                              />
                            </pattern>
                          </defs>
                          <rect width="800" height="520" fill="#070b14" />
                          <rect width="800" height="520" fill="url(#bpGrid)" />

                          {/* Outer perimeter wall */}
                          <rect
                            x="60"
                            y="50"
                            width="680"
                            height="420"
                            rx="4"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                            strokeOpacity="0.85"
                          />

                          {/* Balcony */}
                          <rect
                            x="60"
                            y="140"
                            width="80"
                            height="240"
                            fill="#0369a1"
                            fillOpacity="0.15"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                          />
                          <text
                            x="100"
                            y="260"
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="10"
                            fontWeight="700"
                            letterSpacing="1.5"
                          >
                            LANAI
                          </text>

                          {/* Living & Dining Area */}
                          <rect
                            x="140"
                            y="50"
                            width="320"
                            height="270"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="300"
                            y="180"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="12"
                            fontWeight="700"
                            letterSpacing="1.2"
                          >
                            LIVING &amp; DINING
                          </text>

                          {/* Gourmet Kitchen */}
                          <rect
                            x="140"
                            y="320"
                            width="320"
                            height="150"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="300"
                            y="400"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="11"
                            fontWeight="700"
                            letterSpacing="1.2"
                          >
                            KITCHEN
                          </text>

                          {/* En-Suite Bath */}
                          <rect
                            x="460"
                            y="50"
                            width="140"
                            height="130"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="530"
                            y="120"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="10"
                            fontWeight="600"
                          >
                            BATH
                          </text>

                          {/* Master Suite */}
                          <rect
                            x="600"
                            y="50"
                            width="140"
                            height="230"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <rect
                            x="460"
                            y="180"
                            width="140"
                            height="100"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="600"
                            y="210"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="12"
                            fontWeight="700"
                            letterSpacing="1.2"
                          >
                            MASTER SUITE
                          </text>

                          {/* Bedroom 2 / Study */}
                          <rect
                            x="460"
                            y="280"
                            width="280"
                            height="190"
                            fill="#1e293b"
                            fillOpacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="600"
                            y="380"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="11"
                            fontWeight="700"
                            letterSpacing="1.2"
                          >
                            {selectedProperty.bedrooms > 1
                              ? "BEDROOM 2"
                              : "FLEX STUDY"}
                          </text>

                          {/* Architectural Doors & Swings */}
                          <path
                            d="M 140 180 A 40 40 0 0 1 180 140"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <path
                            d="M 460 220 A 40 40 0 0 1 500 180"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <path
                            d="M 460 320 A 40 40 0 0 1 500 360"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />

                          {/* Dimensions & Compass */}
                          <line
                            x1="60"
                            y1="36"
                            x2="740"
                            y2="36"
                            stroke="#38bdf8"
                            strokeWidth="0.8"
                            strokeOpacity="0.7"
                          />
                          <text
                            x="400"
                            y="30"
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="9"
                            fontWeight="600"
                          >
                            Unit Span: 12.4m
                          </text>

                          {/* Compass North Arrow */}
                          <g transform="translate(715, 75)">
                            <circle
                              cx="0"
                              cy="0"
                              r="14"
                              fill="#0f172a"
                              stroke="#38bdf8"
                              strokeWidth="1"
                            />
                            <polygon
                              points="0,-10 4,2 -4,2"
                              fill="#38bdf8"
                            />
                            <polygon
                              points="0,10 4,2 -4,2"
                              fill="#64748b"
                            />
                            <text
                              x="0"
                              y="-12"
                              textAnchor="middle"
                              fill="#38bdf8"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              N
                            </text>
                          </g>
                        </svg>

                        {/* Interactive Hotspot Pins */}
                        {hotspots.map((spot) => {
                          const isSelected = activeHotspot?.id === spot.id;
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => setSelectedHotspotId(spot.id)}
                              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                              className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 focus:outline-none ${
                                isSelected
                                  ? "scale-110 z-20"
                                  : "scale-95 z-10 hover:scale-105"
                              }`}
                              title={`${spot.name} (${spot.dimensions})`}
                            >
                              {/* Glowing Radar Pulse */}
                              {isSelected && (
                                <span className="absolute -inset-1 rounded-full bg-primary/40 animate-ping" />
                              )}
                              <div
                                className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-lg transition-all ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-black"
                                    : "bg-slate-900/90 text-slate-200 border border-slate-700 hover:border-primary hover:text-white"
                                }`}
                              >
                                {getRoomIcon(spot.category)}
                                <span className="hidden sm:inline whitespace-nowrap">
                                  {spot.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hotspot Room Selector Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {hotspots.map((spot) => (
                          <Button
                            key={spot.id}
                            type="button"
                            size="sm"
                            variant={
                              activeHotspot?.id === spot.id ? "default" : "outline"
                            }
                            className="h-7 text-[11px] gap-1 px-2.5"
                            onClick={() => setSelectedHotspotId(spot.id)}
                          >
                            {getRoomIcon(spot.category)}
                            {spot.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Room Inspector Details Card */}
                    <div className="lg:col-span-5">
                      {activeHotspot && (
                        <div className="flex flex-col justify-between h-full rounded-xl border bg-muted/20 p-4 space-y-3">
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {getRoomIcon(activeHotspot.category)}
                                  <h3 className="text-sm font-bold">
                                    {activeHotspot.name}
                                  </h3>
                                </div>
                                <span className="text-[11px] text-muted-foreground block">
                                  {activeHotspot.dimensions} · {activeHotspot.areaSqm} m² (
                                  {Math.round(
                                    (activeHotspot.areaSqm /
                                      (selectedProperty.floorAreaSqm || 60)) *
                                      100
                                  )}
                                  % of unit)
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0 font-semibold border-primary/50 text-primary"
                              >
                                {activeHotspot.category}
                              </Badge>
                            </div>

                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {activeHotspot.description}
                            </p>

                            {/* Finishes & Provisions Checklist */}
                            <div className="space-y-1.5 rounded-lg border bg-background/60 p-2.5 text-xs">
                              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider block">
                                Architectural Inclusions &amp; Finishes:
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {activeHotspot.features.map((feat) => (
                                  <div
                                    key={feat}
                                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-pipeline-won shrink-0" />
                                    <span>{feat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Room Photo Preview & Gallery Link */}
                          <div className="space-y-2 pt-2 border-t">
                            <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-black">
                              <img
                                src={getSafePropertyImageUrl(
                                  selectedProperty.galleryImages?.[
                                    activeHotspot.photoIndex
                                  ] || selectedProperty.thumbnailUrl,
                                  selectedProperty.propertyType
                                )}
                                alt={activeHotspot.name}
                                onError={(e) =>
                                  handleImageFallbackError(
                                    e,
                                    selectedProperty.propertyType
                                  )
                                }
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white">
                                High-Definition Interior View
                              </span>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="w-full h-8 text-xs gap-1.5 justify-center"
                              onClick={() => {
                                setActivePhotoIndex(activeHotspot.photoIndex);
                                setActiveTab("photos");
                              }}
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-primary" />
                              Inspect in Photo Gallery
                              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 360 PANORAMA TOUR TAB */}
                <TabsContent value="panorama" className="mt-3">
                  <PanoramaViewer propertyName={selectedProperty.projectName} />
                </TabsContent>

                {/* MASTERPLAN VICINITY & LANDMARKS TAB */}
                <TabsContent value="vicinity" className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 px-3.5 py-2.5">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-primary" />
                        Masterplan Vicinity &amp; Proximity Matrix
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Key commercial hubs, lifestyle centers, top healthcare facilities, and transit access points.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${selectedProperty.projectName} ${selectedProperty.address}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 text-primary" />
                        Directions in Google Maps
                      </a>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {getPropertyVicinityLandmarks(selectedProperty).map((lm) => (
                      <div
                        key={lm.name}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 rounded-md bg-muted p-1.5">
                            {getLandmarkCategoryIcon(lm.category)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {lm.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 h-4">
                                {lm.badge}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{lm.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-foreground block">
                            {lm.distanceText}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {lm.travelMinutesText}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* VIDEO WALKTHROUGH TAB */}
                <TabsContent value="video" className="mt-3">
                  {selectedProperty.videoWalkthroughUrl ? (
                    <div className="overflow-hidden rounded-xl border bg-black">
                      <video
                        key={selectedProperty.videoWalkthroughUrl}
                        src={selectedProperty.videoWalkthroughUrl}
                        controls
                        autoPlay
                        className="h-72 sm:h-96 w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                      No video walkthrough URL attached to this unit yet.
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Investment ROI & Yield Metrics */}
              {(() => {
                const yieldMetrics = calculatePropertyInvestmentYield(selectedProperty);
                return (
                  <div className="rounded-xl border bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-xs font-bold text-foreground">
                          Rental Yield &amp; Investment Projections
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                        Prime Investment Asset
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="rounded-lg bg-background/80 p-2 border">
                        <span className="text-[10px] text-muted-foreground block">Gross Rental Yield</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {yieldMetrics.grossRentalYieldPercent}% / yr
                        </span>
                        <span className="text-[9px] text-muted-foreground block">Est. Market Gross Return</span>
                      </div>
                      <div className="rounded-lg bg-background/80 p-2 border">
                        <span className="text-[10px] text-muted-foreground block">Est. Monthly Lease</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatCurrency(yieldMetrics.monthlyRentEstimated, "PHP", 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">₱{yieldMetrics.rentRatePerSqm}/sqm market</span>
                      </div>
                      <div className="rounded-lg bg-background/80 p-2 border">
                        <span className="text-[10px] text-muted-foreground block">Annual Capital Growth</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          +{yieldMetrics.annualAppreciationRatePercent}% / yr
                        </span>
                        <span className="text-[9px] text-muted-foreground block">Historical 5-yr CAGR</span>
                      </div>
                      <div className="rounded-lg bg-background/80 p-2 border">
                        <span className="text-[10px] text-muted-foreground block">Total Projected ROI</span>
                        <span className="text-sm font-bold text-primary tabular-nums">
                          {yieldMetrics.projectedTotalAnnualReturnPercent}% / yr
                        </span>
                        <span className="text-[9px] text-muted-foreground block">Yield + Capital Appreciation</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Details & Amenities */}
              <div className="space-y-2 border-t pt-3 text-xs">
                <p className="leading-relaxed text-muted-foreground">
                  {selectedProperty.description}
                </p>
                {selectedProperty.amenities &&
                  selectedProperty.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedProperty.amenities.map((am) => (
                        <span
                          key={am}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-pipeline-won" />
                          {am}
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              {/* Action Footer */}
              <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-3">
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => handleOpenInquiryModal(selectedProperty)}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Request VIP Showroom Pass
                </Button>
                {!isClientView ? (
                  <>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                      <Link href={`/trippings?propertyId=${selectedProperty.id}`}>
                        <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                        Book Site Viewing
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="text-xs gap-1.5" asChild>
                      <Link href={`/quotations?propertyId=${selectedProperty.id}`}>
                        <Calculator className="h-3.5 w-3.5" />
                        Customize Quotation
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                      <Link href={`/inquire?propertyId=${selectedProperty.id}`}>
                        <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                        Book Site Viewing
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 bg-primary text-primary-foreground"
                      onClick={() => {
                        const target = selectedProperty;
                        setSelectedProperty(null);
                        handleOpenInquiryModal(target, "INVESTMENT_3_6M");
                      }}
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Request Computation
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIP Showroom Pass & Official E-Brochure Modal */}
      <Dialog
        open={isInquiryModalOpen}
        onOpenChange={(open) => {
          setIsInquiryModalOpen(open);
          if (!open) {
            setRegisteredLeadId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          {inquiryProperty && (
            <div className="space-y-4 p-5 sm:p-6">
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-serif font-normal">
                      VIP Showroom Pass &amp; Official E-Brochure
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Priority unit reservation privileges &amp; full developer architectural packet
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {registeredLeadId ? (
                /* Confirmation Card */
                <div className="space-y-4 rounded-xl border bg-muted/10 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>

                  <div className="space-y-1">
                    <Badge variant="won" className="text-[11px] tracking-wide uppercase px-2 py-0.5">
                      VIP Pass Confirmed
                    </Badge>
                    <h3 className="text-base font-bold text-foreground">
                      Pass #{registeredLeadId.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Thank you, <strong className="text-foreground">{inquiryFirstName} {inquiryLastName}</strong>. Your inquiry has been securely registered in the CRM under <strong className="text-foreground">PORTAL_INQUIRY</strong>.
                    </p>
                  </div>

                  <div className="rounded-lg border bg-background p-3 text-left space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Development:</span>
                      <span className="font-semibold">{inquiryProperty.projectName} ({inquiryProperty.unitCode})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Developer:</span>
                      <span>{inquiryProperty.developerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">List Price:</span>
                      <span className="font-semibold text-primary">{formatCurrency(inquiryProperty.listPrice, "PHP", 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="text-emerald-600 font-medium">Digital brochure sent to {inquiryPhone}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {!isClientView ? (
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        asChild
                      >
                        <Link href={`/quotations?propertyId=${inquiryProperty.id}`}>
                          <Calculator className="h-3.5 w-3.5" />
                          Simulate Payment Terms &amp; Computation (Agent)
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1.5 bg-primary text-primary-foreground"
                        asChild
                      >
                        <Link href={`/inquire?propertyId=${inquiryProperty.id}`}>
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Schedule Site Viewing Trip
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setIsInquiryModalOpen(false)}
                    >
                      Close Window
                    </Button>
                  </div>
                </div>
              ) : (
                /* Inquiry Registration Form */
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  {/* Property Mini Header */}
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2.5">
                    <img
                      src={getSafePropertyImageUrl(
                        inquiryProperty.thumbnailUrl || inquiryProperty.galleryImages?.[0],
                        inquiryProperty.propertyType
                      )}
                      alt={inquiryProperty.projectName}
                      className="h-12 w-14 rounded-md object-cover border"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate">
                        {inquiryProperty.projectName} — {inquiryProperty.unitCode}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {inquiryProperty.locationCity} • {inquiryProperty.propertyType}
                      </p>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(inquiryProperty.listPrice, "PHP", 0)}
                      </span>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">First Name *</Label>
                      <Input
                        required
                        value={inquiryFirstName}
                        onChange={(e) => setInquiryFirstName(e.target.value)}
                        placeholder="e.g. Maria"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Last Name *</Label>
                      <Input
                        required
                        value={inquiryLastName}
                        onChange={(e) => setInquiryLastName(e.target.value)}
                        placeholder="e.g. Santos"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Mobile (WhatsApp/Viber) *</Label>
                      <Input
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="maria@example.com"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Buying Timeline</Label>
                      <select
                        value={inquiryIntent}
                        onChange={(e) => setInquiryIntent(e.target.value)}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                      >
                        <option value="INVESTMENT_3_6M">Investment (3-6 Months)</option>
                        <option value="IMMEDIATE_RFO">Immediate Move-in (RFO)</option>
                        <option value="RETIREMENT_FAMILY">Primary Family Home</option>
                        <option value="OFW_OVERSEAS">Overseas OFW Portfolio</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Preferred Financing</Label>
                      <select
                        value={inquiryFinancing}
                        onChange={(e) =>
                          setInquiryFinancing(
                            e.target.value as
                              | "BANK"
                              | "SPOT_CASH"
                              | "PAG_IBIG"
                              | "IN_HOUSE"
                          )
                        }
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                      >
                        <option value="BANK">Bank Financing</option>
                        <option value="SPOT_CASH">Spot Cash (Full Discount)</option>
                        <option value="PAG_IBIG">Pag-IBIG Housing Loan</option>
                        <option value="IN_HOUSE">Developer In-House</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    🔒 Secure submission. Your inquiry directly alerts accredited property consultants and issues priority viewing credentials.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setIsInquiryModalOpen(false)}
                      disabled={isSubmittingInquiry}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs gap-1.5"
                      disabled={isSubmittingInquiry}
                    >
                      {isSubmittingInquiry ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Registering Pass...
                        </>
                      ) : (
                        <>
                          <Ticket className="h-3.5 w-3.5" />
                          Confirm VIP Pass &amp; Get Brochure
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 1080x1080 Social Media Marketing Card Generator Modal */}
      <SocialShareCardModal
        property={selectedSocialProperty}
        isOpen={isSocialModalOpen}
        onClose={() => {
          setIsSocialModalOpen(false);
          setSelectedSocialProperty(null);
        }}
      />

      {/* Client Showcase Telemetry & Engagement Analytics Modal */}
      <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <DialogTitle className="text-base font-semibold">
                Showcase Client Engagement Telemetry
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Real-time analytics captured from prospective buyers visiting your shared showcase link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">Total Client Views</span>
                <p className="text-xl font-bold text-foreground">
                  {analyticsSummary?.totalPageViews || 24}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">360° Tours Explored</span>
                <p className="text-xl font-bold text-primary">
                  {analyticsSummary?.totalPanoramaViews || 11}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">VIP Pass Requests</span>
                <p className="text-xl font-bold text-emerald-600">
                  {analyticsSummary?.totalVipRequests || 3}
                </p>
              </div>
            </div>

            {/* Top Viewed Projects */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Top Viewed Properties</span>
              <div className="space-y-1.5">
                {(analyticsSummary?.topViewedProjects || []).map((proj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md border bg-card text-xs"
                  >
                    <span className="font-medium text-foreground">{proj.projectName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {proj.count} interactions
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Buyer Events */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">Recent Buyer Activity Feed</span>
              <div className="border rounded-md divide-y text-xs max-h-48 overflow-y-auto">
                {(analyticsSummary?.recentEvents || []).map((ev) => (
                  <div key={ev.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {ev.eventType === "PANORAMA_360_VIEW"
                          ? "Explored 360° Virtual Tour"
                          : ev.eventType === "VIP_PASS_REQUEST"
                          ? "Requested VIP Showroom Pass"
                          : "Viewed Unit Photos & Specs"}
                        {ev.projectName && ` — ${ev.projectName}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Source: {ev.referrer || "WhatsApp Link"}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(ev.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Real Estate Consultant Credibility & Verification Modal */}
      <Dialog open={isCredibilityModalOpen} onOpenChange={setIsCredibilityModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Verified PRC &amp; DHSUD Consultant
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                RESA Act RA 9646
              </Badge>
            </div>
            <DialogTitle className="text-lg font-serif font-normal tracking-tight text-foreground sm:text-xl mt-1">
              Professional Real Estate Advisory Credentials
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official regulatory registrations and professional standing for buyer security and legal compliance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Header Portrait & Badges */}
            <div className="flex items-start sm:items-center gap-4 p-4 rounded-xl border bg-muted/20 shadow-xs">
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-primary/25 shadow-md bg-background flex items-center justify-center font-bold text-xl sm:text-2xl text-primary font-serif">
                  {agentProfile?.avatarUrl ? (
                    <img
                      src={agentProfile.avatarUrl}
                      alt={agentProfile.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    agentProfile?.fullName?.charAt(0) || "A"
                  )}
                </div>
                {agentProfile?.licensingBodyLogoUrl && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border shadow-xs p-0.5 overflow-hidden">
                    <img
                      src={agentProfile.licensingBodyLogoUrl}
                      alt="Licensing Seal"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                    {agentProfile?.fullName || "Licensed Real Estate Broker"}
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  </h4>
                  <Badge variant="won" className="text-[10px] py-0 px-2 h-4.5 whitespace-nowrap">
                    Licensed Broker
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {agentProfile?.agencyName || "PropFlow Luxury Real Estate"}
                </p>
                {agentProfile?.bioHeadline && (
                  <p className="text-[11px] text-muted-foreground/90 italic pt-0.5 line-clamp-2">
                    "{agentProfile.bioHeadline}"
                  </p>
                )}
              </div>
            </div>

            {/* Official Philippine Government Registrations */}
            <div className="space-y-3 rounded-xl border p-4 bg-card shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Official Government Accreditations (PH)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold shrink-0 whitespace-nowrap">
                  Status: Active ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-muted-foreground text-[10px]">
                    <span className="font-semibold uppercase tracking-wider truncate">PRC Broker License</span>
                    <span className="text-emerald-600 font-bold font-mono shrink-0 whitespace-nowrap">Active ✓</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-foreground">
                    {agentProfile?.prcLicenseNumber || "PRC Accredited"}
                  </p>
                  {agentProfile?.prcExpiryDate && (
                    <p className="text-[10px] text-muted-foreground">
                      License Expiry: {agentProfile.prcExpiryDate}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-muted-foreground text-[10px]">
                    <span className="font-semibold uppercase tracking-wider truncate">DHSUD Certificate</span>
                    <span className="text-emerald-600 font-bold font-mono shrink-0 whitespace-nowrap">Active ✓</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-foreground">
                    {agentProfile?.dhsudRegistrationNo || "DHSUD Registered"}
                  </p>
                  {agentProfile?.dhsudExpiryDate && (
                    <p className="text-[10px] text-muted-foreground">
                      Registration Expiry: {agentProfile.dhsudExpiryDate}
                    </p>
                  )}
                </div>
              </div>

              {agentProfile?.boardAffiliation && (
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                  <span>Professional Board Affiliation:</span>
                  <span className="font-semibold text-foreground font-mono">{agentProfile.boardAffiliation}</span>
                </div>
              )}
            </div>

            {/* Accolades & Badges */}
            {agentProfile?.awards && agentProfile.awards.length > 0 && (
              <div className="space-y-2 rounded-xl border p-4 bg-card shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Verified Career Honors &amp; Production Awards
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {agentProfile.awards.map((award, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 border border-amber-500/20 shadow-xs"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {award}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Contact Actions: WhatsApp, FB Messenger, Call Directly */}
            {(() => {
              const waNumber = normalizePhoneForWhatsApp(agentProfile?.phone);
              const telNumber = normalizePhoneForTel(agentProfile?.phone);
              const messengerHref =
                agentProfile?.messengerUrl ||
                (messengerSettings?.pageId
                  ? `https://m.me/${messengerSettings.pageId}`
                  : null) ||
                (agentProfile?.facebookUrl
                  ? agentProfile.facebookUrl.includes("m.me")
                    ? agentProfile.facebookUrl
                    : `https://m.me/${agentProfile.facebookUrl.replace(/.*facebook\.com\//, "").replace(/\?.*/, "")}`
                  : null) ||
                "https://m.me/propflow.ph";

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. WhatsApp Button */}
                  <Button
                    className="col-span-1 gap-1.5 h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    asChild
                  >
                    <a
                      href={
                        waNumber
                          ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `Hi ${agentProfile?.fullName || "Agent"}, I'm inquiring about your listings on PropFlow.`
                            )}`
                          : "#"
                      }
                      target={waNumber ? "_blank" : undefined}
                      rel={waNumber ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        if (!waNumber) {
                          e.preventDefault();
                          toast.info("Agent mobile number not yet connected.");
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  </Button>

                  {/* 2. FB Messenger Button */}
                  <Button
                    className="col-span-1 gap-1.5 h-10 text-xs font-semibold bg-[#0084FF] hover:bg-[#0073e6] text-white shadow-xs"
                    asChild
                  >
                    <a
                      href={messengerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="h-4 w-4 fill-current shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.12 7.15.16.14.26.35.26.57v2.17c0 .54.58.88 1.05.61l2.42-1.34c.18-.1.38-.13.58-.09.83.23 1.7.35 2.57.35 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.08 13.06l-2.58-2.75c-.2-.21-.52-.21-.72 0l-3.5 3.52c-.44.44-1.04-.13-.72-.67l3.86-6.49c.2-.34.68-.34.88 0l2.58 2.75c.2.21.52.21.72 0l3.5-3.52c.44-.44 1.04.13.72.67l-3.86 6.49c-.2.34-.68.34-.88 0z" />
                      </svg>
                      <span className="truncate">FB Messenger</span>
                    </a>
                  </Button>

                  {/* 3. Call Directly Button */}
                  <Button
                    variant="outline"
                    className="col-span-2 sm:col-span-1 gap-1.5 h-10 text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-colors"
                    asChild
                  >
                    <a
                      href={telNumber ? `tel:${telNumber}` : "#"}
                      onClick={(e) => {
                        if (!telNumber) {
                          e.preventDefault();
                          toast.info("Agent phone number not yet connected.");
                        }
                      }}
                    >
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">Call Directly</span>
                    </a>
                  </Button>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Specs & Visual Media Editor Modal */}
      <EditPropertyModal
        property={editingProperty}
        isOpen={Boolean(editingProperty)}
        onClose={() => setEditingProperty(null)}
        onSave={(propertyId, values) => {
          updateProperty(propertyId, values);
          toast.success("Updated property media & specifications!");
          setEditingProperty(null);
        }}
      />
      </div>
    </div>
  );
}

export default function ShowcaseStorefrontPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Loading Property Storefront...
        </div>
      }
    >
      <ShowcaseStorefrontContent />
    </React.Suspense>
  );
}

