"use client";

import * as React from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  Loader2,
  Megaphone,
  RefreshCw,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { useCrmStore } from "@/lib/store/crm-store";
import {
  type CsvPresetType,
  type ColumnMappingConfig,
  type ImportLeadDefaults,
  type ParsedLeadPreview,
  detectColumnMapping,
  processCsvRows,
  getSampleCsvTemplate,
} from "@/lib/lead-csv-parser";
import {
  PIPELINE_STAGE_LABELS,
  type CreateLeadInput,
  type PipelineStage,
  type PropertyType,
} from "@/lib/schemas/lead";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BulkLeadImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = "UPLOAD" | "MAPPING" | "PREVIEW" | "SUCCESS";

export function BulkLeadImportModal({ open, onOpenChange }: BulkLeadImportModalProps) {
  const { leads, bulkAddLeads } = useCrmStore();

  const [step, setStep] = React.useState<WizardStep>("UPLOAD");
  const [selectedPreset, setSelectedPreset] = React.useState<CsvPresetType>("META_ADS");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  // File state
  const [file, setFile] = React.useState<File | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);

  // Mapping state
  const [mapping, setMapping] = React.useState<ColumnMappingConfig>({});

  // Defaults
  const [defaults, setDefaults] = React.useState<ImportLeadDefaults>({
    defaultStage: "NEW_LEAD",
    defaultSource: "FACEBOOK_MESSENGER",
    defaultPriority: "MEDIUM",
    defaultPropertyType: "CONDOMINIUM",
    customCampaignTag: "",
    skipDuplicates: true,
  });

  // Parsed results
  const [parsedLeads, setParsedLeads] = React.useState<ParsedLeadPreview[]>([]);
  const [importedCount, setImportedCount] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep("UPLOAD");
      setFile(null);
      setHeaders([]);
      setRawRows([]);
      setMapping({});
      setParsedLeads([]);
      setImportedCount(0);
    }
  }, [open]);

  // Handle Preset Selection & update defaults
  const handlePresetSelect = (preset: CsvPresetType) => {
    setSelectedPreset(preset);
    if (preset === "META_ADS") {
      setDefaults((prev) => ({
        ...prev,
        defaultSource: "FACEBOOK_MESSENGER",
        customCampaignTag: prev.customCampaignTag || "Meta Instant Forms",
      }));
    } else if (preset === "DEVELOPER_SHEET") {
      setDefaults((prev) => ({
        ...prev,
        defaultSource: "PORTAL_INQUIRY",
        customCampaignTag: prev.customCampaignTag || "Developer Project Expo",
      }));
    } else if (preset === "PROPFLOW_TEMPLATE") {
      setDefaults((prev) => ({
        ...prev,
        defaultSource: "MANUAL_ENTRY",
        customCampaignTag: "",
      }));
    }

    if (headers.length > 0) {
      const autoMapped = detectColumnMapping(headers, preset);
      setMapping(autoMapped);
    }
  };

  // Download Sample Template for chosen preset
  const handleDownloadSample = (preset: "META_ADS" | "DEVELOPER_SHEET" | "PROPFLOW_TEMPLATE") => {
    const { filename, content } = getSampleCsvTemplate(preset);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded sample ${filename}`);
  };

  // Parse CSV File with PapaParse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);

    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        const rows = results.data.filter((r) => Object.values(r).some((v) => v && v.trim()));

        if (rows.length === 0) {
          toast.error("The selected CSV file appears to be empty.");
          return;
        }

        const detectedHeaders = results.meta.fields || Object.keys(rows[0] || {});
        setHeaders(detectedHeaders);
        setRawRows(rows);

        // Auto-detect preset if not explicit
        let detectedPreset = selectedPreset;
        const lowerFields = detectedHeaders.map((h) => h.toLowerCase());
        if (lowerFields.some((f) => f.includes("campaign") || f.includes("ad_name") || f.includes("form_name"))) {
          detectedPreset = "META_ADS";
          setSelectedPreset("META_ADS");
        } else if (lowerFields.some((f) => f.includes("tcp") || f.includes("developer") || f.includes("project"))) {
          detectedPreset = "DEVELOPER_SHEET";
          setSelectedPreset("DEVELOPER_SHEET");
        }

        const autoMapped = detectColumnMapping(detectedHeaders, detectedPreset);
        setMapping(autoMapped);
        setStep("MAPPING");
        toast.info(`Loaded ${rows.length} rows with ${detectedHeaders.length} columns.`);
      },
      error: (err) => {
        setIsParsing(false);
        toast.error(`CSV Parsing error: ${err.message}`);
      },
    });
  };

  // When mapping or defaults change, re-compute parsed leads
  const computePreview = React.useCallback(() => {
    if (rawRows.length === 0) return;
    const computed = processCsvRows(rawRows, mapping, defaults, leads);
    setParsedLeads(computed);
  }, [rawRows, mapping, defaults, leads]);

  // Proceed to Preview step
  const handleProceedToPreview = () => {
    // Check if at least one name column and phone are mapped
    const hasName = Boolean(mapping.fullNameCol || mapping.firstNameCol || mapping.lastNameCol);
    if (!hasName) {
      toast.warning("Please map at least one Name column (Full Name or First Name) to proceed.");
      return;
    }

    computePreview();
    setStep("PREVIEW");
  };

  // Perform Final Import
  const handleExecuteImport = () => {
    const toImport = parsedLeads
      .filter((item) => {
        if (!item.isValid) return false;
        if (defaults.skipDuplicates && item.isDuplicate) return false;
        return true;
      })
      .map((item) => item.leadInput);

    if (toImport.length === 0) {
      toast.error("No valid leads to import based on your current duplicate and validation settings.");
      return;
    }

    setIsImporting(true);
    try {
      bulkAddLeads(toImport);
      setImportedCount(toImport.length);
      setStep("SUCCESS");
      toast.success(`Successfully imported ${toImport.length} leads into pipeline!`);
    } catch (err) {
      toast.error("Failed to import leads into CRM. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  // Counters for preview summary
  const totalRows = rawRows.length;
  const duplicateCount = parsedLeads.filter((p) => p.isDuplicate).length;
  const validToImportCount = parsedLeads.filter((p) => {
    if (!p.isValid) return false;
    if (defaults.skipDuplicates && p.isDuplicate) return false;
    return true;
  }).length;

  // Sample values from row 0 for live mapping preview
  const sampleRow = rawRows[0] || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span>Bulk Lead Importer</span>
            </DialogTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-4">
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "UPLOAD" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                1. Upload
              </span>
              <span>→</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "MAPPING" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                2. Map Columns
              </span>
              <span>→</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "PREVIEW" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                3. Preview & Import
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs">
            Import prospect lists from Facebook / Instagram Lead Ads, developer partner sheets (Ayala, Megaworld, SMDC), or CRM exports.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: UPLOAD & PRESET SELECTION */}
        {step === "UPLOAD" && (
          <div className="space-y-5 py-2">
            {/* Presets Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Lead Source Preset / Format</Label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("META_ADS")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    selectedPreset === "META_ADS"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-foreground">Meta / FB Lead Ads</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Auto-maps Instant Forms columns like <code className="text-[10px] bg-muted px-1 py-0.5 rounded">p:+63...</code>, campaign name & full name.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect("DEVELOPER_SHEET")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    selectedPreset === "DEVELOPER_SHEET"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-foreground">Developer Lead Sheet</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ayala Land, Megaworld, SMDC, DMCI broker sheets with Project, TCP Budget & Client Name.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect("PROPFLOW_TEMPLATE")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    selectedPreset === "PROPFLOW_TEMPLATE"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-foreground">PropFlow Standard</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Official PropFlow CRM column headers with structured budgets and multi-select tags.
                  </p>
                </button>
              </div>
            </div>

            {/* Template Download Utility */}
            <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-foreground">Need a sample CSV to test?</span>
                <p className="text-[11px] text-muted-foreground">
                  Download a pre-populated test spreadsheet matching your chosen format.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() =>
                  handleDownloadSample(
                    selectedPreset === "AUTO_DETECT" ? "META_ADS" : selectedPreset
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample .CSV
              </Button>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Upload CSV File</Label>
              <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 p-8 cursor-pointer hover:bg-muted/20 transition-colors">
                {isParsing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground">
                    {isParsing ? "Analyzing CSV format..." : "Click to select or drag and drop your lead CSV"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports comma-delimited UTF-8 CSV files from Facebook Ads Manager, Google Sheets, or Excel
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING & PIPELINE DEFAULTS */}
        {step === "MAPPING" && (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border text-xs">
              <div>
                <span className="font-semibold text-foreground">{file?.name}</span>
                <span className="text-muted-foreground ml-2">
                  ({rawRows.length} rows, {headers.length} detected columns)
                </span>
              </div>
              <Badge variant="outline" className="text-[11px] capitalize">
                {selectedPreset.replace("_", " ").toLowerCase()} Preset
              </Badge>
            </div>

            {/* Column Mapping Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Column Mapping</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Match each CRM lead field with the corresponding column in your CSV.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-primary gap-1"
                  onClick={() => setMapping(detectColumnMapping(headers, selectedPreset))}
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-Auto-Detect
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[180px] text-xs">PropFlow Lead Field</TableHead>
                      <TableHead className="text-xs">Your CSV Column</TableHead>
                      <TableHead className="text-xs w-[220px]">Sample Row 1 Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Full Name */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">
                        Full Name
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          (Splits &quot;First Last&quot; or &quot;Last, First&quot;)
                        </span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={mapping.fullNameCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({
                              ...prev,
                              fullNameCol: e.target.value || undefined,
                              // If full name selected, clear individual first/last name
                              firstNameCol: e.target.value ? undefined : prev.firstNameCol,
                              lastNameCol: e.target.value ? undefined : prev.lastNameCol,
                            }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None / Separate First & Last --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.fullNameCol ? sampleRow[mapping.fullNameCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* First Name (if Full Name not used) */}
                    {!mapping.fullNameCol && (
                      <>
                        <TableRow>
                          <TableCell className="text-xs font-medium">First Name</TableCell>
                          <TableCell>
                            <select
                              value={mapping.firstNameCol || ""}
                              onChange={(e) =>
                                setMapping((prev) => ({ ...prev, firstNameCol: e.target.value || undefined }))
                              }
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="">-- Select Column --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {mapping.firstNameCol ? sampleRow[mapping.firstNameCol] || "—" : "—"}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell className="text-xs font-medium">Last Name</TableCell>
                          <TableCell>
                            <select
                              value={mapping.lastNameCol || ""}
                              onChange={(e) =>
                                setMapping((prev) => ({ ...prev, lastNameCol: e.target.value || undefined }))
                              }
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="">-- Select Column --</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {mapping.lastNameCol ? sampleRow[mapping.lastNameCol] || "—" : "—"}
                          </TableCell>
                        </TableRow>
                      </>
                    )}

                    {/* Phone Number */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">
                        Mobile / Phone <span className="text-red-500">*</span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={mapping.phoneCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, phoneCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- Select Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.phoneCol ? sampleRow[mapping.phoneCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Email */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">Email Address</TableCell>
                      <TableCell>
                        <select
                          value={mapping.emailCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, emailCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None / Skip --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.emailCol ? sampleRow[mapping.emailCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Budget */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">
                        Target Budget / TCP
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          (Supports 5M, ₱ 8,000,000, etc.)
                        </span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={mapping.budgetCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, budgetCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None (Use default) --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.budgetCol ? sampleRow[mapping.budgetCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Preferred Location / Project */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">Project / Location</TableCell>
                      <TableCell>
                        <select
                          value={mapping.locationCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, locationCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None (Use &quot;Metro Manila&quot;) --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.locationCol ? sampleRow[mapping.locationCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Campaign / Ad Source */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">
                        Campaign / Ad Name
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          (Added to Lead Tags & Notes)
                        </span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={mapping.campaignCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, campaignCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None / Skip --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.campaignCol ? sampleRow[mapping.campaignCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>

                    {/* Notes / Remarks */}
                    <TableRow>
                      <TableCell className="text-xs font-medium">Remarks / Notes</TableCell>
                      <TableCell>
                        <select
                          value={mapping.notesCol || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, notesCol: e.target.value || undefined }))
                          }
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">-- None / Skip --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {mapping.notesCol ? sampleRow[mapping.notesCol] || "—" : "—"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pipeline Defaults Configuration */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-foreground">Pipeline Defaults & Deduplication</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-lg border">
                {/* Default Stage */}
                <div className="space-y-1">
                  <Label className="text-[11px]">Initial Pipeline Stage</Label>
                  <select
                    value={defaults.defaultStage}
                    onChange={(e) =>
                      setDefaults((prev) => ({ ...prev, defaultStage: e.target.value as PipelineStage }))
                    }
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="NEW_LEAD">New Lead</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="SITE_TRIPPING">Site Tripping</option>
                  </select>
                </div>

                {/* Default Source */}
                <div className="space-y-1">
                  <Label className="text-[11px]">Lead Channel Source</Label>
                  <select
                    value={defaults.defaultSource}
                    onChange={(e) =>
                      setDefaults((prev) => ({
                        ...prev,
                        defaultSource: e.target.value as CreateLeadInput["source"],
                      }))
                    }
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="FACEBOOK_MESSENGER">Facebook Messenger / Ads</option>
                    <option value="PORTAL_INQUIRY">Developer Portal / Sheet</option>
                    <option value="WEB_CAPTURE_FORM">Web Capture Form</option>
                    <option value="WALK_IN_OPEN_HOUSE">Open House / Booth</option>
                    <option value="MANUAL_ENTRY">Manual Entry</option>
                  </select>
                </div>

                {/* Default Priority */}
                <div className="space-y-1">
                  <Label className="text-[11px]">Default Priority</Label>
                  <select
                    value={defaults.defaultPriority}
                    onChange={(e) =>
                      setDefaults((prev) => ({
                        ...prev,
                        defaultPriority: e.target.value as CreateLeadInput["priority"],
                      }))
                    }
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="HOT">🔥 Hot (Immediate Tripping)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                {/* Campaign Tag */}
                <div className="space-y-1">
                  <Label className="text-[11px]">Custom Campaign Tag</Label>
                  <Input
                    placeholder="e.g. FB Ads Q4 2026"
                    value={defaults.customCampaignTag}
                    onChange={(e) =>
                      setDefaults((prev) => ({ ...prev, customCampaignTag: e.target.value }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Deduplication Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="checkbox"
                  checked={defaults.skipDuplicates}
                  onChange={(e) =>
                    setDefaults((prev) => ({ ...prev, skipDuplicates: e.target.checked }))
                  }
                  className="rounded border-input text-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Skip Duplicate Contacts</span>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically checks phone numbers and emails against existing pipeline leads to avoid duplicate entries.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATION */}
        {step === "PREVIEW" && (
          <div className="space-y-4 py-2">
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <span className="text-[11px] text-muted-foreground">Total CSV Records</span>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalRows}</p>
              </div>

              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                <span className="text-[11px] text-muted-foreground">Ready to Import</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {validToImportCount}
                </p>
              </div>

              <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3">
                <span className="text-[11px] text-muted-foreground">Duplicates Detected</span>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {duplicateCount}
                  </p>
                  {duplicateCount > 0 && defaults.skipDuplicates && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      Skipped
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Table of First 5 records */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Preview Sample (Showing first {Math.min(5, parsedLeads.length)} of {parsedLeads.length} leads)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Verify name splitting, phone formatting, and target budgets
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="w-[180px]">Lead Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Budget Range</TableHead>
                      <TableHead>Project / Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLeads.slice(0, 5).map((item, idx) => (
                      <TableRow key={idx} className={item.isDuplicate && defaults.skipDuplicates ? "opacity-50" : ""}>
                        <TableCell className="text-xs font-semibold">
                          {item.leadInput.firstName} {item.leadInput.lastName}
                          {item.leadInput.tags && item.leadInput.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.leadInput.tags.slice(0, 2).map((t, ti) => (
                                <Badge key={ti} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs space-y-0.5">
                          <div className="font-mono text-[11px]">{item.leadInput.phone}</div>
                          {item.leadInput.email && (
                            <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                              {item.leadInput.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-foreground">
                            {formatCurrency(item.leadInput.budgetMax)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            Min: {formatCurrency(item.leadInput.budgetMin)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.leadInput.preferredLocations.join(", ")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.isDuplicate ? (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                              Duplicate
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              Ready
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === "SUCCESS" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Import Completed Successfully!</h3>
              <p className="text-xs text-muted-foreground">
                Added <strong className="text-foreground">{importedCount} leads</strong> directly into your PropFlow CRM pipeline.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setStep("UPLOAD");
                  setFile(null);
                  setHeaders([]);
                  setRawRows([]);
                  setMapping({});
                }}
              >
                Import Another File
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs"
                onClick={() => onOpenChange(false)}
              >
                Go to Pipeline Kanban
              </Button>
            </div>
          </div>
        )}

        {/* DIALOG FOOTERS WITH STEP NAVIGATION */}
        {step !== "SUCCESS" && (
          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
            <div>
              {step === "MAPPING" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setStep("UPLOAD")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              )}
              {step === "PREVIEW" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setStep("MAPPING")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Edit Mapping
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              {step === "UPLOAD" && (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs gap-1"
                  disabled={!file || headers.length === 0}
                  onClick={() => setStep("MAPPING")}
                >
                  Configure Mapping
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === "MAPPING" && (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={handleProceedToPreview}
                >
                  Preview Leads
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {step === "PREVIEW" && (
                <Button
                  type="button"
                  size="sm"
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isImporting || validToImportCount === 0}
                  onClick={handleExecuteImport}
                >
                  {isImporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                  Import {validToImportCount} Leads
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

