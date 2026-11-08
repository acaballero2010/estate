"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  GitFork,
  GripVertical,
  Kanban,
  LayoutList,
  Loader2,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UploadCloud,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  CreateLeadInputSchema,
  STANDARD_KYC_REQUIREMENTS,
  type BuyerDocument,
  type CreateLeadInput,
  type Lead,
  type PipelineStage,
  PIPELINE_STAGE_LABELS,
} from "@/lib/schemas";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import {
  calculateLeadReadiness,
  type LeadReadinessAnalysis,
} from "@/lib/lead-scoring";
import { useCrmStore } from "@/lib/store/crm-store";
import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KANBAN_STAGES: PipelineStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "SITE_TRIPPING",
  "PROPOSAL_SENT",
  "RESERVATION",
  "CLOSED_WON",
];

const STAGE_BADGE_VARIANT: Record<PipelineStage, BadgeProps["variant"]> = {
  NEW_LEAD: "new",
  CONTACTED: "contacted",
  SITE_TRIPPING: "tripping",
  PROPOSAL_SENT: "proposal",
  RESERVATION: "reservation",
  CLOSED_WON: "won",
  CLOSED_LOST: "lost",
};

export default function PipelinePage() {
  const {
    leads,
    properties,
    quotations,
    moveLeadStage,
    addLead,
    bulkAddLeads,
    addLeadNote,
    addLeadDocument,
    updateLeadDocumentStatus,
    deleteLeadDocument,
  } = useCrmStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [onlyHotLeads, setOnlyHotLeads] = React.useState(false);
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] =
    React.useState<PipelineStage | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = React.useState(false);
  const [isBulkOpen, setIsBulkOpen] = React.useState(false);
  const [isParsingCsv, setIsParsingCsv] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState("");
  const csvFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync activeLead with store updates
  const selectedLead = React.useMemo(
    () => leads.find((l) => l.id === activeLead?.id) ?? null,
    [leads, activeLead]
  );

  const leadQuotations = React.useMemo(() => {
    if (!selectedLead) return [];
    return quotations
      .filter((q) => q.leadId === selectedLead.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotations, selectedLead]);

  // Precompute readiness analysis for all leads
  const leadReadinessMap = React.useMemo(() => {
    const map = new Map<string, LeadReadinessAnalysis>();
    for (const lead of leads) {
      map.set(lead.id, calculateLeadReadiness(lead, properties, quotations));
    }
    return map;
  }, [leads, properties, quotations]);

  // Selected lead's detailed analysis
  const selectedLeadAnalysis = React.useMemo(() => {
    if (!selectedLead) return null;
    return (
      leadReadinessMap.get(selectedLead.id) ??
      calculateLeadReadiness(selectedLead, properties, quotations)
    );
  }, [selectedLead, leadReadinessMap, properties, quotations]);

  // Document KYC Tracker State for Selected Lead
  const [uploadingDocType, setUploadingDocType] = React.useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = React.useState<string | null>(null);
  const [rejectReasonDraft, setRejectReasonDraft] = React.useState<string>("");
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);

  const selectedLeadKyc = React.useMemo(() => {
    if (!selectedLead) return null;
    const docs = selectedLead.documents ?? [];
    const requiredList = STANDARD_KYC_REQUIREMENTS.filter((r) => r.required);
    const missingRequired = requiredList.filter(
      (r) => !docs.some((d) => d.type === r.type && (d.verified || d.status === "VERIFIED"))
    );
    const verifiedCount = requiredList.filter((r) =>
      docs.some((d) => d.type === r.type && (d.verified || d.status === "VERIFIED"))
    ).length;
    const uploadedCount = requiredList.filter((r) =>
      docs.some((d) => d.type === r.type)
    ).length;
    const progressPct = Math.round(
      (verifiedCount / (requiredList.length || 1)) * 100
    );

    const matchingQuote = leadQuotations[0];
    const portalUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/quote/${matchingQuote?.shareToken || "portal"}?leadId=${selectedLead.id}`
        : `https://propflow.ph/quote/portal?leadId=${selectedLead.id}`;

    const missingListText = missingRequired
      .map((r, i) => `${i + 1}. ${r.label} — ${r.description}`)
      .join("\n");

    const followUpMessage = `Hi ${selectedLead.firstName}! Good day.

To facilitate your buyer accreditation and reservation file${
      matchingQuote
        ? ` for ${matchingQuote.calculationInput.projectName} (${matchingQuote.calculationInput.unitCode})`
        : ""
    }, our compliance team needs the following remaining documentary requirement${
      missingRequired.length > 1 ? "s" : ""
    }:

${missingListText}

You can snap a photo or upload your files securely directly via your personal link:
👉 ${portalUrl}

Please let me know once uploaded so we can verify them promptly. Thank you!`;

    return {
      docs,
      requiredList,
      missingRequired,
      verifiedCount,
      uploadedCount,
      progressPct,
      portalUrl,
      followUpMessage,
    };
  }, [selectedLead, leadQuotations]);

  const handleAgentUploadDoc = async (
    type: BuyerDocument["type"],
    file: File,
    customName?: string
  ) => {
    if (!selectedLead) return;
    setUploadingDocType(type);
    try {
      const fileUrl = await uploadMediaFile(file, "kyc");
      addLeadDocument(selectedLead.id, {
        name: customName || file.name,
        type,
        fileUrl,
        verified: true,
      });
      toast.success(`Uploaded & verified ${customName || file.name}`);
    } catch (err) {
      console.error("Failed to upload KYC doc:", err);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleVerifyDocument = (docId: string) => {
    if (!selectedLead) return;
    updateLeadDocumentStatus(selectedLead.id, docId, "VERIFIED");
    toast.success("Document verified & approved ✓");
  };

  const handleConfirmReject = (docId: string) => {
    if (!selectedLead) return;
    const remarks =
      rejectReasonDraft.trim() ||
      "Document did not pass verification criteria. Please provide a clear, valid copy.";
    updateLeadDocumentStatus(selectedLead.id, docId, "REJECTED", remarks);
    toast.error("Document marked as Rejected. Status updated for client.");
    setRejectingDocId(null);
    setRejectReasonDraft("");
  };

  const handleDeleteDocument = (docId: string) => {
    if (!selectedLead) return;
    deleteLeadDocument(selectedLead.id, docId);
    toast.success("Document removed.");
  };

  // Filter leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const analysis = leadReadinessMap.get(lead.id);
      if (onlyHotLeads && analysis?.tier !== "HOT" && lead.priority !== "HOT") {
        return false;
      }
      const matchesPriority =
        priorityFilter === "ALL" || lead.priority === priorityFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesPriority;
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const locMatch = lead.preferredLocations.some((loc) =>
        loc.toLowerCase().includes(q)
      );
      return (
        matchesPriority &&
        (fullName.includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          locMatch)
      );
    });
  }, [leads, searchQuery, priorityFilter, onlyHotLeads, leadReadinessMap]);

  // Drag & Drop handlers with optimistic UI + Toast
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    setDraggedLeadId(null);
    setDragOverStage(null);

    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;

    moveLeadStage(leadId, targetStage);
    toast.success(
      `Moved ${lead.firstName} ${lead.lastName} to ${PIPELINE_STAGE_LABELS[targetStage]}`
    );
  };

  const handleManualStageChange = (
    lead: Lead,
    targetStage: PipelineStage
  ) => {
    if (lead.stage === targetStage) return;
    moveLeadStage(lead.id, targetStage);
    toast.success(
      `Updated ${lead.firstName} ${lead.lastName} → ${PIPELINE_STAGE_LABELS[targetStage]}`
    );
  };

  // New Lead Form with React Hook Form + Zod
  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadInputSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+63 917 ",
      stage: "NEW_LEAD",
      source: "MANUAL_ENTRY",
      priority: "HIGH",
      budgetMin: 5000000,
      budgetMax: 12000000,
      preferredLocations: ["Bonifacio Global City, Taguig"],
      preferredPropertyTypes: ["CONDOMINIUM"],
      financingPreference: "BANK",
      notes: "",
    },
  });

  const onCreateLeadSubmit = (values: CreateLeadInput) => {
    const created = addLead(values);
    toast.success(
      `Lead ${created.firstName} ${created.lastName} added to pipeline`
    );
    setIsNewLeadOpen(false);
    form.reset();
  };

  const handleAddNote = () => {
    if (!selectedLead || !noteDraft.trim()) return;
    addLeadNote(selectedLead.id, noteDraft.trim());
    setNoteDraft("");
    toast.success("Activity note saved to lead timeline");
  };

  // CSV Template Export
  const handleDownloadLeadCsvTemplate = () => {
    const templateRows = [
      {
        firstName: "Rafael",
        lastName: "Zobel",
        email: "rafael.zobel@ayala.com.ph",
        phone: "+63 917 888 1234",
        stage: "NEW_LEAD",
        source: "PORTAL_INQUIRY",
        priority: "HOT",
        budgetMin: "15000000",
        budgetMax: "25000000",
        preferredLocations: "Bonifacio Global City, Taguig; Makati CBD",
        preferredPropertyTypes: "CONDOMINIUM",
        financingPreference: "BANK",
        notes: "Looking for high-floor corner 2BR/3BR with 2 parking slots.",
      },
      {
        firstName: "Ma. Teresa",
        lastName: "Del Rosario",
        email: "teresa.delrosario@gmail.com",
        phone: "+63 920 555 7890",
        stage: "CONTACTED",
        source: "REFERRAL",
        priority: "HIGH",
        budgetMin: "9000000",
        budgetMax: "14000000",
        preferredLocations: "Nuvali, Santa Rosa, Laguna",
        preferredPropertyTypes: "HOUSE_AND_LOT",
        financingPreference: "BANK",
        notes: "Family looking for 4BR single detached house, moving Q1 2027.",
      },
    ];

    const csvContent = Papa.unparse(templateRows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "propflow-leads-template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV lead template");
  };

  // Export Active Filtered Leads
  const handleExportFilteredLeads = () => {
    if (filteredLeads.length === 0) {
      toast.error("No leads available to export.");
      return;
    }

    const exportRows = filteredLeads.map((l) => ({
      "First Name": l.firstName,
      "Last Name": l.lastName,
      Email: l.email,
      Phone: l.phone,
      Stage: PIPELINE_STAGE_LABELS[l.stage],
      Priority: l.priority,
      Source: l.source.replace(/_/g, " "),
      "Min Budget (PHP)": l.budgetMin,
      "Max Budget (PHP)": l.budgetMax,
      "Preferred Locations": l.preferredLocations.join("; "),
      "Property Types": l.preferredPropertyTypes.join("; "),
      Financing: l.financingPreference,
      Notes: l.notes || "",
      "Created At": new Date(l.createdAt).toLocaleDateString("en-PH"),
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `propflow-leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLeads.length} leads to CSV!`);
  };

  // Bulk CSV Upload Handler
  const handleLeadCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCsv(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedInputs: CreateLeadInput[] = results.data
            .filter((row) => row.firstName?.trim() || row.lastName?.trim())
            .map((row) => ({
              firstName: row.firstName?.trim() || "Prospective",
              lastName: row.lastName?.trim() || "Buyer",
              email: row.email?.trim() || "",
              phone: row.phone?.trim() || "+63 900 000 0000",
              stage: (row.stage?.trim() || "NEW_LEAD") as PipelineStage,
              source: (row.source?.trim() || "MANUAL_ENTRY") as CreateLeadInput["source"],
              priority: (row.priority?.trim() || "MEDIUM") as CreateLeadInput["priority"],
              budgetMin: parseFloat(row.budgetMin || "3000000") || 3000000,
              budgetMax: parseFloat(row.budgetMax || "10000000") || 10000000,
              preferredLocations: row.preferredLocations
                ? row.preferredLocations.split(";").map((s) => s.trim()).filter(Boolean)
                : ["Metro Manila"],
              preferredPropertyTypes: row.preferredPropertyTypes
                ? (row.preferredPropertyTypes.split(";").map((s) => s.trim()) as CreateLeadInput["preferredPropertyTypes"])
                : ["CONDOMINIUM"],
              financingPreference: (row.financingPreference?.trim() || "BANK") as CreateLeadInput["financingPreference"],
              notes: row.notes?.trim() || "Imported via CSV batch.",
            }));

          if (parsedInputs.length === 0) {
            toast.error("No valid lead records found in CSV file.");
            return;
          }

          bulkAddLeads(parsedInputs);
          toast.success(`Successfully imported ${parsedInputs.length} leads into pipeline!`);
          setIsBulkOpen(false);
          if (csvFileInputRef.current) {
            csvFileInputRef.current.value = "";
          }
        } catch {
          toast.error("Failed to parse CSV format. Please verify columns match the template.");
        } finally {
          setIsParsingCsv(false);
        }
      },
      error: () => {
        toast.error("Could not read uploaded CSV file.");
        setIsParsingCsv(false);
      },
    });
  };

  return (
    <div className="flex flex-col h-full min-w-0 max-w-full overflow-x-hidden space-y-4 p-4 md:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Lead Pipeline &amp; Deal Flow
          </h1>
          <p className="text-xs text-muted-foreground">
            Drag cards across stages or tap any buyer to inspect KYC docs, tripping notes, and quotations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter name, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {priorityFilter === "ALL" ? "All Priorities" : priorityFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">
                Filter Lead Priority
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["ALL", "HOT", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className="text-xs"
                >
                  {p === "ALL" ? "All Leads" : `${p} Priority`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hot Leads Only Quick Filter Toggle */}
          <Button
            type="button"
            variant={onlyHotLeads ? "destructive" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs gap-1.5 transition-all",
              onlyHotLeads && "bg-rose-600 hover:bg-rose-700 text-white shadow-sm ring-2 ring-rose-500/20"
            )}
            onClick={() => setOnlyHotLeads(!onlyHotLeads)}
          >
            <Flame className={cn("h-3.5 w-3.5", onlyHotLeads ? "fill-white" : "text-rose-500")} />
            <span>Hot Leads Only</span>
            {onlyHotLeads && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                {filteredLeads.length}
              </span>
            )}
          </Button>

          {/* Export Filtered Leads to CSV */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExportFilteredLeads}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>

          {/* Bulk Import Leads Modal */}
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Bulk</span> Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Bulk Import Leads (CSV)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Import prospect lists from property expos, Facebook ads, or partner broker networks directly into your pipeline.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">1. Download Lead CSV Template</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[11px] gap-1"
                      onClick={handleDownloadLeadCsvTemplate}
                    >
                      <Download className="h-3 w-3" />
                      Download .CSV
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Includes columns for First Name, Last Name, Email, Phone, Stage, Source, Priority, Min/Max Budget, and Preferences.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold">2. Upload Populated CSV File</span>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/10 p-6 cursor-pointer hover:bg-muted/20 transition-colors">
                    {isParsingCsv ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                    <span className="text-xs font-medium text-center">
                      {isParsingCsv ? "Parsing Lead Records..." : "Click or drop your populated lead CSV file here"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Accepts UTF-8 .csv files</span>
                    <input
                      ref={csvFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleLeadCsvFileUpload}
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

          <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Capture Real Estate Lead</DialogTitle>
                <DialogDescription>
                  Enter buyer contact details, target budget, and preferred property type.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(onCreateLeadSubmit)}
                className="space-y-3 py-2"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. Bianca"
                      {...form.register("firstName")}
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-[11px] text-destructive">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Elizalde"
                      {...form.register("lastName")}
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-[11px] text-destructive">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Mobile / Viber</Label>
                    <Input id="phone" {...form.register("phone")} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="buyer@email.com"
                      {...form.register("email")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="budgetMin">Min Budget (₱)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      {...form.register("budgetMin", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="budgetMax">Max Budget (₱)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      {...form.register("budgetMax", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location">Preferred City / Estate</Label>
                  <Input
                    id="location"
                    defaultValue="Bonifacio Global City, Taguig"
                    onChange={(e) =>
                      form.setValue("preferredLocations", [
                        e.target.value || "Metro Manila",
                      ])
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes">Initial Buyer Notes</Label>
                  <Input
                    id="notes"
                    placeholder="e.g. Looking for 2BR RFO or near turnover"
                    {...form.register("notes")}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewLeadOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save to Pipeline
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Switcher: Kanban vs Compact Table */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="kanban" className="text-xs gap-1.5 h-6">
              <Kanban className="h-3.5 w-3.5" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs gap-1.5 h-6">
              <LayoutList className="h-3.5 w-3.5" />
              Lead Table ({filteredLeads.length})
            </TabsTrigger>
          </TabsList>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Total Pipeline Potential:{" "}
            <strong className="text-foreground tabular-nums">
              {formatCompactCurrency(
                filteredLeads.reduce((acc, l) => acc + l.budgetMax, 0)
              )}
            </strong>
          </span>
        </div>

        {/* KANBAN BOARD VIEW */}
        <TabsContent value="kanban" className="flex-1 mt-3 min-w-0">
          <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
            {KANBAN_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(
                (l) => l.stage === stage
              );
              const stageVolume = stageLeads.reduce(
                (acc, l) => acc + l.budgetMax,
                0
              );
              const isDropTarget = dragOverStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={cn(
                    "flex w-[285px] shrink-0 snap-center flex-col rounded-xl border bg-muted/30 p-2.5 transition-colors",
                    isDropTarget && "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                >
                  {/* Column Header */}
                  <div className="mb-2.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={STAGE_BADGE_VARIANT[stage]}
                        className="text-[11px]"
                      >
                        {PIPELINE_STAGE_LABELS[stage]}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {formatCompactCurrency(stageVolume)}
                    </span>
                  </div>

                  {/* Cards Stack */}
                  <div className="flex flex-1 flex-col gap-2.5 min-h-[380px]">
                    {stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setActiveLead(lead)}
                        className={cn(
                          "group cursor-pointer border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.99]",
                          draggedLeadId === lead.id && "opacity-40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div>
                              <h3 className="text-xs font-semibold leading-tight">
                                {lead.firstName} {lead.lastName}
                              </h3>
                              <span className="text-[10px] text-muted-foreground">
                                {lead.source.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(() => {
                              const analysis = leadReadinessMap.get(lead.id);
                              if (!analysis) return null;
                              return (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-4 px-1.5 text-[9px] gap-0.5 font-semibold",
                                    analysis.badgeClass
                                  )}
                                  title={`Qualification Score: ${analysis.totalScore}/100 • ${analysis.tierLabel}`}
                                >
                                  {analysis.tier === "HOT" ? (
                                    <Flame className="h-2.5 w-2.5 fill-current text-rose-500" />
                                  ) : analysis.tier === "HIGH" ? (
                                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                  ) : (
                                    <TrendingUp className="h-2.5 w-2.5" />
                                  )}
                                  <span>{analysis.totalScore}</span>
                                </Badge>
                              );
                            })()}
                            {lead.priority === "HOT" && (
                              <Badge
                                variant="destructive"
                                className="h-4 px-1 text-[9px] gap-0.5"
                              >
                                <Flame className="h-2.5 w-2.5" />
                                HOT
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs">
                                  Move Stage To
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {KANBAN_STAGES.map((st) => (
                                  <DropdownMenuItem
                                    key={st}
                                    disabled={st === lead.stage}
                                    onClick={() =>
                                      handleManualStageChange(lead, st)
                                    }
                                    className="text-xs"
                                  >
                                    {PIPELINE_STAGE_LABELS[st]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Budget & Location */}
                        <div className="mt-2.5 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Wallet className="h-3 w-3 text-primary" />
                              Budget:
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {formatCompactCurrency(lead.budgetMin)} –{" "}
                              {formatCompactCurrency(lead.budgetMax)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {lead.preferredLocations.join(", ")}
                            </span>
                          </div>
                        </div>

                        {/* Tags & Quick Actions Footer */}
                        <div className="mt-3 flex items-center justify-between border-t pt-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant="outline"
                              className="h-4 px-1.5 text-[9px] font-normal"
                            >
                              {lead.financingPreference}
                            </Badge>
                            {(() => {
                              const requiredKyc = STANDARD_KYC_REQUIREMENTS.filter(
                                (r) => r.required
                              );
                              const verifiedCount = requiredKyc.filter((r) =>
                                lead.documents.some(
                                  (d) =>
                                    d.type === r.type &&
                                    (d.verified || d.status === "VERIFIED")
                                )
                              ).length;
                              const uploadedCount = requiredKyc.filter((r) =>
                                lead.documents.some((d) => d.type === r.type)
                              ).length;

                              if (
                                verifiedCount === requiredKyc.length &&
                                requiredKyc.length > 0
                              ) {
                                return (
                                  <Badge
                                    variant="won"
                                    className="h-4 px-1.5 text-[9px] gap-0.5"
                                    title="All required KYC documents verified"
                                  >
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    KYC Complete
                                  </Badge>
                                );
                              }
                              if (uploadedCount > 0) {
                                return (
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1.5 text-[9px] gap-0.5 border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                                    title={`${uploadedCount} of ${requiredKyc.length} required KYC documents submitted`}
                                  >
                                    KYC {uploadedCount}/{requiredKyc.length}
                                  </Badge>
                                );
                              }
                              if (
                                lead.stage === "PROPOSAL_SENT" ||
                                lead.stage === "RESERVATION"
                              ) {
                                return (
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1.5 text-[9px] gap-0.5 border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10"
                                    title="No KYC documents uploaded yet"
                                  >
                                    KYC Missing
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              asChild
                              title="Open in Messenger Hub"
                            >
                              <Link href={`/inbox?leadId=${lead.id}`}>
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              asChild
                              title="Create Quotation"
                            >
                              <Link href={`/quotations?leadId=${lead.id}`}>
                                <Calculator className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Drop lead card here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* COMPACT DATA TABLE VIEW */}
        <TabsContent value="table" className="mt-3">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Target Budget</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Preferred Location
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Financing
                  </TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => setActiveLead(lead)}
                  >
                    <TableCell>
                      <div className="font-semibold text-xs">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {lead.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STAGE_BADGE_VARIANT[lead.stage]}>
                        {PIPELINE_STAGE_LABELS[lead.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const analysis = leadReadinessMap.get(lead.id);
                        if (!analysis) return null;
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-5 px-1.5 font-semibold gap-1",
                              analysis.badgeClass
                            )}
                          >
                            {analysis.tier === "HOT" ? (
                              <Flame className="h-3 w-3 fill-current text-rose-500" />
                            ) : analysis.tier === "HIGH" ? (
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            <span>{analysis.totalScore}/100</span>
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs font-medium">
                      {formatCompactCurrency(lead.budgetMin)} –{" "}
                      {formatCompactCurrency(lead.budgetMax)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {lead.preferredLocations.join(", ")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {lead.financingPreference}
                        </Badge>
                        {(() => {
                          const requiredKyc = STANDARD_KYC_REQUIREMENTS.filter(
                            (r) => r.required
                          );
                          const verifiedCount = requiredKyc.filter((r) =>
                            lead.documents.some(
                              (d) =>
                                d.type === r.type &&
                                (d.verified || d.status === "VERIFIED")
                            )
                          ).length;
                          const uploadedCount = requiredKyc.filter((r) =>
                            lead.documents.some((d) => d.type === r.type)
                          ).length;
                          if (
                            verifiedCount === requiredKyc.length &&
                            requiredKyc.length > 0
                          ) {
                            return (
                              <Badge
                                variant="won"
                                className="text-[9px] h-4 px-1"
                              >
                                KYC ✓
                              </Badge>
                            );
                          }
                          if (uploadedCount > 0) {
                            return (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 border-amber-500/40 text-amber-700 bg-amber-500/10"
                              >
                                KYC {uploadedCount}/{requiredKyc.length}
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/inbox?leadId=${lead.id}`}>Chat</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/quotations?leadId=${lead.id}`}>
                            Quote
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* LEAD DETAIL DRAWER (SHEET) */}
      <Sheet
        open={!!selectedLead}
        onOpenChange={(open) => !open && setActiveLead(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <div className="space-y-5">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2">
                  <Badge variant={STAGE_BADGE_VARIANT[selectedLead.stage]}>
                    {PIPELINE_STAGE_LABELS[selectedLead.stage]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedLead.priority} PRIORITY
                  </Badge>
                </div>
                <SheetTitle className="text-lg font-bold">
                  {selectedLead.firstName} {selectedLead.lastName}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedLead.phone} •{" "}
                  {selectedLead.email || "No email provided"}
                </SheetDescription>
              </SheetHeader>

              {/* Quick Stage Switcher */}
              <div className="space-y-1.5">
                <Label>Pipeline Stage Progression</Label>
                <div className="flex flex-wrap gap-1.5">
                  {KANBAN_STAGES.map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={
                        selectedLead.stage === st ? "default" : "outline"
                      }
                      className="h-7 text-[11px] px-2.5"
                      onClick={() => handleManualStageChange(selectedLead, st)}
                    >
                      {PIPELINE_STAGE_LABELS[st]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* AI Lead Qualification & Readiness Matrix */}
              {selectedLeadAnalysis && (
                <div className="rounded-xl border bg-card p-3.5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                          AI Buyer Qualification Matrix
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-4 px-1.5",
                              selectedLeadAnalysis.badgeClass
                            )}
                          >
                            {selectedLeadAnalysis.tierLabel}
                          </Badge>
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          PropFlow Algorithmic Buyer Score
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-serif font-bold text-primary tabular-nums">
                        {selectedLeadAnalysis.totalScore}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        /100
                      </span>
                    </div>
                  </div>

                  {/* 4 Score Pillars Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border bg-muted/20 p-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          1. Financing Profile
                        </span>
                        <span className="font-bold text-primary tabular-nums">
                          {selectedLeadAnalysis.financingScore.earned}/
                          {selectedLeadAnalysis.financingScore.max}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {selectedLeadAnalysis.financingScore.summary}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          2. Inventory Match
                        </span>
                        <span className="font-bold text-primary tabular-nums">
                          {selectedLeadAnalysis.inventoryScore.earned}/
                          {selectedLeadAnalysis.inventoryScore.max}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {selectedLeadAnalysis.inventoryScore.summary}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          3. KYC Documents
                        </span>
                        <span className="font-bold text-primary tabular-nums">
                          {selectedLeadAnalysis.kycScore.earned}/
                          {selectedLeadAnalysis.kycScore.max}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {selectedLeadAnalysis.kycScore.summary}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-muted/20 p-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          4. Engagement Velocity
                        </span>
                        <span className="font-bold text-primary tabular-nums">
                          {selectedLeadAnalysis.engagementScore.earned}/
                          {selectedLeadAnalysis.engagementScore.max}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {selectedLeadAnalysis.engagementScore.summary}
                      </p>
                    </div>
                  </div>

                  {/* AI Recommended Next Action */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                        Recommended Next Action:
                      </span>
                      <p className="text-xs text-foreground font-medium">
                        {selectedLeadAnalysis.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Matching Units Link */}
                  {selectedLeadAnalysis.matchingProperties.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Top Matching Accredited Units (
                        {selectedLeadAnalysis.matchingProperties.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLeadAnalysis.matchingProperties
                          .slice(0, 3)
                          .map((prop) => (
                            <Button
                              key={prop.id}
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1"
                              asChild
                            >
                              <Link
                                href={`/quotations?leadId=${selectedLead.id}&propertyId=${prop.id}`}
                              >
                                <Calculator className="h-2.5 w-2.5 text-primary" />
                                {prop.projectName} ({prop.unitCode})
                              </Link>
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial & Property Profile */}
              <div className="grid grid-cols-2 gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Budget Range
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(selectedLead.budgetMin, "PHP", 0)} –{" "}
                    {formatCurrency(selectedLead.budgetMax, "PHP", 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Financing Target
                  </span>
                  <span className="font-semibold">
                    {selectedLead.financingPreference}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">
                    Preferred Locations & Property Types
                  </span>
                  <span className="font-medium">
                    {selectedLead.preferredLocations.join(" • ")} (
                    {selectedLead.preferredPropertyTypes.join(", ")})
                  </span>
                </div>
              </div>

              {/* Direct Action Accelerators */}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="w-full text-xs gap-1.5" asChild>
                  <Link href={`/quotations?leadId=${selectedLead.id}`}>
                    <Calculator className="h-3.5 w-3.5" />
                    Generate Quotation
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs gap-1.5"
                  asChild
                >
                  <Link href={`/inbox?leadId=${selectedLead.id}`}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messenger Thread
                  </Link>
                </Button>
              </div>

              {/* Issued Quotations & Revision History */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                    Issued Quotations ({leadQuotations.length})
                  </Label>
                  <Link
                    href={`/quotations?leadId=${selectedLead.id}`}
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    New Proposal
                  </Link>
                </div>

                {leadQuotations.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground bg-muted/20">
                    No quotations generated for this buyer yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leadQuotations.map((q) => {
                      const isAccepted = q.status === "ACCEPTED";
                      const isViewed = q.status === "VIEWED";
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border bg-card/60 p-3 text-xs space-y-2 transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-foreground">
                                {q.referenceNumber}
                              </span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                Rev {q.revisionNumber || 1}
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                isAccepted ? "default" : isViewed ? "secondary" : "outline"
                              }
                              className={cn(
                                "text-[10px] uppercase font-semibold",
                                isAccepted && "bg-pipeline-won text-white"
                              )}
                            >
                              {q.status}
                            </Badge>
                          </div>

                          <div className="text-muted-foreground text-[11px] truncate">
                            {q.calculationInput.projectName} • {q.calculationInput.unitCode}
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t text-[11px]">
                            <span className="font-semibold text-foreground">
                              {formatCurrency(q.calculationInput.listPrice)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/quotations?reviseQuotationId=${q.id}`}
                                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <GitFork className="h-3 w-3" />
                                Revise
                              </Link>
                              <Link
                                href={`/quote/${q.shareToken}`}
                                target="_blank"
                                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Portal
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interaction Notes & Timeline */}
              <div className="space-y-2">
                <Label>Interaction Timeline & Tripping Notes</Label>
                <div className="rounded-lg border bg-card p-3 text-xs whitespace-pre-line leading-relaxed">
                  {selectedLead.notes || "No notes recorded yet."}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Log site tripping feedback or call summary..."
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={handleAddNote}>
                    Log Note
                  </Button>
                </div>
              </div>

              {/* Documentary Requirements & KYC Verification Manager */}
              <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        Documentary Requirements &amp; KYC
                        <Badge
                          variant={
                            selectedLeadKyc?.progressPct === 100
                              ? "won"
                              : selectedLeadKyc?.uploadedCount && selectedLeadKyc.uploadedCount > 0
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[9px] h-4 px-1.5"
                        >
                          {selectedLeadKyc?.progressPct === 100
                            ? "Complete ✓"
                            : `${selectedLeadKyc?.verifiedCount || 0}/${
                                selectedLeadKyc?.requiredList.length || 0
                              } Verified`}
                        </Badge>
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Track missing KYC documents and 1-click dispatch reminders
                      </p>
                    </div>
                  </div>

                  {selectedLeadKyc && selectedLeadKyc.missingRequired.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setIsRequestModalOpen(!isRequestModalOpen)}
                    >
                      <MessageCircle className="h-3 w-3" />
                      {isRequestModalOpen
                        ? "Hide Message"
                        : `Request Missing (${selectedLeadKyc.missingRequired.length})`}
                    </Button>
                  )}
                </div>

                {/* Progress bar */}
                {selectedLeadKyc && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {selectedLeadKyc.verifiedCount} of {selectedLeadKyc.requiredList.length} Required Verified ({selectedLeadKyc.progressPct}%)
                      </span>
                      {selectedLeadKyc.missingRequired.length > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          Missing {selectedLeadKyc.missingRequired.length} items
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          All requirements verified ✓
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          selectedLeadKyc.progressPct === 100
                            ? "bg-emerald-600"
                            : selectedLeadKyc.progressPct > 0
                            ? "bg-amber-500"
                            : "bg-destructive"
                        )}
                        style={{ width: `${selectedLeadKyc.progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 1-Click Request Missing Requirements Dispatcher Box */}
                {isRequestModalOpen && selectedLeadKyc && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        Automated Client Follow-up Dispatcher
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setIsRequestModalOpen(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-[11px] text-muted-foreground bg-background/80 p-2.5 rounded-md border whitespace-pre-line font-sans max-h-48 overflow-y-auto">
                      {selectedLeadKyc.followUpMessage}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLeadKyc.followUpMessage);
                          toast.success("Follow-up message copied to clipboard!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        Copy Message &amp; Portal Link
                      </Button>

                      {selectedLead.phone && (
                        <a
                          href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(selectedLeadKyc.followUpMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10">
                            <MessageCircle className="h-3 w-3 text-emerald-600" />
                            Send via WhatsApp
                          </Button>
                        </a>
                      )}

                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                        <Link href={`/inbox?leadId=${selectedLead.id}`}>
                          <MessageSquare className="h-3 w-3 text-primary" />
                          Send in Messenger Hub
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Requirements Checklist */}
                <div className="space-y-2 pt-1">
                  {STANDARD_KYC_REQUIREMENTS.map((req) => {
                    const existingDoc = selectedLead.documents.find(
                      (d) => d.type === req.type
                    );
                    const isVerified = existingDoc?.status === "VERIFIED" || existingDoc?.verified;
                    const isRejected = existingDoc?.status === "REJECTED";
                    const isPending = !!existingDoc && !isVerified && !isRejected;
                    const isUploadingThis = uploadingDocType === req.type;
                    const isRejectingThis = rejectingDocId === existingDoc?.id;

                    return (
                      <div
                        key={req.code}
                        className={cn(
                          "rounded-lg border p-2.5 text-xs transition-colors space-y-2",
                          isVerified
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : isRejected
                            ? "border-destructive/30 bg-destructive/5"
                            : isPending
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              {isVerified ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : isRejected ? (
                                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                              ) : isPending ? (
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span>{req.label}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {req.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge
                              variant={
                                isVerified
                                  ? "won"
                                  : isRejected
                                  ? "destructive"
                                  : isPending
                                  ? "outline"
                                  : req.required
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[9px] h-4 px-1.5"
                            >
                              {isVerified
                                ? "Verified ✓"
                                : isRejected
                                ? "Rejected"
                                : isPending
                                ? "Needs Review"
                                : req.required
                                ? "Missing"
                                : "Optional"}
                            </Badge>
                          </div>
                        </div>

                        {/* Existing Document Info & Actions */}
                        {existingDoc ? (
                          <div className="rounded-md border bg-background/80 p-2 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate font-mono font-medium">
                                  {existingDoc.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>

                            {existingDoc.remarks && (
                              <p className="text-[10px] text-destructive italic">
                                Note: {existingDoc.remarks}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t">
                              <a
                                href={existingDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View Document
                              </a>

                              <div className="flex items-center gap-1">
                                {!isVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px] gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                                    onClick={() => handleVerifyDocument(existingDoc.id)}
                                  >
                                    <Check className="h-2.5 w-2.5" />
                                    Verify
                                  </Button>
                                )}

                                {!isRejected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px] gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setRejectingDocId(
                                        rejectingDocId === existingDoc.id ? null : existingDoc.id
                                      );
                                      setRejectReasonDraft("");
                                    }}
                                  >
                                    <X className="h-2.5 w-2.5" />
                                    Reject
                                  </Button>
                                )}

                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    disabled={isUploadingThis}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleAgentUploadDoc(req.type, f);
                                      e.target.value = "";
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px] gap-1 pointer-events-none"
                                    disabled={isUploadingThis}
                                  >
                                    {isUploadingThis ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-2.5 w-2.5" />
                                    )}
                                    Replace
                                  </Button>
                                </label>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteDocument(existingDoc.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Rejection Remarks Form */}
                            {isRejectingThis && (
                              <div className="mt-2 space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                                <Label className="text-[10px] font-semibold text-destructive">
                                  Reason for Rejection (Visible to Client):
                                </Label>
                                <Input
                                  value={rejectReasonDraft}
                                  onChange={(e) => setRejectReasonDraft(e.target.value)}
                                  placeholder="e.g. Photo blurry / ID expired / Missing back page"
                                  className="h-7 text-xs bg-background"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    "Blurry copy",
                                    "Expired ID",
                                    "Need front & back",
                                    "Outdated payslip (>3 mos)",
                                  ].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setRejectReasonDraft(preset)}
                                      className="rounded bg-background px-1.5 py-0.5 text-[9px] border hover:border-primary text-muted-foreground"
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setRejectingDocId(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => handleConfirmReject(existingDoc.id)}
                                  >
                                    Confirm Rejection
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Missing Doc - Upload on Behalf Button */
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground italic">
                              Client has not submitted this yet.
                            </span>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={isUploadingThis}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleAgentUploadDoc(req.type, f);
                                  e.target.value = "";
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px] gap-1 pointer-events-none"
                                disabled={isUploadingThis}
                              >
                                {isUploadingThis ? (
                                  <>
                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloud className="h-2.5 w-2.5" />
                                    <span>Upload on Client&apos;s Behalf</span>
                                  </>
                                )}
                              </Button>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Additional Custom Buyer Documents (e.g. SPA, Bank Form) */}
                {selectedLead.documents.some(
                  (d) => !STANDARD_KYC_REQUIREMENTS.some((r) => r.type === d.type)
                ) && (
                  <div className="space-y-1.5 pt-2 border-t">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Additional Uploaded Documents:
                    </Label>
                    {selectedLead.documents
                      .filter(
                        (d) => !STANDARD_KYC_REQUIREMENTS.some((r) => r.type === d.type)
                      )
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-md border bg-card p-2 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate max-w-[200px]">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="truncate">
                              <p className="font-medium truncate">{doc.name}</p>
                              <p className="text-[9px] text-muted-foreground">
                                {doc.type.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                                <Eye className="h-2.5 w-2.5" />
                                View
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

