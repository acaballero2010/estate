"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  Car,
  CheckCircle2,
  Coins,
  Home,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  Maximize2,
  FileText,
  Trash2,
  Video,
} from "lucide-react";
import {
  CreatePropertyInputSchema,
  type CreatePropertyInput,
  type Property,
} from "@/lib/schemas";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { getSafePropertyImageUrl } from "@/lib/property-images";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditPropertyModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (propertyId: string, values: CreatePropertyInput) => void;
  onDelete?: (propertyId: string) => void;
}

export function EditPropertyModal({
  property,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditPropertyModalProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = React.useState<string | null>(null);
  const [galleryUrlsText, setGalleryUrlsText] = React.useState<string>("");
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(CreatePropertyInputSchema),
    defaultValues: {
      projectName: "",
      developerName: "",
      unitCode: "",
      propertyType: "CONDOMINIUM",
      locationCity: "",
      address: "",
      floorAreaSqm: 40,
      lotAreaSqm: 0,
      bedrooms: 1,
      bathrooms: 1,
      parkingSlots: 0,
      listPrice: 5000000,
      reservationFee: 25000,
      status: "AVAILABLE",
      turnoverDate: "Q4 2027 (Pre-selling)",
      description: "",
      amenities: [],
      thumbnailUrl: "",
      galleryImages: [],
      videoWalkthroughUrl: "",
    },
  });

  // Reset form with property data whenever property changes or modal opens
  React.useEffect(() => {
    if (property && isOpen) {
      form.reset({
        projectName: property.projectName || "",
        developerName: property.developerName || "",
        unitCode: property.unitCode || "",
        propertyType: property.propertyType || "CONDOMINIUM",
        locationCity: property.locationCity || "",
        address: property.address || "",
        floorAreaSqm: property.floorAreaSqm || 0,
        lotAreaSqm: property.lotAreaSqm || 0,
        bedrooms: property.bedrooms ?? 1,
        bathrooms: property.bathrooms ?? 1,
        parkingSlots: property.parkingSlots ?? 0,
        listPrice: property.listPrice || 0,
        reservationFee: property.reservationFee || 25000,
        status: property.status || "AVAILABLE",
        turnoverDate: property.turnoverDate || "",
        description: property.description || "",
        amenities: property.amenities || [],
        thumbnailUrl: property.thumbnailUrl || "",
        galleryImages: property.galleryImages || [],
        videoWalkthroughUrl: property.videoWalkthroughUrl || "",
      });
      setUploadedPhotoPreview(property.thumbnailUrl || null);
      setGalleryUrlsText((property.galleryImages || []).join("\n"));
      setIsConfirmingDelete(false);
    }
  }, [property, isOpen, form]);

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const url = await uploadMediaFile(file, "properties");
          uploadedUrls.push(url);
        }
      }
      if (uploadedUrls[0]) {
        form.setValue("thumbnailUrl", uploadedUrls[0]);
        form.setValue("galleryImages", uploadedUrls);
        setUploadedPhotoPreview(uploadedUrls[0]);
        toast.success(
          `${uploadedUrls.length} property photo(s) uploaded and saved!`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed. You can paste an image URL instead.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadMediaFile(file, "walkthroughs");
      form.setValue("videoWalkthroughUrl", url);
      toast.success("Walkthrough video uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Video upload failed. You can paste a video URL instead.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = (values: CreatePropertyInput) => {
    if (!property) return;
    setIsSubmitting(true);
    try {
      const safeThumbnail = getSafePropertyImageUrl(
        values.thumbnailUrl,
        values.propertyType
      );

      const parsedGallery = galleryUrlsText
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 5);

      const rawGalleryList =
        parsedGallery.length > 0
          ? parsedGallery
          : values.galleryImages && values.galleryImages.length > 0
          ? values.galleryImages
          : [safeThumbnail];

      const safeGallery = Array.from(
        new Set(
          rawGalleryList.map((img) =>
            getSafePropertyImageUrl(img, values.propertyType)
          )
        )
      );

      onSave(property.id, {
        ...values,
        thumbnailUrl: safeThumbnail,
        galleryImages: safeGallery,
      });

      toast.success(`Updated listing: ${values.projectName} (${values.unitCode})`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes. Please check required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!property || !onDelete) return;
    onDelete(property.id);
    toast.success(`Removed listing: ${property.projectName} (${property.unitCode})`);
    setIsConfirmingDelete(false);
    onClose();
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 sm:max-w-2xl md:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border shadow-2xl">
        {/* Sticky Header */}
        <DialogHeader className="px-6 py-4 border-b bg-card shrink-0 pr-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Edit Property Listing
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update unit specs, status, pricing, and visual media tours for {property.projectName} ({property.unitCode}).
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs hidden sm:inline-flex">
              {property.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* SECTION 1: PROJECT & DEVELOPER IDENTIFICATION */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  1. Project &amp; Unit Identification
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Required Info
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-project" className="text-xs font-semibold">
                    Project / Estate Name *
                  </Label>
                  <Input
                    id="edit-prop-project"
                    placeholder="e.g. The Meridian Park Residences"
                    className="h-9 text-xs"
                    {...form.register("projectName")}
                  />
                  {form.formState.errors.projectName && (
                    <p className="text-[11px] font-medium text-destructive">
                      {form.formState.errors.projectName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-dev" className="text-xs font-semibold">
                    Developer Partner *
                  </Label>
                  <Input
                    id="edit-prop-dev"
                    placeholder="e.g. Ayala Land Premier / Megaworld"
                    className="h-9 text-xs"
                    {...form.register("developerName")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-unit" className="text-xs font-semibold">
                    Unit / Identifier *
                  </Label>
                  <Input
                    id="edit-prop-unit"
                    placeholder="e.g. Tower B - 2608"
                    className="h-9 text-xs"
                    {...form.register("unitCode")}
                  />
                  {form.formState.errors.unitCode && (
                    <p className="text-[11px] font-medium text-destructive">
                      {form.formState.errors.unitCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-type" className="text-xs font-semibold">
                    Property Category *
                  </Label>
                  <select
                    id="edit-prop-type"
                    {...form.register("propertyType")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="CONDOMINIUM">Condominium</option>
                    <option value="HOUSE_AND_LOT">House &amp; Lot</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="RESIDENTIAL_LOT">Residential Lot</option>
                    <option value="COMMERCIAL_UNIT">Commercial Unit</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-status" className="text-xs font-semibold">
                    Inventory Status *
                  </Label>
                  <select
                    id="edit-prop-status"
                    {...form.register("status")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: LOCATION & TURNOVER SCHEDULE */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  2. Location &amp; Handover Schedule
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-city" className="text-xs font-semibold">
                    City / District *
                  </Label>
                  <Input
                    id="edit-prop-city"
                    placeholder="e.g. Bonifacio Global City, Taguig"
                    className="h-9 text-xs"
                    {...form.register("locationCity")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prop-turnover" className="text-xs font-semibold">
                    Turnover Status / Target *
                  </Label>
                  <Input
                    id="edit-prop-turnover"
                    placeholder="e.g. Ready for Occupancy (RFO) or Q4 2027"
                    className="h-9 text-xs"
                    {...form.register("turnoverDate")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prop-addr" className="text-xs font-semibold">
                  Complete Estate / Street Address
                </Label>
                <Input
                  id="edit-prop-addr"
                  placeholder="e.g. 34th Street cor. 9th Avenue, Bonifacio Global City, Taguig"
                  className="h-9 text-xs"
                  {...form.register("address")}
                />
              </div>
            </div>

            {/* SECTION 3: ARCHITECTURAL DIMENSIONS */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  3. Architectural Dimensions &amp; Layout
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Maximize2 className="h-3 w-3 text-primary" />
                    <span>Floor Area</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      className="h-8 text-xs font-semibold tabular-nums"
                      {...form.register("floorAreaSqm", { valueAsNumber: true })}
                    />
                    <span className="text-[10px] text-muted-foreground">sqm</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Home className="h-3 w-3 text-primary" />
                    <span>Lot Area</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.5"
                      className="h-8 text-xs font-semibold tabular-nums"
                      {...form.register("lotAreaSqm", { valueAsNumber: true })}
                    />
                    <span className="text-[10px] text-muted-foreground">sqm</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <BedDouble className="h-3 w-3 text-primary" />
                    <span>Bedrooms</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-xs font-semibold tabular-nums"
                    {...form.register("bedrooms", { valueAsNumber: true })}
                  />
                </div>

                <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Bath className="h-3 w-3 text-primary" />
                    <span>Bathrooms</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-xs font-semibold tabular-nums"
                    {...form.register("bathrooms", { valueAsNumber: true })}
                  />
                </div>

                <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    <Car className="h-3 w-3 text-primary" />
                    <span>Parking</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-xs font-semibold tabular-nums"
                    {...form.register("parkingSlots", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: PRICING & RESERVATION TERMS */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                  4. Pricing &amp; Reservation Terms
                </span>
                <Badge variant="won" className="text-[10px]">
                  Philippine Peso (PHP)
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-prop-price" className="text-xs font-semibold">
                      Total List Price (₱) *
                    </Label>
                    <span className="text-[11px] font-bold text-primary tabular-nums">
                      {formatCurrency(form.watch("listPrice") || 0, "PHP", 0)}
                    </span>
                  </div>
                  <Input
                    id="edit-prop-price"
                    type="number"
                    step="50000"
                    className="h-9 text-xs font-semibold tabular-nums"
                    {...form.register("listPrice", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-prop-res" className="text-xs font-semibold">
                      Standard Reservation Fee (₱) *
                    </Label>
                    <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                      {formatCurrency(form.watch("reservationFee") || 0, "PHP", 0)}
                    </span>
                  </div>
                  <Input
                    id="edit-prop-res"
                    type="number"
                    step="5000"
                    className="h-9 text-xs tabular-nums"
                    {...form.register("reservationFee", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: MEDIA & VIDEO TOUR */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5 text-primary" />
                  5. Visual Media &amp; Walkthrough Tour
                </span>
                {uploadedPhotoPreview && (
                  <Badge variant="won" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Cover Photo Ready
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/20 px-4 py-3 text-xs font-medium hover:bg-accent hover:border-primary/50 transition-colors">
                  {isUploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-primary" />
                  )}
                  <span>
                    {isUploadingPhoto ? "Uploading..." : "Upload New Photo (JPG/PNG)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoFileUpload}
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/20 px-4 py-3 text-xs font-medium hover:bg-accent hover:border-primary/50 transition-colors">
                  {isUploadingVideo ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Video className="h-4 w-4 text-primary" />
                  )}
                  <span>
                    {isUploadingVideo ? "Uploading..." : "Upload New Video Tour (.mp4)"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFileUpload}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-prop-thumb" className="text-[11px] text-muted-foreground">
                    Or Direct Cover Photo URL (Drive, OneDrive, Web)
                  </Label>
                  <Input
                    id="edit-prop-thumb"
                    className="h-8 text-xs font-mono"
                    placeholder="https://drive.google.com/file/d/... or https://..."
                    {...form.register("thumbnailUrl")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-prop-video" className="text-[11px] text-muted-foreground">
                    Or Walkthrough Tour Video URL (.mp4)
                  </Label>
                  <Input
                    id="edit-prop-video"
                    className="h-8 text-xs font-mono"
                    placeholder="https://.../walkthrough.mp4"
                    {...form.register("videoWalkthroughUrl")}
                  />
                </div>
              </div>

              {/* Additional Gallery Photo URLs */}
              <div className="space-y-1 rounded-lg border border-dashed bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-prop-gallery-links" className="text-xs font-semibold flex items-center gap-1.5">
                    <ImagePlus className="h-3 w-3 text-primary" />
                    Additional Gallery Image URLs (One link per line)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {galleryUrlsText.split(/[\n,]+/).filter((u) => u.trim().length > 5).length} photo links
                  </span>
                </div>
                <textarea
                  id="edit-prop-gallery-links"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={"https://drive.google.com/file/d/1A2B3C4D...\nhttps://onedrive.live.com/embed?resid=...\nhttps://images.unsplash.com/..."}
                  value={galleryUrlsText}
                  onChange={(e) => setGalleryUrlsText(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground leading-normal">
                  💡 <strong>No file uploads required:</strong> You can paste your Google Drive, OneDrive, Dropbox, or CDN photo links directly. For Google Drive files, simply ensure sharing is set to <em>&ldquo;Anyone with the link can view&rdquo;</em> and PropFlow will stream them automatically!
                </p>
              </div>

              {/* Live Preview */}
              {(uploadedPhotoPreview || form.watch("thumbnailUrl")) && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        uploadedPhotoPreview ||
                        getSafePropertyImageUrl(
                          form.watch("thumbnailUrl"),
                          form.watch("propertyType")
                        )
                      }
                      alt="Property Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold block">Current Listing Cover</span>
                    <span className="text-[10px] text-muted-foreground">
                      Visible in Showcase storefront, Quotation PDFs, and Social Cards.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: STOREFRONT DESCRIPTION */}
            <div className="rounded-xl border bg-card/60 p-4 space-y-2">
              <Label htmlFor="edit-prop-desc" className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Storefront Highlight &amp; Description
              </Label>
              <Input
                id="edit-prop-desc"
                className="h-9 text-xs"
                placeholder="e.g. Corner 2BR penthouse overlooking golf course with floor-to-ceiling glass"
                {...form.register("description")}
              />
            </div>

            {/* SECTION 7: DANGER ZONE (DELETE) */}
            {onDelete && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Delete Listing
                    </span>
                  </div>
                  {!isConfirmingDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setIsConfirmingDelete(true)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Unit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsConfirmingDelete(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleDelete}
                      >
                        Confirm Delete
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Permanently remove this property from your inventory and showcase. Quotations referencing this unit will remain in history.
                </p>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-3.5 border-t bg-card/95 backdrop-blur shrink-0 flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ID: <code className="font-mono text-[10px]">{property.id.slice(0, 8)}</code>
            </span>

            <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs gap-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
