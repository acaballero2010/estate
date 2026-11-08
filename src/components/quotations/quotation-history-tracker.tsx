"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  GitFork,
  History,
  Plus,
  Search,
  Send,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  type Quotation,
  type Lead,
  computePropertyQuotation,
} from "@/lib/schemas";
import { downloadQuotationPdf } from "@/components/quotations/quotation-pdf-document";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface QuotationHistoryTrackerProps {
  onReviseQuotation: (quotation: Quotation) => void;
  onOpenCalculator: () => void;
}

export function QuotationHistoryTracker({
  onReviseQuotation,
  onOpenCalculator,
}: QuotationHistoryTrackerProps) {
  const { quotations, leads, sendMessage } = useCrmStore();
  const { agentProfile } = useAuth();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | Quotation["status"]
  >("ALL");
  const [selectedLeadFilter, setSelectedLeadFilter] = React.useState<string>("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  // Map leads for fast lookup
  const leadMap = React.useMemo(() => {
    const map = new Map<string, Lead>();
    leads.forEach((l) => map.set(l.id, l));
    return map;
  }, [leads]);

  // Overall KPI metrics
  const metrics = React.useMemo(() => {
    const total = quotations.length;
    const viewed = quotations.filter(
      (q) => q.status === "VIEWED" || q.status === "ACCEPTED"
    ).length;
    const accepted = quotations.filter((q) => q.status === "ACCEPTED").length;
    const revisions = quotations.filter((q) => (q.revisionNumber || 1) > 1).length;
    const totalPipelineValue = quotations.reduce(
      (acc, q) => acc + (q.calculationInput.listPrice || 0),
      0
    );
    const viewRate = total > 0 ? Math.round((viewed / total) * 100) : 0;

    return {
      total,
      viewed,
      accepted,
      revisions,
      totalPipelineValue,
      viewRate,
    };
  }, [quotations]);

  // Filtered quotations
  const filteredQuotations = React.useMemo(() => {
    return quotations
      .filter((q) => {
        // Status filter
        if (statusFilter !== "ALL" && q.status !== statusFilter) {
          return false;
        }

        // Lead filter
        if (selectedLeadFilter !== "ALL" && q.leadId !== selectedLeadFilter) {
          return false;
        }

        // Text search
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        const lead = leadMap.get(q.leadId);
        const clientName = lead
          ? `${lead.firstName} ${lead.lastName}`.toLowerCase()
          : "";
        const refNo = q.referenceNumber.toLowerCase();
        const project = q.calculationInput.projectName.toLowerCase();
        const unit = q.calculationInput.unitCode.toLowerCase();

        return (
          refNo.includes(query) ||
          clientName.includes(query) ||
          project.includes(query) ||
          unit.includes(query)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotations, statusFilter, selectedLeadFilter, searchQuery, leadMap]);

  // Copy tokenized public portal link
  const handleCopyLink = (q: Quotation) => {
    const shareUrl = `${window.location.origin}/quote/${q.shareToken}?leadId=${
      q.leadId
    }&unit=${encodeURIComponent(q.calculationInput.unitCode)}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedId(q.id);
    toast.success(`Client portal link for ${q.referenceNumber} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download official branded PDF for an existing quotation
  const handleDownloadPdf = async (q: Quotation) => {
    try {
      setDownloadingId(q.id);
      const lead = leadMap.get(q.leadId);
      const buyerName = lead
        ? `${lead.firstName} ${lead.lastName}`
        : "Valued Real Estate Investor";

      const computed = computePropertyQuotation(q.calculationInput);

      await downloadQuotationPdf({
        referenceNumber: q.referenceNumber,
        buyerName,
        agentName: agentProfile?.fullName,
        agentLicense: agentProfile?.prcLicenseNumber,
        input: q.calculationInput,
        result: computed,
      });

      toast.success(`Downloaded official PDF for ${q.referenceNumber}`);
    } catch {
      toast.error("Could not generate PDF download.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Resend / Push quotation to buyer's Messenger thread
  const handleResendToMessenger = (q: Quotation) => {
    const lead = leadMap.get(q.leadId);
    if (!lead) {
      toast.error("Buyer lead record not found.");
      return;
    }
    const computed = computePropertyQuotation(q.calculationInput);
    const shareUrl = `${window.location.origin}/quote/${q.shareToken}?leadId=${
      q.leadId
    }&unit=${encodeURIComponent(q.calculationInput.unitCode)}`;

    sendMessage(
      lead.id,
      `📄 [Quotation Share (${q.referenceNumber})]: Branded proposal for ${q.calculationInput.projectName} – ${q.calculationInput.unitCode}.\n• Total Contract Price: ${formatCurrency(computed.totalContractPrice)}\n• Monthly Amortization: ${formatCurrency(computed.monthlyAmortization)}\n• Interactive Proposal Link: ${shareUrl}`,
      q.id
    );

    toast.success(`Pushed ${q.referenceNumber} to ${lead.firstName}'s Messenger thread!`);
  };

  const getStatusBadgeVariant = (status: Quotation["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-pipeline-won text-white border-pipeline-won";
      case "VIEWED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "SENT":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "EXPIRED":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: Quotation["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return "Accepted / Reserved";
      case "VIEWED":
        return "Viewed by Client";
      case "SENT":
        return "Sent to Buyer";
      case "EXPIRED":
        return "Expired";
      default:
        return "Draft";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Proposals</span>
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[11px] text-muted-foreground">
              {metrics.accepted} accepted • {metrics.revisions} revisions
            </span>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Pipeline Quoted</span>
              <TrendingUp className="h-4 w-4 text-pipeline-won" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-pipeline-won font-mono">
              {formatCurrency(metrics.totalPipelineValue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[11px] text-muted-foreground">
              Across all live client proposals
            </span>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Client Portal Open Rate</span>
              <Eye className="h-4 w-4 text-purple-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {metrics.viewRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[11px] text-muted-foreground">
              {metrics.viewed} proposals opened by buyers
            </span>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Revisions Managed</span>
              <GitFork className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {metrics.revisions}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-[11px] text-muted-foreground">
              Stretched terms & revised options
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card/40 p-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reference #, client name, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedLeadFilter}
            onChange={(e) => setSelectedLeadFilter(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Clients ({leads.length})</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.firstName} {l.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {(["ALL", "SENT", "VIEWED", "ACCEPTED", "EXPIRED"] as const).map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                className="h-7 text-[11px] px-2.5"
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All Statuses" : getStatusLabel(status)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Quotation List */}
      {filteredQuotations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3 bg-muted/10">
          <History className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">No quotations matched your filters</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create and dispatch your first branded quotation using the Pricing
              Calculator to start tracking buyer engagement and revision history.
            </p>
          </div>
          <Button
            size="sm"
            className="text-xs gap-1.5"
            onClick={onOpenCalculator}
          >
            <Plus className="h-3.5 w-3.5" />
            Open Pricing Calculator
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotations.map((q) => {
            const lead = leadMap.get(q.leadId);
            const computed = computePropertyQuotation(q.calculationInput);

            // Check if this quotation was revised from a parent
            const parentQuotation = q.parentQuotationId
              ? quotations.find((parent) => parent.id === q.parentQuotationId)
              : null;

            // Check if there are newer revisions that branched from this quotation
            const newerRevision = quotations.find(
              (child) => child.parentQuotationId === q.id
            );

            return (
              <Card
                key={q.id}
                className="border bg-card/60 hover:border-primary/40 transition-all overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Reference, Client & Property info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {q.referenceNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                        Rev {q.revisionNumber || 1}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold border",
                          getStatusBadgeVariant(q.status)
                        )}
                      >
                        {getStatusLabel(q.status)}
                      </Badge>

                      {parentQuotation && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <GitFork className="h-3 w-3 text-primary" />
                          Revised from{" "}
                          <strong className="text-foreground">
                            {parentQuotation.referenceNumber}
                          </strong>
                        </span>
                      )}

                      {newerRevision && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Superseded by {newerRevision.referenceNumber}
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] block">
                          Client / Buyer
                        </span>
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          {lead
                            ? `${lead.firstName} ${lead.lastName}`
                            : "Direct Prospect"}
                        </span>
                        {lead?.email && (
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {lead.email}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[11px] block">
                          Property / Unit
                        </span>
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          {q.calculationInput.projectName}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {q.calculationInput.unitCode} ({q.calculationInput.floorAreaSqm} sqm)
                        </span>
                      </div>
                    </div>

                    {q.agentNotes && (
                      <div className="rounded border bg-muted/20 px-2.5 py-1 text-[11px] text-muted-foreground italic">
                        &ldquo;{q.agentNotes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l lg:pl-5 pt-3 lg:pt-0 shrink-0">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Total Contract Price
                      </span>
                      <span className="font-bold text-foreground text-sm font-mono tabular-nums">
                        {formatCurrency(computed.totalContractPrice)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Net List: {formatCurrency(computed.netListPrice)}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Monthly Equity ({q.calculationInput.downPaymentTermMonths}m)
                      </span>
                      <span className="font-bold text-primary text-sm font-mono tabular-nums">
                        {q.calculationInput.isStepUpEquity && computed.downPaymentSchedule[0]
                          ? `Starts ${formatCurrency(computed.downPaymentSchedule[0].amountDue)}`
                          : formatCurrency(computed.monthlyDownPayment)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {q.calculationInput.downPaymentPercent}% Down Payment
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Est. Amortization
                      </span>
                      <span className="font-bold text-pipeline-won text-sm font-mono tabular-nums">
                        {formatCurrency(computed.monthlyAmortization)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {q.calculationInput.loanTenorYears}y @ {q.calculationInput.annualInterestRate}%
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-1.5 border-t lg:border-t-0 lg:border-l lg:pl-5 pt-3 lg:pt-0 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      onClick={() => onReviseQuotation(q)}
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Revise Computation
                    </Button>

                    <div className="flex items-center gap-1 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1 flex-1"
                        asChild
                      >
                        <Link href={`/quote/${q.shareToken}`} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                          Portal
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1 flex-1"
                        onClick={() => handleCopyLink(q)}
                      >
                        {copiedId === q.id ? (
                          <Check className="h-3 w-3 text-pipeline-won" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Link
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1 flex-1"
                        disabled={downloadingId === q.id}
                        onClick={() => handleDownloadPdf(q)}
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </Button>

                      {q.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-[11px] text-primary hover:text-primary"
                          asChild
                          title="Direct Cloud PDF Link"
                        >
                          <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3" />
                          </a>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Resend to Messenger"
                        onClick={() => handleResendToMessenger(q)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Issued {new Date(q.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        Valid {new Date(q.validUntil).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

