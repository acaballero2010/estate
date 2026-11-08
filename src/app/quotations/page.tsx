"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2,
  Calculator,
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  Percent,
  Send,
} from "lucide-react";
import {
  computePropertyQuotation,
  FINANCING_TYPE_DEFAULTS,
  type FinancingType,
  QuotationCalculationInputSchema,
  type QuotationCalculationInput,
} from "@/lib/schemas";
import { downloadQuotationPdf } from "@/components/quotations/quotation-pdf-document";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
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

function QuotationCalculatorContent() {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId");
  const initialPropertyId = searchParams.get("propertyId");
  const { leads, properties, saveQuotation, sendMessage } = useCrmStore();
  const { agentProfile } = useAuth();

  const startProp =
    properties.find((p) => p.id === initialPropertyId) ?? properties[0];

  const [selectedLeadId, setSelectedLeadId] = React.useState<string>(
    initialLeadId || leads[0]?.id || ""
  );
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>(
    startProp?.id || ""
  );
  const [copiedLink, setCopiedLink] = React.useState(false);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const form = useForm<QuotationCalculationInput>({
    resolver: zodResolver(QuotationCalculationInputSchema),
    defaultValues: {
      projectName: startProp?.projectName ?? "The Meridian Park Residences",
      unitCode: startProp?.unitCode ?? "Tower B - 2408 (2BR Corner)",
      floorAreaSqm: startProp?.floorAreaSqm ?? 84.5,
      lotAreaSqm: startProp?.lotAreaSqm ?? 0,
      listPrice: startProp?.listPrice ?? 18500000,
      promoDiscountPercent: 3.0,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: startProp?.reservationFee ?? 100000,
      downPaymentPercent: 20,
      downPaymentTermMonths: 24,
      annualLumpsumAmount: 0,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 15,
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  // Compute deterministic amortization schedule in real time
  const result = React.useMemo(
    () =>
      computePropertyQuotation({
        ...watchedValues,
        listPrice: Number(watchedValues.listPrice) || 0,
        promoDiscountPercent: Number(watchedValues.promoDiscountPercent) || 0,
        miscFeesPercent: Number(watchedValues.miscFeesPercent) || 0,
        reservationFee: Number(watchedValues.reservationFee) || 0,
        downPaymentPercent: Number(watchedValues.downPaymentPercent) || 0,
        downPaymentTermMonths: Number(watchedValues.downPaymentTermMonths) || 1,
        annualLumpsumAmount: Number(watchedValues.annualLumpsumAmount) || 0,
        annualInterestRate: Number(watchedValues.annualInterestRate) || 0,
        loanTenorYears: Number(watchedValues.loanTenorYears) || 1,
      }),
    [watchedValues]
  );

  const handleSelectProperty = React.useCallback(
    (propId: string) => {
      setSelectedPropertyId(propId);
      const prop = properties.find((p) => p.id === propId);
      if (!prop) return;
      form.setValue("projectName", prop.projectName);
      form.setValue("unitCode", prop.unitCode);
      form.setValue("floorAreaSqm", prop.floorAreaSqm);
      form.setValue("lotAreaSqm", prop.lotAreaSqm);
      form.setValue("listPrice", prop.listPrice);
      form.setValue("reservationFee", prop.reservationFee);
    },
    [properties, form]
  );

  React.useEffect(() => {
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
    }
    if (initialPropertyId) {
      handleSelectProperty(initialPropertyId);
    }
  }, [initialLeadId, initialPropertyId, handleSelectProperty]);

  // Apply financing channel preset
  const handleFinancingTypeChange = (type: FinancingType) => {
    const preset = FINANCING_TYPE_DEFAULTS[type];
    form.setValue("financingType", type);
    form.setValue("annualInterestRate", preset.defaultInterestRate);
    if (watchedValues.loanTenorYears > preset.maxTenorYears) {
      form.setValue("loanTenorYears", preset.maxTenorYears);
    }
  };

  // Save Quotation & optionally send to buyer's Messenger thread
  const handleSaveAndSendToChat = () => {
    if (!selectedLead) {
      toast.error("Please select a buyer lead first");
      return;
    }
    const refNo = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuotation = {
      id: crypto.randomUUID(),
      referenceNumber: refNo,
      leadId: selectedLead.id,
      agentId: "00000000-0000-4000-8000-000000000001",
      propertyId: selectedPropertyId || undefined,
      status: "SENT" as const,
      validUntil: new Date(Date.now() + 7 * 86400000),
      calculationInput: watchedValues,
      disclaimerText:
        "Prices, discounts, and interest rates are subject to change without prior notice. Final loan approval is subject to bank/HDMF credit evaluation.",
      pdfUrl: null,
      shareToken: crypto.randomUUID().slice(0, 12),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveQuotation(newQuotation);
    sendMessage(
      selectedLead.id,
      `📄 Attached Official Property Quotation (${refNo}) for ${watchedValues.projectName} – ${watchedValues.unitCode}.\n• Total Contract Price: ${formatCurrency(result.totalContractPrice)}\n• Monthly Equity (${watchedValues.downPaymentTermMonths} mos): ${formatCurrency(result.monthlyDownPayment)}\n• Est. Monthly Amortization (${watchedValues.loanTenorYears} yrs @ ${watchedValues.annualInterestRate}%): ${formatCurrency(result.monthlyAmortization)}`,
      newQuotation.id
    );

    toast.success(
      `Quotation ${refNo} saved and sent to ${selectedLead.firstName}'s Messenger thread!`
    );
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);

  const handleSendEmailQuotation = async () => {
    if (!selectedLead?.email) {
      toast.error("Selected lead does not have an email address specified.");
      return;
    }

    setIsSendingEmail(true);
    const refNo = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const token = selectedLead.id.slice(0, 8);
    const shareUrl = `${window.location.origin}/quote/${token}?leadId=${selectedLead.id}&unit=${encodeURIComponent(watchedValues.unitCode)}`;

    try {
      const response = await fetch("/api/quotations/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: selectedLead.email,
          recipientName: `${selectedLead.firstName} ${selectedLead.lastName}`,
          referenceNumber: refNo,
          projectName: watchedValues.projectName,
          unitCode: watchedValues.unitCode,
          totalContractPriceFormatted: formatCurrency(result.totalContractPrice),
          monthlyDownPaymentFormatted: formatCurrency(result.monthlyDownPayment),
          monthlyAmortizationFormatted: formatCurrency(result.monthlyAmortization),
          shareUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to dispatch email");
      }

      toast.success(`Dispatched quotation email to ${selectedLead.email}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      toast.error(msg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const refNo = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const buyerName = selectedLead
        ? `${selectedLead.firstName} ${selectedLead.lastName}`
        : "Valued Client";

      await downloadQuotationPdf({
        referenceNumber: refNo,
        buyerName,
        agentName: agentProfile?.fullName,
        agentLicense: agentProfile?.prcLicenseNumber,
        input: watchedValues,
        result,
      });

      toast.success(`Downloaded branded PDF quotation (${refNo})`);
    } catch (error) {
      console.error(error);
      toast.error("PDF generation fallback: Opening print dialog");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyShareLink = () => {
    setCopiedLink(true);
    const token = selectedLead?.id.slice(0, 8) || "preview26";
    navigator.clipboard?.writeText(
      `${window.location.origin}/quote/${token}?leadId=${
        selectedLead?.id || ""
      }&unit=${encodeURIComponent(watchedValues.unitCode)}`
    );
    toast.success("Interactive Buyer Quotation Portal link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Compute 3-Way Financing Comparison (Bank 15y vs Pag-IBIG 30y vs In-House 10y)
  const scenarioComparison = React.useMemo(() => {
    const bank15 = computePropertyQuotation({
      ...watchedValues,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 15,
    });
    const pagibig30 = computePropertyQuotation({
      ...watchedValues,
      financingType: "PAG_IBIG_HDMF",
      annualInterestRate: 6.25,
      loanTenorYears: 30,
    });
    const inhouse10 = computePropertyQuotation({
      ...watchedValues,
      financingType: "IN_HOUSE_FINANCING",
      annualInterestRate: 14.0,
      loanTenorYears: 10,
    });
    return { bank15, pagibig30, inhouse10 };
  }, [watchedValues]);

  return (
    <div className="container space-y-5 py-5">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">
            Real Estate Quotation & Amortization Calculator
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate sample computations for Bank, Pag-IBIG HDMF, or In-House financing and export branded PDF sheets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleCopyShareLink}
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-pipeline-won" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Share Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={isGeneratingPdf}
            onClick={handlePrintPdf}
          >
            <Download className="h-3.5 w-3.5" />
            {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={isSendingEmail}
            onClick={handleSendEmailQuotation}
          >
            {isSendingEmail ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Mail className="h-3.5 w-3.5 text-primary" />
            )}
            {isSendingEmail ? "Sending..." : "Email Quote"}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleSaveAndSendToChat}
          >
            <Send className="h-3.5 w-3.5" />
            Send to Messenger
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN: Interactive Calculator Parameters (5 Cols) */}
        <div className="min-w-0 space-y-4 lg:col-span-5 print:hidden">
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                1. Buyer & Property Unit Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1">
                <Label>Assign to Buyer Lead</Label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.firstName} {lead.lastName} ({lead.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Load from Available Property Inventory</Label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handleSelectProperty(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.projectName} — {prop.unitCode} (
                      {formatCurrency(prop.listPrice, "PHP", 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label>Project Name</Label>
                  <Input
                    className="h-8 text-xs"
                    {...form.register("projectName")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Unit / Block-Lot</Label>
                  <Input
                    className="h-8 text-xs"
                    {...form.register("unitCode")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Price & Equity Rules */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                2. Contract Price & Down Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label>Gross List Price (₱)</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs tabular-nums"
                    {...form.register("listPrice", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Promo Discount (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    className="h-8 text-xs tabular-nums"
                    {...form.register("promoDiscountPercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label>Misc. & Transfer Fees (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    className="h-8 text-xs tabular-nums"
                    {...form.register("miscFeesPercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reservation Fee (₱)</Label>
                  <Input
                    type="number"
                    step="5000"
                    className="h-8 text-xs tabular-nums"
                    {...form.register("reservationFee", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label>Down Payment (%)</Label>
                  <div className="flex gap-1">
                    {[10, 15, 20, 30].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        size="sm"
                        variant={
                          Number(watchedValues.downPaymentPercent) === pct
                            ? "default"
                            : "outline"
                        }
                        className="h-7 flex-1 px-1.5 text-[11px]"
                        onClick={() =>
                          form.setValue("downPaymentPercent", pct)
                        }
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Equity Term (Months)</Label>
                  <div className="flex gap-1">
                    {[12, 18, 24, 36].map((mos) => (
                      <Button
                        key={mos}
                        type="button"
                        size="sm"
                        variant={
                          Number(watchedValues.downPaymentTermMonths) === mos
                            ? "default"
                            : "outline"
                        }
                        className="h-7 flex-1 px-1.5 text-[11px]"
                        onClick={() =>
                          form.setValue("downPaymentTermMonths", mos)
                        }
                      >
                        {mos}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Annual Balloon / Lumpsum Equity Option */}
              <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold">
                    Annual Balloon / Lumpsum (Every 12th Mo)
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Lowers regular monthly DP
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="25000"
                    placeholder="0"
                    className="h-7 text-xs tabular-nums w-28"
                    {...form.register("annualLumpsumAmount", {
                      valueAsNumber: true,
                    })}
                  />
                  {[0, 100000, 250000, 500000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      size="sm"
                      variant={
                        Number(watchedValues.annualLumpsumAmount || 0) === amt
                          ? "default"
                          : "outline"
                      }
                      className="h-7 flex-1 px-1 text-[10px]"
                      onClick={() => form.setValue("annualLumpsumAmount", amt)}
                    >
                      {amt === 0 ? "None" : `₱${amt / 1000}K`}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financing & Amortization Settings */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                3. Balance Financing & Loan Tenor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  Object.keys(FINANCING_TYPE_DEFAULTS) as FinancingType[]
                ).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={
                      watchedValues.financingType === type
                        ? "default"
                        : "outline"
                    }
                    className="h-8 justify-start text-[11px] px-2.5 truncate"
                    onClick={() => handleFinancingTypeChange(type)}
                  >
                    {FINANCING_TYPE_DEFAULTS[type].label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label>Interest Rate (% p.a.)</Label>
                  <Input
                    type="number"
                    step="0.25"
                    className="h-8 text-xs tabular-nums"
                    {...form.register("annualInterestRate", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Loan Tenor (Years)</Label>
                  <div className="flex gap-1">
                    {[5, 10, 15, 20, 25, 30].map((yr) => (
                      <Button
                        key={yr}
                        type="button"
                        size="sm"
                        variant={
                          Number(watchedValues.loanTenorYears) === yr
                            ? "default"
                            : "outline"
                        }
                        className="h-8 flex-1 px-1 text-[10px]"
                        onClick={() => form.setValue("loanTenorYears", yr)}
                      >
                        {yr}y
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Branded Quotation Sheet & Schedules (7 Cols) */}
        <div className="min-w-0 lg:col-span-7">
          <Card className="border-2 border-primary/20 shadow-md print:border-none print:shadow-none">
            {/* Branded Quotation Header */}
            <CardHeader className="border-b bg-muted/30 p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <Badge variant="proposal" className="mb-1.5 text-[10px]">
                    SAMPLE PROPERTY COMPUTATION SHEET
                  </Badge>
                  <CardTitle className="text-lg font-bold">
                    {watchedValues.projectName}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-foreground">
                    Unit: {watchedValues.unitCode} • Floor Area:{" "}
                    {watchedValues.floorAreaSqm} sqm
                    {watchedValues.lotAreaSqm > 0
                      ? ` • Lot Area: ${watchedValues.lotAreaSqm} sqm`
                      : ""}
                  </CardDescription>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <p className="font-semibold">
                    Prepared For:{" "}
                    {selectedLead
                      ? `${selectedLead.firstName} ${selectedLead.lastName}`
                      : "Valued Client"}
                  </p>
                  <p className="text-muted-foreground">
                    Prepared By: {agentProfile?.fullName} (
                    {agentProfile?.prcLicenseNumber})
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Highlighted Monthly Payment Callouts */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-background p-3">
                  <span className="text-[11px] text-muted-foreground block">
                    Total Contract Price (TCP)
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {formatCurrency(result.totalContractPrice)}
                  </span>
                  <span className="text-[10px] text-pipeline-won block mt-0.5">
                    Includes {watchedValues.promoDiscountPercent}% Promo Discount
                  </span>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <span className="text-[11px] font-medium text-primary block">
                    Monthly Equity ({watchedValues.downPaymentTermMonths} mos)
                  </span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(result.monthlyDownPayment)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Net of {formatCurrency(watchedValues.reservationFee, "PHP", 0)} Reservation
                  </span>
                </div>

                <div className="rounded-lg border bg-background p-3">
                  <span className="text-[11px] text-muted-foreground block">
                    Est. Monthly Loan ({watchedValues.loanTenorYears} yrs)
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {formatCurrency(result.monthlyAmortization)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {
                      FINANCING_TYPE_DEFAULTS[watchedValues.financingType]
                        .label
                    }{" "}
                    @ {watchedValues.annualInterestRate}%
                  </span>
                </div>
              </div>

              {/* Financial Breakdown Summary Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Gross Unit List Price
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(watchedValues.listPrice)}
                      </TableCell>
                    </TableRow>
                    {result.discountAmount > 0 && (
                      <TableRow>
                        <TableCell className="text-pipeline-won">
                          Less Promo Discount ({watchedValues.promoDiscountPercent}%)
                        </TableCell>
                        <TableCell className="text-right text-pipeline-won tabular-nums">
                          - {formatCurrency(result.discountAmount)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Add Transfer & Misc. Fees ({watchedValues.miscFeesPercent}%)
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.miscFeesAmount)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell>Total Contract Price (TCP)</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.totalContractPrice)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        {watchedValues.downPaymentPercent}% Gross Down Payment
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.grossDownPayment)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Less Reservation Fee (Deductible)
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        - {formatCurrency(watchedValues.reservationFee)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-medium">
                      <TableCell>
                        {100 - watchedValues.downPaymentPercent}% Loanable Balance
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.loanableBalance)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Required Combined Gross Monthly Income (30% DTI Rule)
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(result.requiredGrossMonthlyIncome)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Tabbed Schedule Preview: Equity Installments vs Annual Loan Amortization */}
              <Tabs defaultValue="equity">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 sm:inline-flex sm:h-8 sm:w-auto print:hidden">
                  <TabsTrigger value="equity" className="text-xs h-7 sm:h-6 flex-1 sm:flex-initial">
                    Down Payment ({result.downPaymentSchedule.length}m)
                  </TabsTrigger>
                  <TabsTrigger value="amortization" className="text-xs h-7 sm:h-6 flex-1 sm:flex-initial">
                    Amortization ({result.annualLoanSummary.length}y)
                  </TabsTrigger>
                  <TabsTrigger value="compare" className="text-xs h-7 sm:h-6 flex-1 sm:flex-initial">
                    3-Way Compare
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="equity" className="mt-2">
                  <div className="max-h-56 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[11px]">
                          <TableHead>Installment</TableHead>
                          <TableHead className="text-right">
                            Monthly Equity Due
                          </TableHead>
                          <TableHead className="text-right">
                            Remaining DP Balance
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {result.downPaymentSchedule.map((row) => {
                          const isBalloon = row.label.includes("Balloon");
                          return (
                            <TableRow
                              key={row.installmentNumber}
                              className={
                                isBalloon ? "bg-primary/5 font-semibold" : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {row.label}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCurrency(row.amountDue)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground tabular-nums">
                                {formatCurrency(row.remainingBalance)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="amortization" className="mt-2">
                  <div className="max-h-56 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[11px]">
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">
                            Principal Paid
                          </TableHead>
                          <TableHead className="text-right">
                            Interest Paid
                          </TableHead>
                          <TableHead className="text-right">
                            Ending Principal
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {result.annualLoanSummary.map((yr) => (
                          <TableRow key={yr.year}>
                            <TableCell className="font-medium">
                              Year {yr.year}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(yr.principalPaid)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground tabular-nums">
                              {formatCurrency(yr.interestPaid)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(yr.endingBalance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="compare" className="mt-2">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[11px]">
                          <TableHead>Financing Option</TableHead>
                          <TableHead className="text-right">
                            Rate / Tenor
                          </TableHead>
                          <TableHead className="text-right">
                            Monthly Amortization
                          </TableHead>
                          <TableHead className="text-right">
                            Required GMI (30%)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        <TableRow>
                          <TableCell className="font-semibold">
                            Bank Financing (Standard)
                          </TableCell>
                          <TableCell className="text-right">
                            7.5% • 15 Yrs
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary tabular-nums">
                            {formatCurrency(
                              scenarioComparison.bank15.monthlyAmortization
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(
                              scenarioComparison.bank15
                                .requiredGrossMonthlyIncome
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold">
                            Pag-IBIG / HDMF Housing
                          </TableCell>
                          <TableCell className="text-right">
                            6.25% • 30 Yrs
                          </TableCell>
                          <TableCell className="text-right font-bold text-pipeline-won tabular-nums">
                            {formatCurrency(
                              scenarioComparison.pagibig30.monthlyAmortization
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(
                              scenarioComparison.pagibig30
                                .requiredGrossMonthlyIncome
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-semibold">
                            In-House Developer Loan
                          </TableCell>
                          <TableCell className="text-right">
                            14.0% • 10 Yrs
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {formatCurrency(
                              scenarioComparison.inhouse10.monthlyAmortization
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(
                              scenarioComparison.inhouse10
                                .requiredGrossMonthlyIncome
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Legal Disclaimer Footer */}
              <p className="text-[10px] leading-relaxed text-muted-foreground border-t pt-3">
                <strong>Disclaimer:</strong> This sample computation is for
                illustrative purposes only. Developer prices, promotional
                discounts, and bank/Pag-IBIG interest rates are subject to
                change without prior notice. Official reservation requires a
                signed Buyer Information Sheet and verified Reservation Fee.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Loading Quotation Engine...
        </div>
      }
    >
      <QuotationCalculatorContent />
    </React.Suspense>
  );
}

