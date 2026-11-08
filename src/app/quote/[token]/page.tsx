"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Download,
  Eraser,
  FileSignature,
  Globe2,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  computePropertyQuotation,
  FINANCING_TYPE_DEFAULTS,
  type QuotationCalculationInput,
} from "@/lib/schemas";
import { downloadQuotationPdf } from "@/components/quotations/quotation-pdf-document";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  convertFromPhp,
  CURRENCY_CONFIGS,
  formatCurrency,
  type SupportedCurrency,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

function BuyerQuotationPortalContent() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const {
    quotations,
    leads,
    properties,
    moveLeadStage,
    sendMessage,
    createDealFromReservation,
  } = useCrmStore();
  const { agentProfile } = useAuth();

  // Find matching quotation by shareToken or fallback to URL query / default property
  const matchedQuotation = React.useMemo(
    () => quotations.find((q) => q.shareToken === params.token),
    [quotations, params.token]
  );

  const buyerLead = React.useMemo(() => {
    const leadId = searchParams.get("leadId") || matchedQuotation?.leadId;
    return leads.find((l) => l.id === leadId) ?? leads[0];
  }, [leads, searchParams, matchedQuotation]);

  const defaultProp = properties[0]!;

  const matchedProperty = React.useMemo(() => {
    if (matchedQuotation?.propertyId) {
      return (
        properties.find((p) => p.id === matchedQuotation.propertyId) ??
        defaultProp
      );
    }
    const unitParam = searchParams.get("unit");
    return properties.find((p) => p.unitCode === unitParam) ?? defaultProp;
  }, [matchedQuotation, searchParams, properties, defaultProp]);

  const baseInput: QuotationCalculationInput = React.useMemo(() => {
    if (matchedQuotation) {
      return matchedQuotation.calculationInput;
    }

    return {
      projectName: matchedProperty.projectName,
      unitCode: matchedProperty.unitCode,
      floorAreaSqm: matchedProperty.floorAreaSqm,
      lotAreaSqm: matchedProperty.lotAreaSqm,
      listPrice: matchedProperty.listPrice,
      promoDiscountPercent: 3.0,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: matchedProperty.reservationFee,
      downPaymentPercent: 20,
      downPaymentTermMonths: 24,
      annualLumpsumAmount: 0,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 15,
    };
  }, [matchedQuotation, matchedProperty]);

  const [selectedTenor, setSelectedTenor] = React.useState<number>(
    baseInput.loanTenorYears
  );
  const [selectedDpMonths, setSelectedDpMonths] = React.useState<number>(
    baseInput.downPaymentTermMonths
  );
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>("PHP");
  const [reservedConfirmed, setReservedConfirmed] = React.useState(false);
  const [createdDealNumber, setCreatedDealNumber] = React.useState<string | null>(
    null
  );
  const [trippingRequested, setTrippingRequested] = React.useState(false);

  // Digital Reservation Modal State
  const [isReserveModalOpen, setIsReserveModalOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<
    "BANK_TRANSFER" | "GCASH_MAYA" | "CHECK_PDC" | "CREDIT_CARD"
  >("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = React.useState("BPI-INST-88492015");
  const [receiptUrl, setReceiptUrl] = React.useState(
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
  );
  const [isUploadingReceipt, setIsUploadingReceipt] = React.useState(false);
  const [hasSignedCanvas, setHasSignedCanvas] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);

  const liveInput: QuotationCalculationInput = React.useMemo(
    () => ({
      ...baseInput,
      loanTenorYears: selectedTenor,
      downPaymentTermMonths: selectedDpMonths,
    }),
    [baseInput, selectedTenor, selectedDpMonths]
  );

  const result = React.useMemo(
    () => computePropertyQuotation(liveInput),
    [liveInput]
  );

  // Canvas E-Signature drawing handlers
  const getCanvasPoint = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch?.clientX ?? 0) - rect.left,
        y: (touch?.clientY ?? 0) - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    setHasSignedCanvas(true);
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawMove = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignedCanvas(false);
  };

  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const uploaded = await uploadMediaFile(file, "receipts");
      setReceiptUrl(uploaded);
      toast.success(`Uploaded payment proof: ${file.name}`);
    } catch {
      toast.error("Failed to upload receipt file.");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleCompleteDigitalReservation = () => {
    if (!referenceNo.trim()) {
      toast.error("Please enter your payment reference number.");
      return;
    }

    const signatureDataUrl = canvasRef.current
      ? canvasRef.current.toDataURL("image/png")
      : undefined;

    if (buyerLead) {
      const createdDeal = createDealFromReservation({
        leadId: buyerLead.id,
        propertyId: matchedProperty.id,
        quotationId: matchedQuotation?.id,
        totalContractPrice: result.totalContractPrice,
        netCommissionablePrice: result.netListPrice,
        financingType: liveInput.financingType,
        reservationFee: liveInput.reservationFee,
        paymentMethod,
        referenceNo: referenceNo.trim(),
        receiptImageUrl: receiptUrl,
        signatureDataUrl,
      });

      sendMessage(
        buyerLead.id,
        `✅ [Digital Reservation Completed]: ${buyerLead.firstName} e-signed the Reservation Agreement & uploaded payment proof (${paymentMethod} Ref: ${referenceNo}) for ${liveInput.projectName} – ${liveInput.unitCode}. Deal Room ${createdDeal.dealNumber} is now live!`
      );

      setCreatedDealNumber(createdDeal.dealNumber);
    }

    setReservedConfirmed(true);
    setIsReserveModalOpen(false);
    toast.success(
      "Unit officially reserved! Deal Room & Commission Split created in /deals."
    );
  };

  const handleScheduleViewing = () => {
    if (buyerLead) {
      if (
        buyerLead.stage === "NEW_LEAD" ||
        buyerLead.stage === "CONTACTED"
      ) {
        moveLeadStage(buyerLead.id, "SITE_TRIPPING");
      }
      sendMessage(
        buyerLead.id,
        `📅 [Buyer Portal Action]: ${buyerLead.firstName} requested a Showroom & Site Viewing for ${liveInput.projectName} (${liveInput.unitCode}).`
      );
    }
    setTrippingRequested(true);
    toast.success("Showroom viewing request logged with your broker!");
  };

  const handleDownloadBuyerPdf = async () => {
    const refNo =
      matchedQuotation?.referenceNumber ||
      `QT-${params.token?.toUpperCase().slice(0, 6) || "2026"}`;
    await downloadQuotationPdf({
      referenceNumber: refNo,
      buyerName: buyerLead
        ? `${buyerLead.firstName} ${buyerLead.lastName}`
        : "Valued Buyer",
      agentName: agentProfile?.fullName,
      agentLicense: agentProfile?.prcLicenseNumber,
      input: liveInput,
      result,
    });
    toast.success("Official PDF quotation downloaded");
  };

  return (
    <div className="container max-w-4xl space-y-6 py-6">
      {/* Verified Share Portal Banner */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-primary/5 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="won" className="text-[10px] gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified Client Quotation
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono">
                Token: {params.token}
              </span>
            </div>
            <h1 className="mt-1 text-base font-bold sm:text-lg">
              Prepared Exclusively for{" "}
              {buyerLead
                ? `${buyerLead.firstName} ${buyerLead.lastName}`
                : "Valued Property Buyer"}
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleDownloadBuyerPdf}
        >
          <Download className="h-3.5 w-3.5" />
          Download Official PDF
        </Button>
      </div>

      {/* Multi-Currency Toggle for Overseas & OFW Buyers */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">View in Your Earning Currency:</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Indicative exchange rate for overseas buyers & OFWs
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]).map((curr) => {
            const conf = CURRENCY_CONFIGS[curr];
            const isSelected = selectedCurrency === curr;
            return (
              <Button
                key={curr}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="h-7 px-2.5 text-xs gap-1"
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

      {createdDealNumber && (
        <div className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-foreground">
                Digital Reservation Confirmed — Deal Room {createdDealNumber} Active
              </p>
              <p className="text-muted-foreground">
                Your signed Reservation Agreement and payment proof ({referenceNo}) have been verified.
              </p>
            </div>
          </div>
          <Button size="sm" variant="default" className="h-8 text-xs" asChild>
            <Link href="/deals">Open Deal Room →</Link>
          </Button>
        </div>
      )}

      {/* Main Interactive Quotation Card */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="border-b bg-muted/30 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl font-bold">
                {liveInput.projectName}
              </CardTitle>
              <CardDescription className="text-xs font-medium text-foreground mt-0.5">
                {liveInput.unitCode} • Floor Area: {liveInput.floorAreaSqm} sqm
                {liveInput.lotAreaSqm > 0
                  ? ` • Lot Area: ${liveInput.lotAreaSqm} sqm`
                  : ""}
              </CardDescription>
            </div>
            <div className="text-left sm:text-right text-xs">
              <p className="font-semibold">{agentProfile?.fullName}</p>
              <p className="text-muted-foreground">
                {agentProfile?.prcLicenseNumber} • {agentProfile?.phone}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Interactive Buyer Term Customizer */}
          <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Customize Down Payment Stretch Period:
              </span>
              <div className="flex gap-1.5">
                {[12, 18, 24, 36].map((mos) => (
                  <Button
                    key={mos}
                    type="button"
                    size="sm"
                    variant={selectedDpMonths === mos ? "default" : "outline"}
                    className="h-8 flex-1 text-xs"
                    onClick={() => setSelectedDpMonths(mos)}
                  >
                    {mos} Mos
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold">
                Customize Loan Amortization Tenor:
              </span>
              <div className="flex gap-1.5">
                {[5, 10, 15, 20, 25].map((yr) => (
                  <Button
                    key={yr}
                    type="button"
                    size="sm"
                    variant={selectedTenor === yr ? "default" : "outline"}
                    className="h-8 flex-1 text-xs"
                    onClick={() => setSelectedTenor(yr)}
                  >
                    {yr} Yrs
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Callout Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3.5">
              <span className="text-xs text-muted-foreground block">
                Total Contract Price (TCP)
              </span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(result.totalContractPrice)}
              </span>
              {selectedCurrency !== "PHP" && (
                <span className="text-xs font-semibold text-primary block tabular-nums">
                  ≈ {formatCurrency(convertFromPhp(result.totalContractPrice, selectedCurrency), selectedCurrency)}
                </span>
              )}
              <span className="text-[11px] text-pipeline-won block mt-0.5">
                Saved {formatCurrency(result.discountAmount, "PHP", 0)} Promo
                Discount
              </span>
            </div>

            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3.5">
              <span className="text-xs font-medium text-primary block">
                Monthly Down Payment ({selectedDpMonths} mos)
              </span>
              <span className="text-xl font-bold text-primary tabular-nums">
                {formatCurrency(result.monthlyDownPayment)}
              </span>
              {selectedCurrency !== "PHP" && (
                <span className="text-xs font-bold text-primary/80 block tabular-nums">
                  ≈ {formatCurrency(convertFromPhp(result.monthlyDownPayment, selectedCurrency), selectedCurrency)}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                0% Interest during Equity Period
              </span>
            </div>

            <div className="rounded-lg border p-3.5">
              <span className="text-xs text-muted-foreground block">
                Monthly Bank/HDMF Loan ({selectedTenor} yrs)
              </span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(result.monthlyAmortization)}
              </span>
              {selectedCurrency !== "PHP" && (
                <span className="text-xs font-semibold text-primary block tabular-nums">
                  ≈ {formatCurrency(convertFromPhp(result.monthlyAmortization, selectedCurrency), selectedCurrency)}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {FINANCING_TYPE_DEFAULTS[liveInput.financingType].label} @{" "}
                {liveInput.annualInterestRate}%
              </span>
            </div>
          </div>

          {/* Summary Breakdown */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Payment Milestone</TableHead>
                  <TableHead className="text-right">Amount (PHP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                <TableRow>
                  <TableCell>Reservation Fee (Deductible from DP)</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(liveInput.reservationFee)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    Net {liveInput.downPaymentPercent}% Equity Down Payment (
                    {selectedDpMonths} months)
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(result.netDownPayment)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    {100 - liveInput.downPaymentPercent}% Balance for Loan
                    Takeout
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(result.loanableBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Interactive Buyer Conversion CTAs */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button
              size="lg"
              variant={trippingRequested ? "secondary" : "outline"}
              className="w-full text-xs gap-2"
              onClick={handleScheduleViewing}
              disabled={trippingRequested}
            >
              <CalendarCheck className="h-4 w-4 text-primary" />
              {trippingRequested
                ? "Showroom Viewing Requested ✓"
                : "Book Showroom / Site Tripping"}
            </Button>

            <Button
              size="lg"
              className="w-full text-xs gap-2"
              onClick={() => setIsReserveModalOpen(true)}
              disabled={reservedConfirmed}
            >
              {reservedConfirmed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Unit Officially Reserved ({createdDealNumber})
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  E-Sign & Reserve Unit (
                  {formatCurrency(liveInput.reservationFee, "PHP", 0)})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Digital E-Signature & Reservation Fee Receipt Modal */}
      <Dialog open={isReserveModalOpen} onOpenChange={setIsReserveModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSignature className="h-4 w-4 text-primary" />
              Digital Unit Reservation & E-Signature
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lock in <strong>{liveInput.projectName}</strong> (
              {liveInput.unitCode}) at{" "}
              <strong>{formatCurrency(result.totalContractPrice)}</strong> TCP by uploading your reservation payment proof and signing below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-primary/5 p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block">
                  Deductible Reservation Fee Due
                </span>
                <span className="font-semibold">
                  {liveInput.projectName} • {liveInput.unitCode}
                </span>
              </div>
              <span className="text-base font-bold text-primary tabular-nums">
                {formatCurrency(liveInput.reservationFee, "PHP", 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Payment Channel</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as
                        | "BANK_TRANSFER"
                        | "GCASH_MAYA"
                        | "CHECK_PDC"
                        | "CREDIT_CARD"
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                >
                  <option value="BANK_TRANSFER">
                    Bank Transfer (BPI / BDO / InstaPay)
                  </option>
                  <option value="GCASH_MAYA">GCash / Maya Bills Pay</option>
                  <option value="CREDIT_CARD">
                    Credit Card Developer Portal
                  </option>
                  <option value="CHECK_PDC">Manager&apos;s / Personal Check</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Transaction Reference / Check No.
                </Label>
                <Input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. BPI-INST-88492015"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Payment Receipt Uploader */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                Upload Reservation Payment Proof (Screenshot / PDF)
              </Label>
              <div className="flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-2.5 text-xs font-medium hover:bg-accent transition-colors">
                  {isUploadingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <UploadCloud className="h-4 w-4 text-primary" />
                  )}
                  <span>
                    {isUploadingReceipt
                      ? "Uploading Receipt..."
                      : "Choose Payment Receipt Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleReceiptFileChange}
                  />
                </label>
                {receiptUrl && (
                  <Badge variant="won" className="text-[10px]">
                    Receipt Ready ✓
                  </Badge>
                )}
              </div>
            </div>

            {/* Interactive E-Signature Pad */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Buyer Digital Specimen Signature (Draw with Mouse or Finger)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] gap-1"
                  onClick={clearSignature}
                >
                  <Eraser className="h-3 w-3" />
                  Clear Pad
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border-2 border-dashed bg-white">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                  className="h-[120px] w-full cursor-crosshair touch-none"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                By signing above, I confirm my intent to reserve{" "}
                <strong>{liveInput.unitCode}</strong> and authorize the creation of my Deal Room file.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReserveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={handleCompleteDigitalReservation}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {hasSignedCanvas
                ? "Submit Signed Reservation & Create Deal Room"
                : "Confirm Reservation & Create Deal Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BuyerQuotationPortalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-xs text-muted-foreground">
          Loading Verified Client Quotation...
        </div>
      }
    >
      <BuyerQuotationPortalContent />
    </React.Suspense>
  );
}
