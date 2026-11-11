"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Bath,
  BedDouble,
  BellRing,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  Film,
  Grid3X3,
  Home,
  ImagePlus,
  Layers,
  LayoutGrid,
  Loader2,
  MapPin,
  Maximize2,
  Pencil,
  PlayCircle,
  Plus,
  Share2,
  ShieldCheck,
  Upload,
  UserCheck,
  Video,
} from "lucide-react";
import {
  CreatePropertyInputSchema,
  type CreatePropertyInput,
  type Property,
} from "@/lib/schemas";
import { useAuth } from "@/lib/firebase/auth-context";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { findMatchingLeadsForProperty } from "@/lib/lead-scoring";
import { useCrmStore } from "@/lib/store/crm-store";
import { SocialShareCardModal } from "@/components/marketing/social-share-card-modal";
import { EditPropertyModal } from "@/components/properties/edit-property-modal";
import { PropertyMatchAlertModal } from "@/components/properties/property-match-alert-modal";
import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { getSafePropertyImageUrl } from "@/lib/property-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface StackingCell {
  floorLabel: string;
  unitNumber: string;
  configLabel: string;
  floorAreaSqm: number;
  listPrice: number;
  status: Property["status"];
  linkedPropertyId?: string;
}

const DEFAULT_TOWER_FLOORS = [
  { floor: 42, prefix: "42", zone: "PENTHOUSE" },
  { floor: 38, prefix: "38", zone: "HIGH" },
  { floor: 32, prefix: "32", zone: "HIGH" },
  { floor: 28, prefix: "28", zone: "HIGH" },
  { floor: 26, prefix: "26", zone: "HIGH" },
  { floor: 24, prefix: "24", zone: "MID" },
  { floor: 22, prefix: "22", zone: "MID" },
  { floor: 18, prefix: "18", zone: "MID" },
  { floor: 15, prefix: "15", zone: "LOW" },
  { floor: 11, prefix: "11", zone: "LOW" },
  { floor: 6, prefix: "06", zone: "LOW" },
] as const;

