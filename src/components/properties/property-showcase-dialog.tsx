"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Compass,
  ExternalLink,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  Image as ImageIcon,
  MapPin,
  Pencil,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Sparkles,
  Ticket,
  Train,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import type { Property } from "@/lib/schemas";
import { PanoramaViewer } from "@/components/showcase/panorama-viewer";
import {
  getSafePropertyImageUrl,
  handleImageFallbackError,
} from "@/lib/property-images";
import {
  calculatePropertyInvestmentYield,
  getPropertyVicinityLandmarks,
} from "@/lib/showcase-utils";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  x: number;
  y: number;
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

export interface PropertyShowcaseDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isClientView?: boolean;
  onRequestVipPass?: (property: Property) => void;
  onBookViewing?: (property: Property) => void;
  onCustomizeQuotation?: (property: Property) => void;
  onEditMedia?: (property: Property) => void;
}

export function PropertyShowcaseDialog({
  property,
  open,
  onOpenChange,
  isClientView = true,
  onRequestVipPass,
  onBookViewing,
  onCustomizeQuotation,
  onEditMedia,
}: PropertyShowcaseDialogProps) {
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<string>("photos");
  const [selectedHotspotId, setSelectedHotspotId] = React.useState<string>("living");

  // Reset tab and photo index when property changes
  React.useEffect(() => {
    if (property) {
      setActivePhotoIndex(0);
      setActiveTab("photos");
      setSelectedHotspotId("living");
    }
  }, [property?.id]);

  if (!property) return null;

  const hotspots = getPropertyHotspots(property);
  const activeHotspot =
    hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];
  const vicinityLandmarks = getPropertyVicinityLandmarks(property);
  const yieldMetrics = calculatePropertyInvestmentYield(property);

  const heroImage = getSafePropertyImageUrl(
    property.galleryImages?.[activePhotoIndex] || property.thumbnailUrl,
    property.propertyType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <div className="space-y-4 p-5">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="new" className="text-[10px]">
                  {property.developerName}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {property.propertyType?.replace(/_/g, " ")}
                </Badge>
                {!isClientView && onEditMedia && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => onEditMedia(property)}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit Media &amp; Specs</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-base font-serif font-normal text-primary tabular-nums">
                  {formatCurrency(property.listPrice, "PHP", 0)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                  asChild
                >
                  <Link
                    href={`/showcase?view=client&propertyId=${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
            <DialogTitle className="text-xl font-serif font-normal tracking-tight">
              {property.projectName} — {property.unitCode}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {property.address} ({property.turnoverDate})
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-9">
              <TabsTrigger value="photos" className="text-xs gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Photos (</span>
                <span>{property.galleryImages?.length || 1}</span>
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

            {/* 1. PHOTO GALLERY TAB */}
            <TabsContent value="photos" className="mt-3 space-y-3">
              <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-xl border bg-black">
                <img
                  src={heroImage}
                  alt={`${property.projectName} view ${activePhotoIndex + 1}`}
                  onError={(e) =>
                    handleImageFallbackError(e, property.propertyType)
                  }
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Thumbnails Strip */}
              {property.galleryImages && property.galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.galleryImages.map((imgUrl, idx) => (
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
                        src={getSafePropertyImageUrl(imgUrl, property.propertyType)}
                        alt="Thumbnail"
                        onError={(e) =>
                          handleImageFallbackError(e, property.propertyType)
                        }
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 2. INTERACTIVE FLOOR PLAN HOTSPOTS TAB */}
            <TabsContent value="floorplan" className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">Architectural Layout:</span>
                  <span className="text-muted-foreground">
                    {property.floorAreaSqm} m² Total Floor Area
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">·</span>
                  <span className="text-muted-foreground hidden sm:inline">
                    {property.bedrooms} Bed · {property.bathrooms} Bath
                  </span>
                </div>
                <span className="text-[11px] text-primary font-medium">
                  💡 Click room markers to inspect specifications
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-2">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070b14] shadow-inner select-none">
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

                      <rect
                        x="140"
                        y="320"
                        width="240"
                        height="150"
                        fill="#1e293b"
                        fillOpacity="0.35"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x="260"
                        y="400"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="11"
                        fontWeight="600"
                      >
                        KITCHEN
                      </text>

                      <rect
                        x="460"
                        y="50"
                        width="280"
                        height="230"
                        fill="#0f172a"
                        fillOpacity="0.5"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                      <text
                        x="600"
                        y="160"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="12"
                        fontWeight="700"
                      >
                        MASTER SUITE
                      </text>

                      <rect
                        x="460"
                        y="280"
                        width="160"
                        height="190"
                        fill="#1e293b"
                        fillOpacity="0.35"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x="540"
                        y="380"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="600"
                      >
                        BEDROOM 2
                      </text>

                      <rect
                        x="620"
                        y="280"
                        width="120"
                        height="190"
                        fill="#1e293b"
                        fillOpacity="0.25"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <text
                        x="680"
                        y="380"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                      >
                        T&amp;B
                      </text>
                    </svg>

                    {/* Interactive Hotspot Beacon Pins */}
                    {hotspots.map((spot) => {
                      const isSelected = spot.id === selectedHotspotId;
                      return (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => {
                            setSelectedHotspotId(spot.id);
                            setActivePhotoIndex(spot.photoIndex);
                          }}
                          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                          title={spot.name}
                        >
                          <span
                            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                              isSelected
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/40 scale-110 shadow-lg"
                                : "bg-card/90 text-foreground border border-border/80 hover:bg-primary/20 hover:scale-105 backdrop-blur-xs"
                            }`}
                          >
                            {getRoomIcon(spot.category)}
                            <span
                              className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ${
                                isSelected ? "bg-emerald-400" : "bg-primary/60"
                              }`}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hotspot Room Details Panel */}
                <div className="lg:col-span-5 rounded-xl border bg-muted/20 p-4 space-y-3">
                  {activeHotspot && (
                    <>
                      <div className="flex items-start justify-between gap-2 border-b pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                            {getRoomIcon(activeHotspot.category)}
                            <span>{activeHotspot.category} ZONE</span>
                          </div>
                          <h4 className="font-bold text-sm text-foreground mt-0.5">
                            {activeHotspot.name}
                          </h4>
                        </div>
                        <Badge variant="won" className="text-[10px] font-mono">
                          {activeHotspot.areaSqm} m²
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activeHotspot.description}
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Architectural Specifications:
                        </span>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {activeHotspot.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-foreground/90">
                              <CheckCircle2 className="h-3 w-3 text-pipeline-won shrink-0" />
                              <span className="text-[11px]">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 3. 360° TOUR TAB */}
            <TabsContent value="panorama" className="mt-3">
              <PanoramaViewer propertyName={property.projectName} />
            </TabsContent>

            {/* 4. VICINITY TAB */}
            <TabsContent value="vicinity" className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">Masterplan Proximity Matrix</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-primary hover:underline px-1"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${property.projectName} ${property.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Directions in Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {vicinityLandmarks.map((lm) => (
                  <div
                    key={lm.name}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                        {getLandmarkCategoryIcon(lm.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {lm.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
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

            {/* 5. VIDEO TAB */}
            <TabsContent value="video" className="mt-3">
              {property.videoWalkthroughUrl ? (
                <div className="overflow-hidden rounded-xl border bg-black">
                  <video
                    key={property.videoWalkthroughUrl}
                    src={property.videoWalkthroughUrl}
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
                <span className="text-[9px] text-muted-foreground block">Est. Market Return</span>
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
                <span className="text-[9px] text-muted-foreground block">Yield + Appreciation</span>
              </div>
            </div>
          </div>

          {/* Details & Amenities */}
          <div className="space-y-2 border-t pt-3 text-xs">
            <p className="leading-relaxed text-muted-foreground">
              {property.description}
            </p>
            {property.amenities && property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {property.amenities.map((am) => (
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
            {onRequestVipPass ? (
              <Button
                variant="default"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => onRequestVipPass(property)}
              >
                <Ticket className="h-3.5 w-3.5" />
                Request VIP Showroom Pass
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="text-xs gap-1.5"
                asChild
              >
                <Link
                  href={`/showcase?view=client&propertyId=${property.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Open Full Showcase Tab
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}

            {onBookViewing ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => onBookViewing(property)}
              >
                <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                Book Site Viewing
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                <Link href="/inquire">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  Book Site Viewing
                </Link>
              </Button>
            )}

            <Button variant="secondary" size="sm" className="text-xs gap-1.5" asChild>
              <Link href="/showcase?view=client" target="_blank" rel="noopener noreferrer">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Browse All Properties</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
