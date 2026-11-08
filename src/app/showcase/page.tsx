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
  CheckCircle2,
  ChevronRight,
  Compass,
  Film,
  Home,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  PlayCircle,
  Ruler,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { Property } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

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
  const { properties } = useCrmStore();
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [selectedProperty, setSelectedProperty] =
    React.useState<Property | null>(null);
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
    if (categoryFilter === "ALL") return properties;
    return properties.filter((p) => p.propertyType === categoryFilter);
  }, [properties, categoryFilter]);

  const handleOpenTourModal = (prop: Property) => {
    setSelectedProperty(prop);
    setActivePhotoIndex(0);
    setActiveTab("photos");
    setSelectedHotspotId("living");
  };

  return (
    <div className="container space-y-6 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-secondary/40 p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <Badge variant="new" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Property Storefront &amp; Virtual Tours
          </Badge>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Explore Model Units, Architectural Photos &amp; Video Walkthroughs
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Tour our accredited Condominiums, Executive Villages, and Townhomes in high-definition. Watch virtual model unit walkthroughs and unlock instant monthly equity computations.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { code: "ALL", label: "All Developments" },
            { code: "CONDOMINIUM", label: "Condominiums" },
            { code: "HOUSE_AND_LOT", label: "House & Lot" },
            { code: "TOWNHOUSE", label: "Townhomes" },
          ].map((cat) => (
            <Button
              key={cat.code}
              size="sm"
              variant={categoryFilter === cat.code ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setCategoryFilter(cat.code)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Storefront Media Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProperties.map((prop) => {
          const heroImage =
            prop.thumbnailUrl ||
            prop.galleryImages?.[0] ||
            DEFAULT_FALLBACK_IMAGE;
          const photoCount = prop.galleryImages?.length || 1;
          const hasVideo = Boolean(prop.videoWalkthroughUrl);
          const estMonthlyDp24 =
            (prop.listPrice * 0.2 - prop.reservationFee) / 24;

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
                        {formatCompactCurrency(prop.listPrice)}
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
                        {prop.bathrooms} T&B
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-foreground" />
                        {prop.parkingSlots} Park
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary tabular-nums">
                      Est. Equity: {formatCurrency(estMonthlyDp24, "PHP", 0)}/mo
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

              <CardFooter className="grid grid-cols-2 gap-2 border-t bg-muted/20 p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => handleOpenTourModal(prop)}
                >
                  <PlayCircle className="h-3.5 w-3.5 text-primary" />
                  Photos & Video Tour
                </Button>
                <Button size="sm" className="w-full text-xs gap-1.5" asChild>
                  <Link href={`/quotations?propertyId=${prop.id}`}>
                    <Calculator className="h-3.5 w-3.5" />
                    Compute Quotation
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
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
                  <Badge variant="new" className="text-[10px]">
                    {selectedProperty.developerName}
                  </Badge>
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
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="photos" className="text-xs gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Photo Gallery (</span>
                    <span>{selectedProperty.galleryImages?.length || 1}</span>
                    <span className="hidden sm:inline">)</span>
                  </TabsTrigger>
                  <TabsTrigger value="floorplan" className="text-xs gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    <span>Floor Plan</span>
                    <span className="hidden sm:inline">&amp; Hotspots</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs gap-1.5">
                    <Film className="h-3.5 w-3.5" />
                    <span>Video Tour</span>
                  </TabsTrigger>
                </TabsList>

                {/* PHOTO GALLERY TAB */}
                <TabsContent value="photos" className="mt-3 space-y-3">
                  <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-xl border bg-black">
                    <img
                      src={
                        selectedProperty.galleryImages?.[activePhotoIndex] ||
                        selectedProperty.thumbnailUrl ||
                        DEFAULT_FALLBACK_IMAGE
                      }
                      alt={`${selectedProperty.projectName} view ${
                        activePhotoIndex + 1
                      }`}
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
                              src={imgUrl}
                              alt="Thumbnail"
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
                                src={
                                  selectedProperty.galleryImages?.[
                                    activeHotspot.photoIndex
                                  ] ||
                                  selectedProperty.thumbnailUrl ||
                                  DEFAULT_FALLBACK_IMAGE
                                }
                                alt={activeHotspot.name}
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
                <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
                  <Link href="/trippings">
                    <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                    Book Site Viewing
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" className="text-xs gap-1.5" asChild>
                  <Link href="/inquire">
                    <Building2 className="h-3.5 w-3.5" />
                    Inquire Online
                  </Link>
                </Button>
                <Button size="sm" className="text-xs gap-1.5" asChild>
                  <Link href={`/quotations?propertyId=${selectedProperty.id}`}>
                    <Calculator className="h-3.5 w-3.5" />
                    Customize Quotation
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

