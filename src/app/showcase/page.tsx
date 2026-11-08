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
  Film,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  PlayCircle,
  Sparkles,
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

function ShowcaseStorefrontContent() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId");
  const { properties } = useCrmStore();
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [selectedProperty, setSelectedProperty] =
    React.useState<Property | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);

  React.useEffect(() => {
    if (initialPropertyId) {
      const matched = properties.find((p) => p.id === initialPropertyId);
      if (matched) {
        setSelectedProperty(matched);
        setActivePhotoIndex(0);
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
  };

  return (
    <div className="container space-y-6 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-secondary/40 p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <Badge variant="new" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Property Storefront & Virtual Tours
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Explore Model Units, Architectural Photos & Video Walkthroughs
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

      {/* Interactive Lightbox Modal: Photos Gallery + Video Walkthrough Player */}
      <Dialog
        open={!!selectedProperty}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          {selectedProperty && (
            <div className="space-y-4 p-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <Badge variant="new" className="text-[10px]">
                    {selectedProperty.developerName}
                  </Badge>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {formatCurrency(selectedProperty.listPrice, "PHP", 0)}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold">
                  {selectedProperty.projectName} — {selectedProperty.unitCode}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedProperty.address} ({selectedProperty.turnoverDate})
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="photos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="photos" className="text-xs gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Architectural Photo Gallery (
                    {selectedProperty.galleryImages?.length || 1})
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-xs gap-1.5">
                    <Film className="h-3.5 w-3.5" />
                    Video Walkthrough Tour
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