export default function PropertiesPage() {
  const router = useRouter();
  const { user, agentProfile } = useAuth();
  const {
    properties,
    leads,
    addProperty,
    bulkAddProperties,
    updateProperty,
    updatePropertyStatus,
    deleteProperty,
  } = useCrmStore();
  const [editingProperty, setEditingProperty] = React.useState<Property | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isBulkOpen, setIsBulkOpen] = React.useState(false);
  const [isParsingCsv, setIsParsingCsv] = React.useState(false);
  const [openQuoteAfterSave, setOpenQuoteAfterSave] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = React.useState(false);
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = React.useState<string | null>(null);
  const [addGalleryUrlsText, setAddGalleryUrlsText] = React.useState<string>("");
  const [selectedStackCell, setSelectedStackCell] = React.useState<StackingCell | null>(null);
  const [stackZoneFilter, setStackZoneFilter] = React.useState<"ALL" | "PENTHOUSE" | "HIGH" | "MID" | "LOW">("ALL");
  const [stackStatusFilter, setStackStatusFilter] = React.useState<"ALL" | "AVAILABLE" | "RESERVED" | "SOLD">("ALL");
  const [selectedSocialProperty, setSelectedSocialProperty] = React.useState<Property | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = React.useState(false);
  const [selectedMatchProperty, setSelectedMatchProperty] = React.useState<Property | null>(null);
  const [isMatchAlertOpen, setIsMatchAlertOpen] = React.useState(false);
  const [portfolioView, setPortfolioView] = React.useState<"MY_LISTINGS" | "ACCREDITED" | "ALL">("MY_LISTINGS");
  const csvFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const propertyMatchCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const prop of properties) {
      if (prop.status === "AVAILABLE") {
        map.set(prop.id, findMatchingLeadsForProperty(prop, leads).length);
      }
    }
    return map;
  }, [properties, leads]);

  // Determine which properties belong directly to this logged-in agent
  const myListedProperties = React.useMemo(() => {
    return properties.filter((p) => {
      // Accredited master developer catalog items belong to masterlist
      if (p.listedByAgentId === "accredited-master-inventory") return false;
      // If user is not yet logged in / offline, treat any custom listed property as agent listing
      if (!user) return true;
      // If user is authenticated:
      return (
        p.listedByAgentId === user.uid ||
        p.listedByAgentId === "agent-direct-listing" ||
        (!p.listedByAgentId && (user.uid.startsWith("demo") || Boolean(user.email?.includes("kalyepos.com")))) ||
        (user.uid.startsWith("demo") && p.listedByAgentId === "00000000-0000-4000-8000-000000000001")
      );
    });
  }, [properties, user]);

  // Master accredited developer inventory
  const accreditedProperties = React.useMemo(() => {
    return properties.filter(
      (p) =>
        p.listedByAgentId === "accredited-master-inventory" ||
        (!p.listedByAgentId && !user) ||
        (p.listedByAgentId !== user?.uid && p.listedByAgentId !== "agent-direct-listing")
    );
  }, [properties, user]);

  const allPropertiesCombined = React.useMemo(() => {
    return properties;
  }, [properties]);

  const displayedProperties = React.useMemo(() => {
    if (portfolioView === "MY_LISTINGS") {
      return myListedProperties;
    }
    if (portfolioView === "ACCREDITED") {
      return accreditedProperties;
    }
    return allPropertiesCombined;
  }, [portfolioView, myListedProperties, accreditedProperties, allPropertiesCombined]);

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(CreatePropertyInputSchema),
    defaultValues: {
      projectName: "",
      developerName: "Ayala Premier Estates",
      unitCode: "",
      propertyType: "CONDOMINIUM",
      locationCity: "Bonifacio Global City, Taguig",
      address: "",
      floorAreaSqm: 65,
      lotAreaSqm: 0,
      bedrooms: 2,
      bathrooms: 2,
      parkingSlots: 1,
      listPrice: 12500000,
      reservationFee: 50000,
      status: "AVAILABLE",
      turnoverDate: "Q4 2027 (Pre-selling)",
      description: "",
      amenities: ["Swimming Pool", "24/7 Concierge", "Fitness Gym"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      ],
      videoWalkthroughUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
  });

  const handlePhotoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        const existingGallery = form.getValues("galleryImages") || [];
        form.setValue("galleryImages", [...uploadedUrls, ...existingGallery]);
        setUploadedPhotoPreview(uploadedUrls[0]);
        toast.success(
          `Uploaded ${uploadedUrls.length} property photo${
            uploadedUrls.length > 1 ? "s" : ""
          }!`
        );
      }
    } catch {
      toast.error("Could not upload photo file.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleVideoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadMediaFile(file, "walkthroughs");
      form.setValue("videoWalkthroughUrl", url);
      toast.success(`Uploaded walkthrough video: ${file.name}`);
    } catch {
      toast.error("Could not upload video file.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const onSubmitNewProperty = (values: CreatePropertyInput) => {
    const safeThumbnail = getSafePropertyImageUrl(
      values.thumbnailUrl,
      values.propertyType
    );

    const parsedGallery = addGalleryUrlsText
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

    const created = addProperty({
      ...values,
      thumbnailUrl: safeThumbnail,
      listedByAgentId: user?.uid || "agent-direct-listing",
      listedByAgentName: agentProfile?.fullName || user?.displayName || "Agent",
      galleryImages: safeGallery,
    });
    setPortfolioView("MY_LISTINGS");
    const matchedBuyers =
      created.status === "AVAILABLE"
        ? findMatchingLeadsForProperty(created, leads)
        : [];
    if (matchedBuyers.length > 0 && !openQuoteAfterSave) {
      toast.success(
        `Added ${created.unitCode}! ${matchedBuyers.length} active buyer${
          matchedBuyers.length > 1 ? "s match" : " matches"
        } this unit.`,
        {
          action: {
            label: `Notify ${matchedBuyers.length} Buyers`,
            onClick: () => {
              setSelectedMatchProperty(created);
              setIsMatchAlertOpen(true);
            },
          },
        }
      );
    } else {
      toast.success(
        `Added ${created.projectName} (${created.unitCode}) to your exclusive listings!`
      );
    }
    setIsAddOpen(false);
    setUploadedPhotoPreview(null);
    setAddGalleryUrlsText("");
    form.reset();

    if (openQuoteAfterSave) {
      router.push(`/quotations?propertyId=${created.id}`);
    }
  };

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (propertyId: string, values: CreatePropertyInput) => {
    const prevProp = properties.find((p) => p.id === propertyId);
    updateProperty(propertyId, values);
    if (
      prevProp &&
      prevProp.status !== "AVAILABLE" &&
      values.status === "AVAILABLE"
    ) {
      const updatedSnapshot: Property = { ...prevProp, ...values };
      const matches = findMatchingLeadsForProperty(updatedSnapshot, leads);
      if (matches.length > 0) {
        toast.info(
          `${values.unitCode} is back on market — ${matches.length} buyer${
            matches.length > 1 ? "s match" : " matches"
          }!`,
          {
            action: {
              label: "Send Alert",
              onClick: () => {
                setSelectedMatchProperty(updatedSnapshot);
                setIsMatchAlertOpen(true);
              },
            },
          }
        );
      }
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    deleteProperty(propertyId);
  };

  const handleDownloadCsvTemplate = () => {
    const templateRows = [
      {
        projectName: "The Meridian Park Residences",
        developerName: "Ayala Premier Estates",
        unitCode: "Tower B - 1802 (1BR Deluxe)",
        propertyType: "CONDOMINIUM",
        locationCity: "Bonifacio Global City, Taguig",
        address: "34th Street cor. 9th Ave, BGC",
        floorAreaSqm: "42.0",
        lotAreaSqm: "0",
        bedrooms: "1",
        bathrooms: "1",
        parkingSlots: "0",
        listPrice: "8950000",
        reservationFee: "50000",
        status: "AVAILABLE",
        turnoverDate: "Q4 2027",
        description: "High-floor deluxe 1-Bedroom overlooking the amenity deck.",
        thumbnailUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        videoWalkthroughUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      },
      {
        projectName: "Solana Verde Executive Village",
        developerName: "Crestview Land Corp",
        unitCode: "Blk 18 Lot 22 (Bella Model)",
        propertyType: "HOUSE_AND_LOT",
        locationCity: "Nuvali, Santa Rosa, Laguna",
        address: "Solana Spine Road, Nuvali South",
        floorAreaSqm: "165.0",
        lotAreaSqm: "210.0",
        bedrooms: "4",
        bathrooms: "3",
        parkingSlots: "2",
        listPrice: "11800000",
        reservationFee: "50000",
        status: "AVAILABLE",
        turnoverDate: "Ready for Occupancy (RFO)",
        description: "Single detached 4BR home on corner lot with landscaped garden.",
        thumbnailUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        videoWalkthroughUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      },
    ];

    const csvContent = Papa.unparse(templateRows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "propflow-inventory-template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV inventory import template");
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCsv(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedInputs: CreatePropertyInput[] = results.data.map((row) => ({
            projectName: row.projectName?.trim() || "Development Project",
            developerName: row.developerName?.trim() || "Developer Partner",
            unitCode: row.unitCode?.trim() || `Unit-${Date.now().toString().slice(-4)}`,
            propertyType: (row.propertyType?.trim() || "CONDOMINIUM") as CreatePropertyInput["propertyType"],
            locationCity: row.locationCity?.trim() || "Metro Manila",
            address: row.address?.trim() || "Main Estate Road",
            floorAreaSqm: parseFloat(row.floorAreaSqm || "50") || 50,
            lotAreaSqm: parseFloat(row.lotAreaSqm || "0") || 0,
            bedrooms: parseInt(row.bedrooms || "2", 10) || 2,
            bathrooms: parseInt(row.bathrooms || "1", 10) || 1,
            parkingSlots: parseInt(row.parkingSlots || "1", 10) || 0,
            listPrice: parseFloat(row.listPrice || "7500000") || 7500000,
            reservationFee: parseFloat(row.reservationFee || "50000") || 50000,
            status: (row.status?.trim() || "AVAILABLE") as CreatePropertyInput["status"],
            turnoverDate: row.turnoverDate?.trim() || "Pre-selling",
            description: row.description?.trim() || "Accredited residential unit.",
            amenities: ["Swimming Pool", "24/7 Security", "Clubhouse"],
            thumbnailUrl: getSafePropertyImageUrl(
              row.thumbnailUrl?.trim(),
              row.propertyType
            ),
            galleryImages: [
              getSafePropertyImageUrl(
                row.thumbnailUrl?.trim(),
                row.propertyType
              ),
            ],
            videoWalkthroughUrl: row.videoWalkthroughUrl?.trim() || undefined,
            listedByAgentId: user?.uid || "agent-direct-listing",
            listedByAgentName: agentProfile?.fullName || user?.displayName || "Agent",
          }));

          if (parsedInputs.length === 0) {
            toast.error("No valid property records found in CSV.");
            return;
          }

          bulkAddProperties(parsedInputs);
          setPortfolioView("MY_LISTINGS");
          toast.success(`Successfully imported ${parsedInputs.length} property units!`);
          setIsBulkOpen(false);
          if (csvFileInputRef.current) {
            csvFileInputRef.current.value = "";
          }
        } catch {
          toast.error("Error processing CSV format. Please use the standard template.");
        } finally {
          setIsParsingCsv(false);
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file.");
        setIsParsingCsv(false);
      },
    });
  };

  // Build Interactive Tower & Block-Lot Stacking Matrix combining live inventory + tower floors
  const stackingMatrix = React.useMemo(() => {
    const activeFloors = DEFAULT_TOWER_FLOORS.filter((tf) => {
      if (stackZoneFilter === "ALL") return true;
      return tf.zone === stackZoneFilter;
    });

    return activeFloors.map(({ floor, prefix }) => {
      const slots = ["01", "02", "05", "08", "09"].map((suffix, idx) => {
        const unitCodeShort = `${prefix}${suffix}`;
        const matchedProp = properties.find((p) =>
          p.unitCode.includes(unitCodeShort)
        );

        if (matchedProp) {
          return {
            floorLabel: `${floor}F`,
            unitNumber: matchedProp.unitCode,
            configLabel: `${matchedProp.bedrooms}BR • ${matchedProp.floorAreaSqm} sqm`,
            floorAreaSqm: matchedProp.floorAreaSqm,
            listPrice: matchedProp.listPrice,
            status: matchedProp.status,
            linkedPropertyId: matchedProp.id,
          } satisfies StackingCell;
        }

        // Deterministic synthetic unit cells around real inventory
        const isCorner = suffix === "01" || suffix === "08";
        const area = isCorner ? 84.5 : suffix === "09" ? 112.0 : 42.0;
        const price =
          area * 195000 + floor * 45000;
        const syntheticStatus: Property["status"] =
          (floor + idx) % 7 === 0
            ? "SOLD"
            : (floor + idx) % 5 === 0
            ? "RESERVED"
            : (floor + idx) % 4 === 0
            ? "ON_HOLD"
            : "AVAILABLE";

        return {
          floorLabel: `${floor}F`,
          unitNumber: `Tower B - ${unitCodeShort} (${
            isCorner ? "2BR Corner" : suffix === "09" ? "3BR Suite" : "1BR Deluxe"
          })`,
          configLabel: `${
            isCorner ? "2BR" : suffix === "09" ? "3BR" : "1BR"
          } • ${area} sqm`,
          floorAreaSqm: area,
          listPrice: price,
          status: syntheticStatus,
        } satisfies StackingCell;
      });

      return {
        floor,
        floorLabel: `${floor}th Floor`,
        slots,
      };
    });
  }, [properties, stackZoneFilter]);

  const handleComputeFromStackCell = (cell: StackingCell) => {
    if (cell.linkedPropertyId) {
      router.push(`/quotations?propertyId=${cell.linkedPropertyId}`);
      return;
    }
    // Create the unit in inventory on the fly and jump to its quotation
    const created = addProperty({
      projectName: "The Meridian Park Residences",
      developerName: "Ayala Premier Estates",
      unitCode: cell.unitNumber,
      propertyType: "CONDOMINIUM",
      locationCity: "Bonifacio Global City, Taguig",
      address: "34th Street cor. 9th Ave, BGC, Taguig",
      floorAreaSqm: cell.floorAreaSqm,
      lotAreaSqm: 0,
      bedrooms: cell.configLabel.startsWith("3BR")
        ? 3
        : cell.configLabel.startsWith("2BR")
        ? 2
        : 1,
      bathrooms: cell.configLabel.startsWith("1BR") ? 1 : 2,
      parkingSlots: cell.configLabel.startsWith("1BR") ? 0 : 1,
      listPrice: cell.listPrice,
      reservationFee: 100000,
      status: cell.status,
      turnoverDate: "Q4 2027 (Pre-selling)",
      description: `Selected from Interactive Tower Stacking Plan (${cell.floorLabel}).`,
      amenities: ["50m Lap Pool & Sky Deck", "24/7 Concierge & Security"],
      thumbnailUrl:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      galleryImages: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      ],
      videoWalkthroughUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    });
    toast.success(`Loaded ${created.unitCode} into Quotation Calculator`);
    router.push(`/quotations?propertyId=${created.id}`);
  };

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Accredited Property &amp; Unit Inventory
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage pre-selling &amp; RFO units, inspect the interactive tower stacking plan, and launch customized quotations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            asChild
          >
            <Link href="/showcase">
              <PlayCircle className="h-3.5 w-3.5 text-primary" />
              Open Storefront Showcase
            </Link>
          </Button>

          {/* Bulk CSV Import Dialog */}
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                Bulk Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Bulk Import Property Inventory
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Upload an Excel-exported CSV to add dozens of accredited residential units to your inventory in seconds.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">1. Download Standard CSV Template</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleDownloadCsvTemplate}
                    >
                      <Download className="h-3 w-3" />
                      Download .CSV
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Includes columns for Project Name, Unit Code, Floor/Lot sqm, Price, Reservation Fee, Turnover, and Category.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold">2. Choose Populated CSV File</span>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/10 p-6 cursor-pointer hover:bg-muted/20 transition-colors">
                    {isParsingCsv ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                    <span className="text-xs font-medium text-center">
                      {isParsingCsv ? "Processing CSV Records..." : "Click or drop your populated CSV file here"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Accepts UTF-8 .csv files</span>
                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleCsvFileUpload}
                    />
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Property Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 gap-0 sm:max-w-2xl md:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden border shadow-2xl">
              {/* Sticky Top Header */}
              <DialogHeader className="px-6 py-4 border-b bg-card shrink-0 pr-12">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      Add New Property / Unit to Inventory
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Enter project specifications, upload media tours, and configure pricing for your exclusive inventory.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Form with Flex-1 Scrollable Body + Pinned Sticky Footer */}
              <form
                onSubmit={form.handleSubmit(onSubmitNewProperty)}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {/* Scrollable Form Content */}
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
                        <Label htmlFor="prop-project" className="text-xs font-semibold">
                          Project / Estate Name *
                        </Label>
                        <Input
                          id="prop-project"
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
                        <Label htmlFor="prop-dev" className="text-xs font-semibold">
                          Developer Partner *
                        </Label>
                        <Input
                          id="prop-dev"
                          placeholder="e.g. Ayala Land Premier / Megaworld"
                          className="h-9 text-xs"
                          {...form.register("developerName")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="prop-unit" className="text-xs font-semibold">
                          Unit / Block-Lot Identifier *
                        </Label>
                        <Input
                          id="prop-unit"
                          placeholder="e.g. Tower B - 2608 (2BR Corner)"
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
                        <Label htmlFor="prop-type" className="text-xs font-semibold">
                          Property Category *
                        </Label>
                        <select
                          id="prop-type"
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
                    </div>
                  </div>

                  {/* SECTION 2: LOCATION & HANDOVER TIMELINE */}
                  <div className="rounded-xl border bg-card/60 p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        2. Location &amp; Handover Schedule
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="prop-city" className="text-xs font-semibold">
                          City / District *
                        </Label>
                        <Input
                          id="prop-city"
                          placeholder="e.g. Bonifacio Global City, Taguig"
                          className="h-9 text-xs"
                          {...form.register("locationCity")}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="prop-turnover" className="text-xs font-semibold">
                          Turnover Status / Target *
                        </Label>
                        <Input
                          id="prop-turnover"
                          placeholder="e.g. Ready for Occupancy (RFO) or Q4 2027"
                          className="h-9 text-xs"
                          {...form.register("turnoverDate")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="prop-addr" className="text-xs font-semibold">
                        Complete Estate / Street Address
                      </Label>
                      <Input
                        id="prop-addr"
                        placeholder="e.g. 34th Street cor. 9th Avenue, Bonifacio Global City, Taguig"
                        className="h-9 text-xs"
                        {...form.register("address")}
                      />
                    </div>
                  </div>

                  {/* SECTION 3: ARCHITECTURAL SPECIFICATIONS & DIMENSIONS */}
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

                  {/* SECTION 4: PRICING & PAYMENT TERMS */}
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
                          <Label htmlFor="prop-price" className="text-xs font-semibold">
                            Total List Price (₱) *
                          </Label>
                          <span className="text-[11px] font-bold text-primary tabular-nums">
                            {formatCurrency(form.watch("listPrice") || 0, "PHP", 0)}
                          </span>
                        </div>
                        <Input
                          id="prop-price"
                          type="number"
                          step="50000"
                          className="h-9 text-xs font-semibold tabular-nums"
                          {...form.register("listPrice", { valueAsNumber: true })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="prop-res" className="text-xs font-semibold">
                            Standard Reservation Fee (₱) *
                          </Label>
                          <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                            {formatCurrency(form.watch("reservationFee") || 0, "PHP", 0)}
                          </span>
                        </div>
                        <Input
                          id="prop-res"
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
                          Media Attached
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
                          {isUploadingPhoto ? "Uploading Photo..." : "Upload Photos (JPG/PNG)"}
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
                          {isUploadingVideo ? "Uploading Video..." : "Upload Video Tour (.mp4)"}
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
                        <Label htmlFor="prop-thumb" className="text-[11px] text-muted-foreground">
                          Or Direct Cover Photo URL (Drive, OneDrive, Web)
                        </Label>
                        <Input
                          id="prop-thumb"
                          className="h-8 text-xs font-mono"
                          placeholder="https://drive.google.com/file/d/... or https://..."
                          {...form.register("thumbnailUrl")}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="prop-video" className="text-[11px] text-muted-foreground">
                          Or Walkthrough Tour Video URL (.mp4)
                        </Label>
                        <Input
                          id="prop-video"
                          className="h-8 text-xs font-mono"
                          placeholder="https://.../walkthrough.mp4"
                          {...form.register("videoWalkthroughUrl")}
                        />
                      </div>
                    </div>

                    {/* Additional Gallery Photo URLs */}
                    <div className="space-y-1 rounded-lg border border-dashed bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="prop-gallery-links" className="text-xs font-semibold flex items-center gap-1.5">
                          <ImagePlus className="h-3 w-3 text-primary" />
                          Additional Gallery Image URLs (One link per line)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {addGalleryUrlsText.split(/[\n,]+/).filter((u) => u.trim().length > 5).length} photo links
                        </span>
                      </div>
                      <textarea
                        id="prop-gallery-links"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={"https://drive.google.com/file/d/1A2B3C4D...\nhttps://onedrive.live.com/embed?resid=...\nhttps://images.unsplash.com/..."}
                        value={addGalleryUrlsText}
                        onChange={(e) => setAddGalleryUrlsText(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        💡 <strong>No file uploads required:</strong> You can paste your Google Drive, OneDrive, Dropbox, or CDN photo links directly. For Google Drive files, simply ensure sharing is set to <em>&ldquo;Anyone with the link can view&rdquo;</em> and PropFlow will stream them automatically!
                      </p>
                    </div>

                    {/* Live Photo Preview */}
                    {(uploadedPhotoPreview || form.watch("thumbnailUrl")) && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={uploadedPhotoPreview || form.watch("thumbnailUrl") || ""}
                            alt="Property Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold block">Cover Image Attached</span>
                          <span className="text-[10px] text-muted-foreground">
                            Will be displayed in Showcase, Quotations, and Social Marketing Cards.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 6: STOREFRONT DESCRIPTION */}
                  <div className="rounded-xl border bg-card/60 p-4 space-y-2">
                    <Label htmlFor="prop-desc" className="text-xs font-semibold flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Storefront Highlight &amp; Marketing Teaser
                    </Label>
                    <Input
                      id="prop-desc"
                      className="h-9 text-xs"
                      placeholder="e.g. Corner 2BR penthouse overlooking golf course with floor-to-ceiling glass and smart home automation"
                      {...form.register("description")}
                    />
                  </div>
                </div>

                {/* FIXED STICKY FOOTER */}
                <DialogFooter className="px-6 py-3.5 border-t bg-card/95 backdrop-blur shrink-0 flex items-center justify-between sm:justify-between w-full">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCheck className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                    <span>
                      Publishing to:{" "}
                      <strong className="text-foreground">
                        {agentProfile?.fullName || "My Agent Portfolio"}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs"
                      onClick={() => setIsAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs"
                      onClick={() => setOpenQuoteAfterSave(false)}
                    >
                      Save to Inventory
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 text-xs gap-1.5 shadow-sm"
                      onClick={() => setOpenQuoteAfterSave(true)}
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Save &amp; Configure Quotation →
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scope Filtering: My Listed Properties vs Accredited Inventory vs All */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={portfolioView === "MY_LISTINGS" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setPortfolioView("MY_LISTINGS")}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Listed Properties</span>
            <Badge
              variant={portfolioView === "MY_LISTINGS" ? "secondary" : "outline"}
              className="ml-1 h-4 px-1.5 text-[10px]"
            >
              {myListedProperties.length}
            </Badge>
          </Button>

          <Button
            variant={portfolioView === "ACCREDITED" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setPortfolioView("ACCREDITED")}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Accredited Developer Masterlist</span>
            <Badge
              variant={portfolioView === "ACCREDITED" ? "secondary" : "outline"}
              className="ml-1 h-4 px-1.5 text-[10px]"
            >
              {accreditedProperties.length}
            </Badge>
          </Button>

          <Button
            variant={portfolioView === "ALL" ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setPortfolioView("ALL")}
          >
            <span>All Inventory</span>
            <Badge
              variant={portfolioView === "ALL" ? "secondary" : "outline"}
              className="ml-1 h-4 px-1.5 text-[10px]"
            >
              {allPropertiesCombined.length}
            </Badge>
          </Button>
        </div>

        {user && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
            Isolated workspace for: <strong className="text-foreground">{agentProfile?.fullName || user.email}</strong>
          </span>
        )}
      </div>

      <Tabs defaultValue="cards" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="cards" className="text-xs gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Unit Cards ({displayedProperties.length})
            </TabsTrigger>
            <TabsTrigger value="stacking" className="text-xs gap-1.5">
              <Grid3X3 className="h-3.5 w-3.5 text-primary" />
              Interactive Tower Stacking Plan
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              On Hold / Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
              Sold
            </span>
          </div>
        </div>

        {/* TAB 1: INVENTORY CARDS */}
        <TabsContent value="cards" className="mt-0">
          {displayedProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">No Listed Properties Yet</h3>
              <p className="max-w-md text-xs text-muted-foreground mt-1 mb-4">
                {agentProfile?.fullName || "You"} haven&apos;t added any exclusive property listings to your agent account. Add your direct listings or import units via CSV to manage them here.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Your First Listing
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsBulkOpen(true)}>
                  <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  Bulk Import CSV
                </Button>
                <Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setPortfolioView("ACCREDITED")}>
                  <Building2 className="h-3.5 w-3.5" />
                  Browse Developer Masterlist
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayedProperties.map((prop) => (
                <Card key={prop.id} className="flex flex-col justify-between overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            prop.status === "AVAILABLE"
                              ? "won"
                              : prop.status === "SOLD"
                              ? "secondary"
                              : "reservation"
                          }
                          className="text-[10px]"
                        >
                          {prop.status.replace(/_/g, " ")}
                        </Badge>

                        {prop.listedByAgentId === user?.uid ? (
                          <Badge variant="won" className="text-[9px] gap-1">
                            <UserCheck className="h-2.5 w-2.5" />
                            My Listing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">
                            Accredited Master
                          </Badge>
                        )}

                        <select
                          aria-label="Update unit status"
                          value={prop.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as Property["status"];
                            updatePropertyStatus(prop.id, nextStatus);
                            toast.success(
                              `${prop.unitCode} status updated to ${nextStatus}`
                            );
                          }}
                          className="h-6 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground focus:outline-none"
                        >
                          <option value="AVAILABLE">Set Available</option>
                          <option value="ON_HOLD">Set On Hold</option>
                          <option value="RESERVED">Set Reserved</option>
                          <option value="SOLD">Set Sold</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {prop.turnoverDate}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => handleOpenEdit(prop)}
                          title="Edit Property Listing"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base font-bold">
                      {prop.projectName}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {prop.unitCode} • {prop.locationCity}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-y py-2.5">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5 text-foreground" />
                        {prop.floorAreaSqm} sqm Floor
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
                        {prop.parkingSlots} Parking
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          Total List Price
                        </span>
                        <span className="text-lg font-bold tabular-nums">
                          {formatCurrency(prop.listPrice, "PHP", 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">
                          Reservation Fee
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(prop.reservationFee, "PHP", 0)}
                        </span>
                      </div>
                    </div>

                    {prop.status === "AVAILABLE" &&
                      (propertyMatchCountMap.get(prop.id) ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMatchProperty(prop);
                            setIsMatchAlertOpen(true);
                          }}
                          className="w-full flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <BellRing className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {propertyMatchCountMap.get(prop.id)} Matching Pipeline Buyer
                              {propertyMatchCountMap.get(prop.id) === 1 ? "" : "s"}
                            </span>
                          </span>
                          <span className="text-[10px] font-semibold shrink-0 ml-2">
                            Send Alert →
                          </span>
                        </button>
                      )}
                  </CardContent>

                  <CardFooter className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-7 text-xs sm:text-[11px] px-2 gap-1.5"
                      asChild
                    >
                      <Link href={`/showcase?propertyId=${prop.id}`}>
                        <Film className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Media</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-7 text-xs sm:text-[11px] px-2 gap-1.5 text-primary hover:text-primary"
                      onClick={() => {
                        setSelectedSocialProperty(prop);
                        setIsSocialModalOpen(true);
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Social</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-7 text-xs sm:text-[11px] px-2 gap-1.5"
                      onClick={() => handleOpenEdit(prop)}
                    >
                      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      className="w-full h-8 sm:h-7 text-xs sm:text-[11px] px-2 gap-1.5 bg-primary text-primary-foreground font-semibold"
                      asChild
                    >
                      <Link href={`/quotations?propertyId=${prop.id}`}>
                        <Calculator className="h-3.5 w-3.5 shrink-0" />
                        <span>Quote</span>
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: INTERACTIVE TOWER / BLOCK-LOT STACKING PLAN */}
        <TabsContent value="stacking" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="min-w-0 lg:col-span-8">
              <CardHeader className="border-b bg-muted/20 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      The Meridian Park Residences — Tower B Live Stacking Plan
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Click any unit cell to inspect floor area, pricing, availability status, or launch a one-click buyer computation.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] w-fit">
                    {stackingMatrix.length * 5} Units Mapped
                  </Badge>
                </div>

                {/* Stacking Plan Zone & Status Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t mt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Tower Zone:</span>
                    {(
                      [
                        { id: "ALL", label: "All Floors" },
                        { id: "PENTHOUSE", label: "Penthouse (42F)" },
                        { id: "HIGH", label: "High (26F-38F)" },
                        { id: "MID", label: "Mid (18F-24F)" },
                        { id: "LOW", label: "Low (6F-15F)" },
                      ] as const
                    ).map((z) => (
                      <Button
                        key={z.id}
                        type="button"
                        variant={stackZoneFilter === z.id ? "default" : "outline"}
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setStackZoneFilter(z.id)}
                      >
                        {z.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Status:</span>
                    {(
                      [
                        { id: "ALL", label: "All" },
                        { id: "AVAILABLE", label: "Available" },
                        { id: "RESERVED", label: "Reserved" },
                        { id: "SOLD", label: "Sold" },
                      ] as const
                    ).map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        variant={stackStatusFilter === s.id ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-6 text-[10px] px-2",
                          stackStatusFilter === s.id && "bg-muted font-bold text-foreground border border-border"
                        )}
                        onClick={() => setStackStatusFilter(s.id)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 overflow-x-auto">
                <div className="min-w-[540px] space-y-2">
                  {stackingMatrix.map((row) => (
                    <div
                      key={row.floor}
                      className="grid grid-cols-6 items-center gap-2"
                    >
                      <div className="rounded-md bg-muted/50 px-2.5 py-3 text-center text-xs font-bold text-muted-foreground">
                        {row.floorLabel}
                      </div>
                      {row.slots.map((cell) => {
                        const isSelected =
                          selectedStackCell?.unitNumber === cell.unitNumber;
                        const matchesStatus =
                          stackStatusFilter === "ALL" ||
                          cell.status === stackStatusFilter;
                        return (
                          <button
                            key={cell.unitNumber}
                            type="button"
                            onClick={() => setSelectedStackCell(cell)}
                            className={cn(
                              "flex flex-col items-start justify-between rounded-lg border p-2 text-left transition-all hover:scale-[1.02]",
                              cell.status === "AVAILABLE" &&
                                "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
                              (cell.status === "RESERVED" ||
                                cell.status === "ON_HOLD") &&
                                "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20",
                              cell.status === "SOLD" &&
                                "border-slate-300 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-800",
                              !matchesStatus && "opacity-25 grayscale-[30%]",
                              isSelected && "ring-2 ring-primary ring-offset-1"
                            )}
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span className="text-[11px] font-bold truncate">
                                {cell.unitNumber
                                  .replace("Tower B - ", "")
                                  .split(" ")[0]}
                              </span>
                              <span
                                className={cn(
                                  "h-2 w-2 shrink-0 rounded-full",
                                  cell.status === "AVAILABLE" &&
                                    "bg-emerald-500",
                                  (cell.status === "RESERVED" ||
                                    cell.status === "ON_HOLD") &&
                                    "bg-amber-500",
                                  cell.status === "SOLD" && "bg-slate-400"
                                )}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate w-full">
                              {cell.configLabel}
                            </span>
                            <span className="mt-1 text-[11px] font-semibold tabular-nums">
                              {formatCompactCurrency(cell.listPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Inspector Panel for Selected Stack Unit */}
            <Card className="min-w-0 lg:col-span-4 h-fit">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Stacking Unit Inspector
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedStackCell
                    ? `Inspecting ${selectedStackCell.unitNumber}`
                    : "Select any floor/unit cell on the left grid"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {selectedStackCell ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          selectedStackCell.status === "AVAILABLE"
                            ? "won"
                            : selectedStackCell.status === "SOLD"
                            ? "secondary"
                            : "reservation"
                        }
                        className="text-[10px]"
                      >
                        {selectedStackCell.status}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {selectedStackCell.floorLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold">
                        {selectedStackCell.unitNumber}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        The Meridian Park Residences • BGC, Taguig
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 rounded-lg border bg-muted/20 p-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Configuration
                        </span>
                        <span className="font-semibold">
                          {selectedStackCell.configLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Gross List Price
                        </span>
                        <span className="font-bold text-primary tabular-nums">
                          {formatCurrency(selectedStackCell.listPrice, "PHP", 0)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        disabled={selectedStackCell.status === "SOLD"}
                        onClick={() =>
                          handleComputeFromStackCell(selectedStackCell)
                        }
                      >
                        <Calculator className="h-3.5 w-3.5" />
                        {selectedStackCell.status === "SOLD"
                          ? "Unit Already Sold"
                          : "Launch Quotation Calculator →"}
                      </Button>

                      {selectedStackCell.linkedPropertyId && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {(
                            [
                              "AVAILABLE",
                              "ON_HOLD",
                              "RESERVED",
                              "SOLD",
                            ] as const
                          ).map((st) => (
                            <Button
                              key={st}
                              type="button"
                              variant={
                                selectedStackCell.status === st
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="h-7 text-[10px]"
                              onClick={() => {
                                if (selectedStackCell.linkedPropertyId) {
                                  updatePropertyStatus(
                                    selectedStackCell.linkedPropertyId,
                                    st
                                  );
                                  setSelectedStackCell({
                                    ...selectedStackCell,
                                    status: st,
                                  });
                                  toast.success(
                                    `Updated ${selectedStackCell.unitNumber} to ${st}`
                                  );
                                }
                              }}
                            >
                              {st.replace(/_/g, " ")}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Click any unit box in the Tower Stacking Plan to inspect its floor area, price, and launch a sample quotation.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 1080x1080 Luxury Social Media Card Generator Modal */}
      <SocialShareCardModal
        property={selectedSocialProperty}
        isOpen={isSocialModalOpen}
        onClose={() => {
          setIsSocialModalOpen(false);
          setSelectedSocialProperty(null);
        }}
      />

      {/* Edit Property Listing Modal */}
      <EditPropertyModal
        property={editingProperty}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDeleteProperty}
      />

      {/* Smart Property Match Alert Modal */}
      <PropertyMatchAlertModal
        property={selectedMatchProperty}
        open={isMatchAlertOpen}
        onOpenChange={(open) => {
          setIsMatchAlertOpen(open);
          if (!open) setSelectedMatchProperty(null);
        }}
      />
    </div>
  );
}
