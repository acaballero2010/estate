"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eraser,
  Eye,
  FileCheck,
  FileSignature,
  FileText,
  FileWarning,
  Globe2,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import {
  computePropertyQuotation,
  FINANCING_TYPE_DEFAULTS,
  STANDARD_KYC_REQUIREMENTS,
  type Property,
  type QuotationCalculationInput,
} from "@/lib/schemas";
import { downloadQuotationPdf } from "@/components/quotations/quotation-pdf-document";
import { downloadReservationAgreementPdf } from "@/components/deals/reservation-agreement-pdf";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  cn,
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
    deals,
    moveLeadStage,
    sendMessage,
    createDealFromReservation,
    updateQuotationStatus,
    addLeadDocument,
  } = useCrmStore();
  const { agentProfile } = useAuth();

  // Find matching quotation by shareToken or fallback to URL query / default property
  const matchedQuotation = React.useMemo(
    () => quotations.find((q) => q.shareToken === params.token),
    [quotations, params.token]
  );

  // Automatically update status to VIEWED when client opens the proposal link
  React.useEffect(() => {
    if (matchedQuotation && matchedQuotation.status === "SENT") {
      updateQuotationStatus(matchedQuotation.id, "VIEWED");
    }
  }, [matchedQuotation, updateQuotationStatus]);

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

  const [selectedPropertyId, setSelectedPropertyId] = React.useState<
    string | null
  >(null);

  const activeProperty = React.useMemo(() => {
    if (selectedPropertyId) {
      return (
        properties.find((p) => p.id === selectedPropertyId) ?? matchedProperty
      );
    }
    return matchedProperty;
  }, [selectedPropertyId, properties, matchedProperty]);

  const [compareIds, setCompareIds] = React.useState<string[]>(() => {
    return properties.slice(0, 3).map((p) => p.id);
  });
  const [showComparison, setShowComparison] = React.useState(true);

  const baseInput: QuotationCalculationInput = React.useMemo(() => {
    if (matchedQuotation && !selectedPropertyId) {
      return matchedQuotation.calculationInput;
    }

    return {
      projectName: activeProperty.projectName,
      unitCode: activeProperty.unitCode,
      floorAreaSqm: activeProperty.floorAreaSqm,
      lotAreaSqm: activeProperty.lotAreaSqm,
      listPrice: activeProperty.listPrice,
      promoDiscountPercent: 3.0,
      miscFeesPercent: 6.5,
      includeMiscInTcp: true,
      reservationFee: activeProperty.reservationFee,
      downPaymentPercent: 20,
      downPaymentTermMonths: 24,
      annualLumpsumAmount: 0,
      isStepUpEquity: false,
      financingType: "BANK_FINANCING",
      annualInterestRate: 7.5,
      loanTenorYears: 15,
    };
  }, [matchedQuotation, selectedPropertyId, activeProperty]);

  const [selectedTenor, setSelectedTenor] = React.useState<number>(
    baseInput.loanTenorYears
  );
  const [selectedDpMonths, setSelectedDpMonths] = React.useState<number>(
    baseInput.downPaymentTermMonths
  );
  const [isStepUp, setIsStepUp] = React.useState<boolean>(
    baseInput.isStepUpEquity ?? false
  );
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>("PHP");
  const [reservedConfirmed, setReservedConfirmed] = React.useState(false);
  const [createdDealNumber, setCreatedDealNumber] = React.useState<string | null>(
    null
  );
  const [isGeneratingRaf, setIsGeneratingRaf] = React.useState(false);
  const [trippingRequested, setTrippingRequested] = React.useState(false);

  // Floating Broker Concierge Widget State
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatMessageText, setChatMessageText] = React.useState("");
  const [isSendingChatMessage, setIsSendingChatMessage] = React.useState(false);

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
      isStepUpEquity: isStepUp,
    }),
    [baseInput, selectedTenor, selectedDpMonths, isStepUp]
  );

  const result = React.useMemo(
    () => computePropertyQuotation(liveInput),
    [liveInput]
  );

  const comparedUnitsData = React.useMemo(() => {
    return compareIds
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is Property => Boolean(p))
      .map((prop) => {
        const input: QuotationCalculationInput = {
          projectName: prop.projectName,
          unitCode: prop.unitCode,
          floorAreaSqm: prop.floorAreaSqm,
          lotAreaSqm: prop.lotAreaSqm,
          listPrice: prop.listPrice,
          promoDiscountPercent: liveInput.promoDiscountPercent,
          miscFeesPercent: liveInput.miscFeesPercent,
          includeMiscInTcp: liveInput.includeMiscInTcp,
          reservationFee: prop.reservationFee,
          downPaymentPercent: liveInput.downPaymentPercent,
          downPaymentTermMonths: selectedDpMonths,
          annualLumpsumAmount: 0,
          isStepUpEquity: isStepUp,
          financingType: liveInput.financingType,
          annualInterestRate: liveInput.annualInterestRate,
          loanTenorYears: selectedTenor,
        };
        const computed = computePropertyQuotation(input);
        const pricePerSqm =
          prop.floorAreaSqm > 0
            ? computed.totalContractPrice / prop.floorAreaSqm
            : 0;
        return {
          property: prop,
          input,
          computed,
          pricePerSqm,
          isCurrent: prop.id === activeProperty.id,
        };
      });
  }, [
    compareIds,
    properties,
    liveInput.promoDiscountPercent,
    liveInput.miscFeesPercent,
    liveInput.includeMiscInTcp,
    liveInput.downPaymentPercent,
    liveInput.financingType,
    liveInput.annualInterestRate,
    selectedDpMonths,
    isStepUp,
    selectedTenor,
    activeProperty.id,
  ]);

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
        propertyId: activeProperty.id,
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

      if (matchedQuotation) {
        updateQuotationStatus(matchedQuotation.id, "ACCEPTED");
      }

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

  const matchingDeal = React.useMemo(() => {
    if (createdDealNumber) {
      return deals.find((d) => d.dealNumber === createdDealNumber) ?? null;
    }
    if (matchedQuotation?.id) {
      return deals.find((d) => d.quotationId === matchedQuotation.id) ?? null;
    }
    return null;
  }, [deals, createdDealNumber, matchedQuotation]);

  const handleDownloadBuyerRaf = async () => {
    if (!matchingDeal) {
      toast.error("Deal record not found.");
      return;
    }
    setIsGeneratingRaf(true);
    try {
      await downloadReservationAgreementPdf({
        deal: matchingDeal,
        buyerName: buyerLead
          ? `${buyerLead.firstName} ${buyerLead.lastName}`
          : "Valued Buyer",
        buyerEmail: buyerLead?.email,
        buyerPhone: buyerLead?.phone,
        buyerAddress: buyerLead?.notes,
        projectName: liveInput.projectName,
        unitCode: liveInput.unitCode,
        floorAreaSqm: liveInput.floorAreaSqm,
        lotAreaSqm: liveInput.lotAreaSqm,
        agentName: agentProfile?.fullName || "Licensed Sales Consultant",
        agentPrcLicense: agentProfile?.prcLicenseNumber || "PRC RESA #20891",
        agentDhsudNumber: "DHSUD-NCR-AA-09821",
        brokerName: "Atty. Maria Santos, REB",
        brokerPrcLicense: "PRC REB #0019482",
        brokerDhsudNumber: "DHSUD-NCR-B-04281",
      });
      toast.success("Official Reservation Agreement (RAF) downloaded!");
    } catch (err) {
      console.error("Failed to generate RAF PDF:", err);
      toast.error("Failed to generate Reservation Agreement PDF.");
    } finally {
      setIsGeneratingRaf(false);
    }
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

  const handleSendBrokerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    setIsSendingChatMessage(true);
    if (buyerLead) {
      if (matchedQuotation) {
        updateQuotationStatus(matchedQuotation.id, "ACCEPTED");
      }

      sendMessage(
        buyerLead.id,
        `💬 [Buyer Portal Message]: "${chatMessageText.trim()}" (Regarding ${liveInput.projectName} - ${liveInput.unitCode})`
      );
    }
    toast.success("Message sent! Your broker will reply shortly.");
    setChatMessageText("");
    setIsSendingChatMessage(false);
    setIsChatOpen(false);
  };

  const [uploadingDocCode, setUploadingDocCode] = React.useState<string | null>(null);

  const kycMetrics = React.useMemo(() => {
    const docs = buyerLead?.documents ?? [];
    const requiredDefs = STANDARD_KYC_REQUIREMENTS.filter((r) => r.required);
    const uploadedRequiredCount = requiredDefs.filter((r) =>
      docs.some((d) => d.type === r.type)
    ).length;
    const verifiedCount = docs.filter(
      (d) => d.verified || d.status === "VERIFIED"
    ).length;
    const progressPct = Math.round(
      (uploadedRequiredCount / (requiredDefs.length || 1)) * 100
    );
    return {
      totalRequired: requiredDefs.length,
      uploadedRequiredCount,
      verifiedCount,
      progressPct,
    };
  }, [buyerLead?.documents]);

  const handleKycFileUpload = async (
    reqDef: (typeof STANDARD_KYC_REQUIREMENTS)[number],
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!buyerLead) {
      toast.error(
        "Lead profile not found. Please contact your property specialist."
      );
      return;
    }

    setUploadingDocCode(reqDef.code);
    try {
      const fileUrl = await uploadMediaFile(file, "kyc");
      addLeadDocument(buyerLead.id, {
        name: file.name,
        type: reqDef.type,
        fileUrl,
        verified: false,
      });
      toast.success(
        `Uploaded ${reqDef.label}! Your accredited broker has been notified for review.`
      );
    } catch (err) {
      console.error("KYC Document upload failed:", err);
      toast.error(
        "Failed to upload document. Please try again or reach out to your broker."
      );
    } finally {
      setUploadingDocCode(null);
      event.target.value = "";
    }
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

      {(createdDealNumber || matchingDeal) && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-foreground">
                Digital Reservation Confirmed — Deal Room {createdDealNumber || matchingDeal?.dealNumber} Active
              </p>
              <p className="text-muted-foreground">
                Official Philippine Reservation Agreement (RAF) has been executed and linked to your Deal Room.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 border-emerald-600/30 hover:bg-emerald-500/10"
              onClick={handleDownloadBuyerRaf}
              disabled={isGeneratingRaf}
            >
              {isGeneratingRaf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Download RAF (PDF)
            </Button>
            <Button size="sm" variant="default" className="h-8 text-xs" asChild>
              <Link href="/deals">Open Deal Room →</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main Interactive Quotation Card */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="border-b bg-muted/30 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-2xl font-serif font-normal tracking-tight sm:text-3xl">
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
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  Step-Up Scheme (Lower Yr 1 starter payment)
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={isStepUp ? "default" : "outline"}
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setIsStepUp(!isStepUp)}
                >
                  {isStepUp ? "Step-Up Active ✓" : "Enable Step-Up"}
                </Button>
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
              <span className="text-xl sm:text-2xl font-serif font-normal tabular-nums block text-foreground">
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary block">
                  Monthly Down Payment ({selectedDpMonths} mos)
                </span>
                {isStepUp && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary text-primary font-semibold">
                    Step-Up
                  </Badge>
                )}
              </div>
              <span className="text-xl sm:text-2xl font-serif font-normal text-primary tabular-nums block">
                {isStepUp && result.downPaymentSchedule[0]
                  ? `Starts at ${formatCurrency(result.downPaymentSchedule[0].amountDue)}`
                  : formatCurrency(result.monthlyDownPayment)}
              </span>
              {selectedCurrency !== "PHP" && (
                <span className="text-xs font-bold text-primary/80 block tabular-nums">
                  ≈ {formatCurrency(
                    convertFromPhp(
                      isStepUp && result.downPaymentSchedule[0]
                        ? result.downPaymentSchedule[0].amountDue
                        : result.monthlyDownPayment,
                      selectedCurrency
                    ),
                    selectedCurrency
                  )}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {isStepUp
                  ? `Yr 1 starter equity · 0% interest period`
                  : `0% Interest during Equity Period`}
              </span>
            </div>

            <div className="rounded-lg border p-3.5">
              <span className="text-xs text-muted-foreground block">
                Monthly Bank/HDMF Loan ({selectedTenor} yrs)
              </span>
              <span className="text-xl sm:text-2xl font-serif font-normal tabular-nums block text-foreground">
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

            {reservedConfirmed || matchingDeal ? (
              <Button
                size="lg"
                className="w-full text-xs gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={handleDownloadBuyerRaf}
                disabled={isGeneratingRaf}
              >
                {isGeneratingRaf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSignature className="h-4 w-4" />
                )}
                Download Official Reservation Agreement (RAF) PDF
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full text-xs gap-2"
                onClick={() => setIsReserveModalOpen(true)}
              >
                <Lock className="h-4 w-4" />
                E-Sign & Reserve Unit (
                {formatCurrency(liveInput.reservationFee, "PHP", 0)})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Documentary Requirements & KYC Checklist Card */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  KYC &amp; Documentary Requirements Checklist
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Real Estate Compliance Vault
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload documentary requirements for unit reservation approval, buyer accreditation, and contract-to-sell execution.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge
                variant={kycMetrics.progressPct === 100 ? "won" : "secondary"}
                className="text-xs px-2.5 py-1 gap-1"
              >
                {kycMetrics.progressPct === 100 ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {kycMetrics.uploadedRequiredCount} of {kycMetrics.totalRequired} Required Completed ({kycMetrics.progressPct}%)
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  kycMetrics.progressPct === 100
                    ? "bg-emerald-600"
                    : kycMetrics.progressPct > 50
                    ? "bg-primary"
                    : "bg-amber-500"
                )}
                style={{ width: `${kycMetrics.progressPct}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {STANDARD_KYC_REQUIREMENTS.map((req) => {
              const matchingDoc = buyerLead?.documents.find(
                (d) => d.type === req.type
              );
              const isUploadingThis = uploadingDocCode === req.code;
              const isVerified = matchingDoc?.status === "VERIFIED" || matchingDoc?.verified;
              const isRejected = matchingDoc?.status === "REJECTED";
              const isPending = !!matchingDoc && !isVerified && !isRejected;

              return (
                <div
                  key={req.code}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3.5 transition-all text-xs",
                    isVerified
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isRejected
                      ? "border-destructive/30 bg-destructive/5"
                      : matchingDoc
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {isVerified ? (
                          <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : isRejected ? (
                          <FileWarning className="h-4 w-4 text-destructive shrink-0" />
                        ) : matchingDoc ? (
                          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span>{req.label}</span>
                      </div>
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
                        className="text-[9px] h-4 px-1.5 shrink-0"
                      >
                        {isVerified
                          ? "Verified ✓"
                          : isRejected
                          ? "Action Required"
                          : isPending
                          ? "Under Review"
                          : req.required
                          ? "Required"
                          : "Optional"}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {req.description}
                    </p>

                    {matchingDoc && (
                      <div className="rounded-md bg-background/80 p-2 border space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-muted-foreground truncate max-w-[180px]">
                            {matchingDoc.name}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(matchingDoc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {matchingDoc.remarks && (
                          <p className="text-[10px] text-destructive italic">
                            Broker note: {matchingDoc.remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t">
                    {matchingDoc?.fileUrl ? (
                      <a
                        href={matchingDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View File
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        Not uploaded yet
                      </span>
                    )}

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isUploadingThis}
                        onChange={(e) => handleKycFileUpload(req, e)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant={matchingDoc ? "outline" : "default"}
                        className="h-7 text-xs gap-1 pointer-events-none"
                        disabled={isUploadingThis}
                      >
                        {isUploadingThis ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : matchingDoc ? (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            <span>Replace</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3 w-3" />
                            <span>Upload</span>
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              Bank-grade 256-bit encrypted KYC vault. Uploaded documents are transmitted only to your accredited licensed broker and developer compliance officer for unit purchase processing.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Unit Comparison Portal */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  Side-by-Side Unit Comparison
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Real-time Amortization Sync
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Compare configurations with identical equity stretch periods ({selectedDpMonths} mos) &amp; currency rates.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowComparison(!showComparison)}
            >
              <ArrowLeftRight className="h-3 w-3" />
              {showComparison ? "Collapse Comparison" : "Expand Comparison (3 Units)"}
            </Button>
          </div>
        </CardHeader>

        {showComparison && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {comparedUnitsData.map((item, index) => {
                const prop = item.property;
                const comp = item.computed;
                const isSelected = item.isCurrent;

                // Variance calculation vs active unit
                const dpVariance =
                  comp.monthlyDownPayment - result.monthlyDownPayment;
                const tcpVariance =
                  comp.totalContractPrice - result.totalContractPrice;

                return (
                  <div
                    key={prop.id}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border p-4 transition-all space-y-3",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                        : "bg-card hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="text-[10px] h-4 px-1.5 font-semibold gap-1"
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                          {isSelected ? "Active Quotation" : `Option ${index + 1}`}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {prop.bedrooms} Bed • {prop.floorAreaSqm} sqm
                        </span>
                      </div>

                      {/* Dropdown to swap unit in this column */}
                      <select
                        value={prop.id}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setCompareIds((prev) => {
                            const updated = [...prev];
                            updated[index] = newId;
                            return updated;
                          });
                        }}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.projectName} — {p.unitCode} ({p.floorAreaSqm} sqm)
                          </option>
                        ))}
                      </select>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Total Contract Price (TCP)
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-serif font-bold text-foreground tabular-nums">
                            {formatCurrency(comp.totalContractPrice, "PHP", 0)}
                          </span>
                        </div>
                        {selectedCurrency !== "PHP" && (
                          <span className="text-[11px] font-bold text-primary tabular-nums block">
                            ≈ {formatCurrency(
                              convertFromPhp(comp.totalContractPrice, selectedCurrency),
                              selectedCurrency,
                              0
                            )}
                          </span>
                        )}
                        {!isSelected && tcpVariance !== 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold block tabular-nums",
                              tcpVariance > 0 ? "text-amber-600" : "text-emerald-600"
                            )}
                          >
                            {tcpVariance > 0 ? "+" : ""}
                            {formatCurrency(tcpVariance, "PHP", 0)} vs active
                          </span>
                        )}
                      </div>

                      {/* Metric Breakdown Box */}
                      <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Price per Sqm:</span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(item.pricePerSqm, "PHP", 0)}/sqm
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Monthly Equity ({selectedDpMonths}m):
                          </span>
                          <span className="font-bold text-primary tabular-nums">
                            {isStepUp && comp.downPaymentSchedule[0]
                              ? `Starts ₱${comp.downPaymentSchedule[0].amountDue.toLocaleString()}`
                              : formatCurrency(comp.monthlyDownPayment, "PHP", 0)}
                          </span>
                        </div>

                        {!isSelected && dpVariance !== 0 && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">DP Variance:</span>
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                dpVariance > 0 ? "text-amber-600" : "text-emerald-600"
                              )}
                            >
                              {dpVariance > 0 ? "+" : ""}
                              {formatCurrency(dpVariance, "PHP", 0)}/mo
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-0.5 border-t">
                          <span className="text-muted-foreground">
                            Bank Loan ({selectedTenor}y):
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(comp.monthlyAmortization, "PHP", 0)}/mo
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      {isSelected ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-xs font-semibold gap-1.5 cursor-default opacity-90"
                          disabled
                        >
                          <Check className="h-3.5 w-3.5" />
                          Currently Computing
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                          onClick={() => {
                            setSelectedPropertyId(prop.id);
                            toast.success(`Switched active quote to ${prop.unitCode}!`);
                          }}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          Select &amp; Compute Unit
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
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

      {/* Floating Broker Concierge Widget */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-3 w-[320px] sm:w-[350px] rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all animate-in slide-in-from-bottom-3">
            {/* Widget Header */}
            <div className="bg-primary p-3.5 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-serif font-bold text-sm">
                    {agentProfile?.fullName
                      ? agentProfile.fullName.charAt(0)
                      : "A"}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight flex items-center gap-1">
                      {agentProfile?.fullName || "Licensed Real Estate Broker"}
                      <UserCheck className="h-3 w-3 text-emerald-300" />
                    </h4>
                    <p className="text-[10px] text-primary-foreground/80">
                      {agentProfile?.prcLicenseNumber || "PRC RESA Accredited"}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Direct Connect Quick Buttons */}
            <div className="p-3 space-y-2.5 bg-muted/10">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`https://wa.me/${(agentProfile?.phone || "+639178829102").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${agentProfile?.fullName || "Broker"}, I'm reviewing the quotation for ${liveInput.projectName} (${liveInput.unitCode}) and have a question.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border bg-card p-2 text-xs font-semibold text-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  WhatsApp
                </a>
                <a
                  href={`tel:${agentProfile?.phone || "+639178829102"}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border bg-card p-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  Call Broker
                </a>
              </div>

              {/* Inquiry Form */}
              <form
                onSubmit={handleSendBrokerMessage}
                className="space-y-2 pt-1 border-t"
              >
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Ask a question about this computation:
                </span>
                <textarea
                  value={chatMessageText}
                  onChange={(e) => setChatMessageText(e.target.value)}
                  placeholder="e.g. Can we request a 36-month stretch or parking slot inclusion?"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-input bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5"
                  disabled={isSendingChatMessage || !chatMessageText.trim()}
                >
                  <Send className="h-3 w-3" />
                  Send to Broker CRM
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Floating Trigger Pill */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          size="lg"
          className="h-11 rounded-full shadow-xl gap-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground ring-4 ring-primary/20 transition-all hover:scale-105"
        >
          <div className="relative">
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <span className="font-semibold text-xs">
            {isChatOpen ? "Close Concierge" : "Chat with Broker"}
          </span>
        </Button>
      </div>
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
