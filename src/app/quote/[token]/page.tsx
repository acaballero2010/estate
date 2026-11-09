"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eraser,
  ExternalLink,
  Eye,
  FileCheck,
  FileSignature,
  FileText,
  FileWarning,
  Film,
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
  Trophy,
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
import { WhatsAppViberShareModal } from "@/components/quotations/whatsapp-viber-share-modal";
import { PropertyShowcaseDialog } from "@/components/properties/property-showcase-dialog";
import { uploadMediaFile } from "@/lib/firebase/storage-upload";
import { doc, getDoc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase/config";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth, type AgentProfile } from "@/lib/firebase/auth-context";
import {
  cn,
  convertFromPhp,
  CURRENCY_CONFIGS,
  formatCurrency,
  normalizePhoneForWhatsApp,
  normalizePhoneForTel,
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
    messages,
    properties,
    deals,
    moveLeadStage,
    sendMessage,
    sendClientPortalMessage,
    createDealFromReservation,
    updateQuotationStatus,
    addLeadDocument,
    addTripping,
    messengerSettings,
  } = useCrmStore();
  const { agentProfile } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);
  const [publicAgentProfile, setPublicAgentProfile] =
    React.useState<AgentProfile | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find matching quotation by shareToken or fallback to URL query / default property
  const matchedQuotation = React.useMemo(
    () => quotations.find((q) => q.shareToken === params.token),
    [quotations, params.token]
  );

  // If quotation is opened by client who is not logged in, fetch the issuing agent
  React.useEffect(() => {
    if (agentProfile) {
      setPublicAgentProfile(agentProfile);
      return;
    }
    const targetAgentId = matchedQuotation?.agentId;
    if (targetAgentId) {
      const loadAgent = async () => {
        try {
          const snap = await getDoc(doc(firestoreDb, "agents", targetAgentId));
          if (snap.exists()) {
            setPublicAgentProfile({
              uid: targetAgentId,
              ...(snap.data() as Omit<AgentProfile, "uid">),
            });
          }
        } catch {
          // ignore
        }
      };
      void loadAgent();
    }
  }, [agentProfile, matchedQuotation?.agentId]);

  const effectiveAgent = agentProfile || publicAgentProfile;

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
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

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
  const [isClientTrippingModalOpen, setIsClientTrippingModalOpen] = React.useState(false);
  const [clientTrippingDate, setClientTrippingDate] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [clientTrippingTime, setClientTrippingTime] = React.useState("14:00");
  const [clientTrippingNotes, setClientTrippingNotes] = React.useState("");

  // Floating Broker Concierge Widget State
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isCredibilityModalOpen, setIsCredibilityModalOpen] = React.useState(false);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = React.useState(false);
  const [showcaseTargetProperty, setShowcaseTargetProperty] = React.useState<Property | null>(null);
  const [chatMessageText, setChatMessageText] = React.useState("");
  const [isSendingChatMessage, setIsSendingChatMessage] = React.useState(false);
  const [justSentMessage, setJustSentMessage] = React.useState(false);

  const portalLeadMessages = React.useMemo(() => {
    const targetLead = buyerLead || leads[0];
    if (!targetLead) return [];
    return messages
      .filter((m) => m.leadId === targetLead.id)
      .slice(-4);
  }, [messages, buyerLead, leads]);

  // KYC & Documentary Checklist (Hidden by default for preliminary inquiry stages)
  const initialShowKyc = searchParams.get("kyc") === "true" || searchParams.get("kyc") === "1";
  const [showKycChecklist, setShowKycChecklist] = React.useState<boolean>(initialShowKyc);

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
    setShowKycChecklist(true);
    setIsReserveModalOpen(false);
    toast.success(
      "Unit officially reserved! Deal Room & Commission Split created in /deals."
    );
  };

  const handleScheduleViewing = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerLead) {
      if (
        buyerLead.stage === "NEW_LEAD" ||
        buyerLead.stage === "CONTACTED"
      ) {
        moveLeadStage(buyerLead.id, "SITE_TRIPPING");
      }

      sendMessage(
        buyerLead.id,
        `📅 [Buyer Portal Action]: ${buyerLead.firstName} booked a Showroom & Site Viewing for ${liveInput.projectName} (${liveInput.unitCode}) on ${clientTrippingDate} at ${clientTrippingTime}.`
      );
    }

    addTripping({
      leadId: buyerLead?.id || "demo-lead",
      propertyId: activeProperty.id,
      scheduledDate: clientTrippingDate,
      scheduledTime: clientTrippingTime,
      meetingPoint: `${activeProperty.projectName} Main Pavilion`,
      status: "CONFIRMED",
      notes: clientTrippingNotes || "Booked directly by client via online quote portal.",
    });

    setTrippingRequested(true);
    setIsClientTrippingModalOpen(false);
    toast.success("Showroom viewing confirmed! Your gate pass has been issued.");
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
        agentName: effectiveAgent?.fullName || "Licensed Sales Consultant",
        agentPrcLicense: effectiveAgent?.prcLicenseNumber || "PRC Accredited",
        agentDhsudNumber: effectiveAgent?.dhsudRegistrationNo || "DHSUD-NCR-AA-09821",
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
      agentName: effectiveAgent?.fullName,
      agentLicense: effectiveAgent?.prcLicenseNumber,
      input: liveInput,
      result,
    });
    toast.success("Official PDF quotation downloaded");
  };

  const handleSendBrokerMessage = (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (directText ?? chatMessageText).trim();
    if (!textToSend) return;
    setIsSendingChatMessage(true);

    const targetLead = buyerLead || leads[0];
    if (targetLead) {
      sendClientPortalMessage(
        targetLead.id,
        textToSend,
        matchedQuotation?.id
      );
    }

    toast.success("Message sent! Your broker will reply shortly.");
    setChatMessageText("");
    setIsSendingChatMessage(false);
    setJustSentMessage(true);
    setTimeout(() => {
      setJustSentMessage(false);
    }, 4500);
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
    <div className="container max-w-4xl space-y-4 sm:space-y-6 px-3.5 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
      {/* Verified Share Portal Banner */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-primary/5 p-3.5 sm:p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="won" className="text-[10px] gap-1 shrink-0 py-0.5">
                <ShieldCheck className="h-3 w-3" /> Verified Client Quotation
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono truncate">
                Token: {params.token}
              </span>
            </div>
            <h1 className="mt-1 text-sm sm:text-lg font-bold leading-tight">
              Prepared Exclusively for{" "}
              {buyerLead
                ? `${buyerLead.firstName} ${buyerLead.lastName}`
                : "Valued Property Buyer"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400 w-full sm:w-auto justify-center"
            onClick={() => setShareModalOpen(true)}
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 w-full sm:w-auto justify-center"
            onClick={handleDownloadBuyerPdf}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Accredited Consultant Bar */}
      {isMounted && effectiveAgent ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center text-primary font-bold text-base shadow-xs">
                {effectiveAgent.avatarUrl ? (
                  <img
                    src={effectiveAgent.avatarUrl}
                    alt={effectiveAgent.fullName || "Agent"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{effectiveAgent.fullName ? effectiveAgent.fullName.charAt(0) : "A"}</span>
                )}
              </div>
              {effectiveAgent.licensingBodyLogoUrl && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border shadow-xs p-0.5 overflow-hidden">
                  <img
                    src={effectiveAgent.licensingBodyLogoUrl}
                    alt="Seal"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-0.5 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-foreground flex items-center gap-1 truncate">
                  <span className="truncate">{effectiveAgent.fullName || "Licensed Real Estate Broker"}</span>
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                </span>
                <Badge variant="won" className="text-[9px] py-0 px-1.5 h-4 whitespace-nowrap shrink-0">
                  PRC &amp; DHSUD
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {effectiveAgent.prcLicenseNumber || "PRC Accredited"}
                {effectiveAgent.agencyName && ` • ${effectiveAgent.agencyName}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full sm:w-auto justify-center"
              onClick={() => setIsCredibilityModalOpen(true)}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Consultant Bio</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full sm:w-auto justify-center"
              asChild
            >
              <Link href="/showcase?view=client" target="_blank" rel="noopener noreferrer">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">All Properties</span>
                <ExternalLink className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-20 rounded-xl border bg-card/60 p-4 animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
          <div className="h-8 w-28 bg-muted rounded" />
        </div>
      )}

      {/* Multi-Currency Toggle for Overseas & OFW Buyers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border bg-muted/20 p-3 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold">View in Your Earning Currency:</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Indicative exchange rate for overseas buyers & OFWs
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-1 px-1 w-full sm:w-auto">
          {(Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]).map((curr) => {
            const conf = CURRENCY_CONFIGS[curr];
            const isSelected = selectedCurrency === curr;
            return (
              <Button
                key={curr}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
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
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="proposal" className="text-[10px]">
                {activeProperty.propertyType?.replace(/_/g, " ")} • {activeProperty.locationCity}
              </Badge>
              {activeProperty.turnoverDate && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Turnover: {activeProperty.turnoverDate}
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl font-serif font-normal tracking-tight sm:text-3xl">
              {liveInput.projectName}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-foreground mt-0.5">
              Unit {liveInput.unitCode} • Floor Area: {liveInput.floorAreaSqm} sqm
              {liveInput.lotAreaSqm > 0
                ? ` • Lot Area: ${liveInput.lotAreaSqm} sqm`
                : ""}
            </CardDescription>

            {/* Direct Modal Access to Property Showcase */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 w-full sm:w-auto justify-center"
                onClick={() => {
                  setShowcaseTargetProperty(activeProperty);
                  setIsShowcaseModalOpen(true);
                }}
              >
                <Film className="h-3.5 w-3.5 text-primary-foreground shrink-0" />
                <span>View Photos, Floor Plan &amp; 360° Tour</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-5 space-y-4 sm:space-y-6">
          {/* Interactive Buyer Term Customizer */}
          <div className="grid gap-3 sm:gap-4 rounded-xl border bg-muted/20 p-3 sm:p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                Customize Down Payment Stretch Period:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[12, 18, 24, 36].map((mos) => (
                  <Button
                    key={mos}
                    type="button"
                    size="sm"
                    variant={selectedDpMonths === mos ? "default" : "outline"}
                    className="h-8 text-xs px-1"
                    onClick={() => setSelectedDpMonths(mos)}
                  >
                    {mos} Mos
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Step-Up Scheme (Lower Yr 1 starter payment)
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={isStepUp ? "default" : "outline"}
                  className="h-6 px-2 text-[10px] shrink-0"
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
              <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                {[5, 10, 15, 20, 25].map((yr) => (
                  <Button
                    key={yr}
                    type="button"
                    size="sm"
                    variant={selectedTenor === yr ? "default" : "outline"}
                    className="h-8 text-xs px-0.5 sm:px-1"
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
              onClick={() => setIsClientTrippingModalOpen(true)}
            >
              <CalendarCheck className="h-4 w-4 text-primary" />
              {trippingRequested
                ? "Showroom Viewing Confirmed ✓"
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

      {/* Buyer Documentary Requirements & KYC Checklist Card (Collapsible) */}
      {!showKycChecklist ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-4 transition-all hover:bg-muted/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-foreground">
                    Documentary Requirements &amp; KYC Verification
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    Optional at Inquiry Stage
                  </Badge>
                  {kycMetrics.uploadedRequiredCount > 0 && (
                    <Badge variant="won" className="text-[10px] py-0 px-1.5 h-4 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {kycMetrics.uploadedRequiredCount} of {kycMetrics.totalRequired} Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Evaluating pricing and payment terms? Document verification is optional now and only required once you decide to reserve.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 self-start sm:self-center shrink-0 border-primary/30 hover:border-primary text-foreground"
              onClick={() => setShowKycChecklist(true)}
            >
              <ChevronDown className="h-3.5 w-3.5 text-primary" />
              <span>{kycMetrics.uploadedRequiredCount > 0 ? "Review Documents" : "Show Document Checklist"}</span>
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border shadow-sm transition-all animate-in fade-in-50">
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

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKycChecklist(false)}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Hide Checklist</span>
                </Button>
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
      )}

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

                      {/* Direct Link to Showcase for this compared unit */}
                      <div className="pt-1.5 flex items-center justify-between text-[11px] border-t">
                        <span className="text-muted-foreground">Virtual Tour &amp; Media:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowcaseTargetProperty(prop);
                            setIsShowcaseModalOpen(true);
                          }}
                          className="font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <Film className="h-3 w-3 text-primary" />
                          <span>View {prop.unitCode} 360°</span>
                        </button>
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
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-2.5 w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all animate-in slide-in-from-bottom-3">
            {/* Widget Header */}
            <div className="bg-primary p-3.5 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-serif font-bold text-sm overflow-hidden ring-1 ring-white/30 shadow-inner">
                    {effectiveAgent?.avatarUrl ? (
                      <img
                        src={effectiveAgent.avatarUrl}
                        alt={effectiveAgent.fullName || "Broker"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{effectiveAgent?.fullName ? effectiveAgent.fullName.charAt(0) : "A"}</span>
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold leading-tight flex items-center gap-1 truncate">
                      <span className="truncate">{effectiveAgent?.fullName || "Licensed Real Estate Broker"}</span>
                      <UserCheck className="h-3 w-3 text-emerald-300 shrink-0" />
                      {effectiveAgent?.licensingBodyLogoUrl && (
                        <img
                          src={effectiveAgent.licensingBodyLogoUrl}
                          alt="Seal"
                          className="h-3.5 w-3.5 rounded-full bg-white object-contain p-0.5 ml-0.5 shrink-0"
                        />
                      )}
                    </h4>
                    <p className="text-[10px] text-primary-foreground/80 font-mono truncate">
                      {effectiveAgent?.prcLicenseNumber || "PRC RESA Accredited"}
                      {effectiveAgent?.dhsudRegistrationNo && ` • ${effectiveAgent.dhsudRegistrationNo}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:bg-white/20 rounded-full shrink-0"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {effectiveAgent?.awards && effectiveAgent.awards.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/15 flex flex-wrap gap-1">
                  {effectiveAgent.awards.slice(0, 2).map((aw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-medium text-white"
                    >
                      <Trophy className="h-2.5 w-2.5 text-amber-300" />
                      {aw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Connect Quick Buttons: WhatsApp, Messenger, Call */}
            <div className="p-3 space-y-2.5 bg-muted/10">
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <a
                  href={`https://wa.me/${normalizePhoneForWhatsApp(effectiveAgent?.phone || "+639178829102")}?text=${encodeURIComponent(
                    `Hi ${effectiveAgent?.fullName || "Broker"}, I'm reviewing the quotation for ${liveInput.projectName} (${liveInput.unitCode}) and have a question.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-2 text-[11px] font-semibold text-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-2xs text-center"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate w-full">WhatsApp</span>
                </a>

                <a
                  href={
                    effectiveAgent?.messengerUrl?.startsWith("http")
                      ? effectiveAgent.messengerUrl
                      : effectiveAgent?.messengerUrl
                      ? `https://m.me/${effectiveAgent.messengerUrl.replace(/^@/, "")}`
                      : messengerSettings?.pageId
                      ? `https://m.me/${messengerSettings.pageId}`
                      : effectiveAgent?.facebookUrl || "https://m.me/propflow"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-2 text-[11px] font-semibold text-foreground hover:border-[#0084FF] hover:text-[#0084FF] transition-colors shadow-2xs text-center"
                >
                  <svg className="h-4 w-4 fill-[#0084FF] shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.526 3.735 7.185.195.142.316.368.319.61l.035 1.926c.017.92.973 1.517 1.79 1.115l2.257-1.111c.187-.092.404-.108.604-.047.904.275 1.868.421 2.86.421 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.096 12.445l-2.583-2.756-5.041 2.756 5.545-5.887 2.65 2.756 4.974-2.756-5.545 5.887z" />
                  </svg>
                  <span className="truncate w-full">Messenger</span>
                </a>

                <a
                  href={`tel:${normalizePhoneForTel(effectiveAgent?.phone || "+639178829102")}`}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border bg-card p-2 text-[11px] font-semibold text-foreground hover:border-primary hover:text-primary transition-colors shadow-2xs text-center"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate w-full">Call Broker</span>
                </a>
              </div>

              <div className="flex items-center justify-between text-[11px] px-0.5 pt-1 border-t text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setIsChatOpen(false);
                    setIsCredibilityModalOpen(true);
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
                >
                  <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>View Credentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowcaseTargetProperty(activeProperty);
                    setIsShowcaseModalOpen(true);
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-primary"
                >
                  <Film className="h-3 w-3 text-primary shrink-0" />
                  <span>Unit 360° Tour</span>
                </button>
              </div>

              {/* Recent Conversation History (Live CRM Sync) */}
              {portalLeadMessages.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto rounded-lg border bg-muted/20 p-2 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground pb-1 border-b">
                    <span>Recent Messages</span>
                    <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Live CRM Sync
                    </span>
                  </div>
                  {portalLeadMessages.map((msg) => {
                    const isLead = msg.senderType === "LEAD";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[88%] rounded-lg px-2.5 py-1.5 text-xs shadow-2xs",
                          isLead
                            ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                            : "mr-auto bg-card border text-foreground rounded-bl-none"
                        )}
                      >
                        <p className="leading-snug break-words">{msg.content}</p>
                        <span
                          className={cn(
                            "text-[9px] mt-0.5 self-end opacity-75 font-mono",
                            isLead ? "text-primary-foreground/75" : "text-muted-foreground"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Suggested Quick Inquiries */}
              <div className="space-y-1 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Ask about this computation:
                  </span>
                  {justSentMessage && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 animate-in fade-in">
                      <Check className="h-3 w-3" /> Sent to CRM!
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Can we stretch DP to 36 mos?",
                    "Is parking slot included?",
                    "What are bank financing reqs?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setChatMessageText(chip)}
                      className="text-[10px] rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-2 py-0.5 transition-colors text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inquiry Form */}
              <form
                onSubmit={(e) => handleSendBrokerMessage(e)}
                className="space-y-2 pt-1"
              >
                <textarea
                  value={chatMessageText}
                  onChange={(e) => setChatMessageText(e.target.value)}
                  placeholder="Type your question or request custom payment terms..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-input bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  disabled={isSendingChatMessage || !chatMessageText.trim()}
                >
                  {isSendingChatMessage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Send to Broker CRM</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Floating Trigger Pill */}
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          size="lg"
          className="h-10 sm:h-11 rounded-full shadow-xl gap-2 px-3.5 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground ring-4 ring-primary/20 transition-all hover:scale-105"
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

      {/* Interactive Buyer Site Viewing Booking Modal */}
      <Dialog
        open={isClientTrippingModalOpen}
        onOpenChange={setIsClientTrippingModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Book Showroom &amp; Site Tripping
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reserve your VIP showroom pass, model unit walkthrough, and private parking slot for {liveInput.projectName} ({liveInput.unitCode}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleViewing} className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Preferred Date *</Label>
                <Input
                  type="date"
                  value={clientTrippingDate}
                  onChange={(e) => setClientTrippingDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Preferred Time *</Label>
                <Input
                  type="time"
                  value={clientTrippingTime}
                  onChange={(e) => setClientTrippingTime(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Meeting Point</Label>
              <Input
                value={`${liveInput.projectName} Main Sales Pavilion`}
                disabled
                className="h-8 text-xs bg-muted/40 font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Vehicle Plate / Guest Notes (Optional)</Label>
              <Input
                placeholder="e.g. Bringing 1 vehicle, inspecting 2BR unit"
                value={clientTrippingNotes}
                onChange={(e) => setClientTrippingNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="rounded-lg border bg-muted/20 p-2.5 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Accredited Developer Viewing Pass
              </div>
              <p>
                Our accredited property advisory team will prepare scale models, unit keys, and reserve visitor parking for you.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsClientTrippingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5" />
                Confirm Site Viewing
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Real Estate Consultant Credibility & Verification Modal */}
      <Dialog open={isCredibilityModalOpen} onOpenChange={setIsCredibilityModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Verified PRC &amp; DHSUD Consultant
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                RESA Act RA 9646
              </Badge>
            </div>
            <DialogTitle className="text-lg font-serif font-normal tracking-tight text-foreground sm:text-xl mt-1">
              Professional Real Estate Advisory Credentials
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official regulatory registrations and professional standing for client security and compliance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Header Portrait & Identity Profile */}
            <div className="flex items-start sm:items-center gap-4 p-4 rounded-xl border bg-muted/20 shadow-xs">
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-primary/25 shadow-md bg-background flex items-center justify-center font-bold text-xl sm:text-2xl text-primary font-serif">
                  {effectiveAgent?.avatarUrl ? (
                    <img
                      src={effectiveAgent.avatarUrl}
                      alt={effectiveAgent.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    effectiveAgent?.fullName?.charAt(0) || "A"
                  )}
                </div>
                {effectiveAgent?.licensingBodyLogoUrl && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border shadow-xs p-0.5 overflow-hidden">
                    <img
                      src={effectiveAgent.licensingBodyLogoUrl}
                      alt="Seal"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                    {effectiveAgent?.fullName || "Licensed Real Estate Broker"}
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  </h4>
                  <Badge variant="won" className="text-[10px] py-0 px-2 h-4.5 whitespace-nowrap">
                    Licensed Broker
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {effectiveAgent?.agencyName || "PropFlow Luxury Real Estate"}
                </p>
                {effectiveAgent?.bioHeadline && (
                  <p className="text-[11px] text-muted-foreground/90 italic pt-0.5 line-clamp-2">
                    &ldquo;{effectiveAgent.bioHeadline}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Official Philippine Government Registrations */}
            <div className="space-y-3 rounded-xl border p-4 bg-card shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Official Government Accreditations (PH)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold shrink-0 whitespace-nowrap">
                  Status: Active ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-muted-foreground text-[10px]">
                    <span className="font-semibold uppercase tracking-wider truncate">PRC Broker License</span>
                    <span className="text-emerald-600 font-bold font-mono shrink-0 whitespace-nowrap">Active ✓</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-foreground">
                    {effectiveAgent?.prcLicenseNumber || "PRC Accredited"}
                  </p>
                  {effectiveAgent?.prcExpiryDate && (
                    <p className="text-[10px] text-muted-foreground">
                      License Expiry: {effectiveAgent.prcExpiryDate}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-muted-foreground text-[10px]">
                    <span className="font-semibold uppercase tracking-wider truncate">DHSUD Certificate</span>
                    <span className="text-emerald-600 font-bold font-mono shrink-0 whitespace-nowrap">Active ✓</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-foreground">
                    {effectiveAgent?.dhsudRegistrationNo || "DHSUD Registered"}
                  </p>
                  {effectiveAgent?.dhsudExpiryDate && (
                    <p className="text-[10px] text-muted-foreground">
                      Registration Expiry: {effectiveAgent.dhsudExpiryDate}
                    </p>
                  )}
                </div>
              </div>

              {effectiveAgent?.boardAffiliation && (
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                  <span>Professional Board Affiliation:</span>
                  <span className="font-semibold text-foreground font-mono">{effectiveAgent.boardAffiliation}</span>
                </div>
              )}
            </div>

            {/* Accolades & Badges */}
            {effectiveAgent?.awards && effectiveAgent.awards.length > 0 && (
              <div className="space-y-2 rounded-xl border p-4 bg-card shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Verified Career Honors &amp; Production Awards
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {effectiveAgent.awards.map((award, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 border border-amber-500/20 shadow-xs"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      {award}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Property Showcase Discovery Banner (Clean & Uncompressed) */}
            <div className="rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 space-y-3 shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Quoted Property Media &amp; Masterplan
                </span>
                <h5 className="font-semibold text-sm text-foreground">
                  {liveInput.projectName} • Unit {liveInput.unitCode}
                </h5>
                <p className="text-xs text-muted-foreground">
                  Explore architectural gallery photos, interactive floor plan hotspots, and 360° virtual tour.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs gap-1.5 flex-1 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  onClick={() => {
                    setIsCredibilityModalOpen(false);
                    setShowcaseTargetProperty(activeProperty);
                    setIsShowcaseModalOpen(true);
                  }}
                >
                  <Film className="h-3.5 w-3.5 text-primary-foreground" />
                  <span>View Unit 360° Showcase</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  asChild
                >
                  <Link href="/showcase?view=client" target="_blank" rel="noopener noreferrer">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>All Properties</span>
                    <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Direct Contact Actions: WhatsApp, FB Messenger, Call Directly */}
            {(() => {
              const waNumber = normalizePhoneForWhatsApp(effectiveAgent?.phone);
              const telNumber = normalizePhoneForTel(effectiveAgent?.phone);
              const messengerHref =
                effectiveAgent?.messengerUrl ||
                (messengerSettings?.pageId
                  ? `https://m.me/${messengerSettings.pageId}`
                  : null) ||
                (effectiveAgent?.facebookUrl
                  ? effectiveAgent.facebookUrl.includes("m.me")
                    ? effectiveAgent.facebookUrl
                    : `https://m.me/${effectiveAgent.facebookUrl.replace(/.*facebook\.com\//, "").replace(/\?.*/, "")}`
                  : null) ||
                "https://m.me/propflow.ph";

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. WhatsApp Button */}
                  <Button
                    className="col-span-1 gap-1.5 h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    asChild
                  >
                    <a
                      href={
                        waNumber
                          ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
                              `Hi ${effectiveAgent?.fullName || "Agent"}, I'm reviewing quotation ${params.token} for ${liveInput.projectName}.`
                            )}`
                          : "#"
                      }
                      target={waNumber ? "_blank" : undefined}
                      rel={waNumber ? "noopener noreferrer" : undefined}
                      onClick={(e) => {
                        if (!waNumber) {
                          e.preventDefault();
                          toast.info("Agent mobile number not yet connected.");
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  </Button>

                  {/* 2. FB Messenger Button */}
                  <Button
                    className="col-span-1 gap-1.5 h-10 text-xs font-semibold bg-[#0084FF] hover:bg-[#0073e6] text-white shadow-xs"
                    asChild
                  >
                    <a
                      href={messengerHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        className="h-4 w-4 fill-current shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.12 7.15.16.14.26.35.26.57v2.17c0 .54.58.88 1.05.61l2.42-1.34c.18-.1.38-.13.58-.09.83.23 1.7.35 2.57.35 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.08 13.06l-2.58-2.75c-.2-.21-.52-.21-.72 0l-3.5 3.52c-.44.44-1.04-.13-.72-.67l3.86-6.49c.2-.34.68-.34.88 0l2.58 2.75c.2.21.52.21.72 0l3.5-3.52c.44-.44 1.04.13.72.67l-3.86 6.49c-.2.34-.68.34-.88 0z" />
                      </svg>
                      <span className="truncate">FB Messenger</span>
                    </a>
                  </Button>

                  {/* 3. Call Directly Button */}
                  <Button
                    variant="outline"
                    className="col-span-2 sm:col-span-1 gap-1.5 h-10 text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-colors"
                    asChild
                  >
                    <a
                      href={telNumber ? `tel:${telNumber}` : "#"}
                      onClick={(e) => {
                        if (!telNumber) {
                          e.preventDefault();
                          toast.info("Agent phone number not yet connected.");
                        }
                      }}
                    >
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">Call Directly</span>
                    </a>
                  </Button>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive In-Page Property Showcase Dialog (Photos, Floor Plan, 360° Tour, Vicinity) */}
      <PropertyShowcaseDialog
        property={showcaseTargetProperty || activeProperty}
        open={isShowcaseModalOpen}
        onOpenChange={setIsShowcaseModalOpen}
        isClientView={true}
        onBookViewing={() => {
          setIsShowcaseModalOpen(false);
          setIsClientTrippingModalOpen(true);
        }}
      />

      {/* WhatsApp / Viber Forward & Share Modal */}
      <WhatsAppViberShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        quotationData={{
          projectName: activeProperty.projectName,
          unitCode: activeProperty.unitCode,
          floorAreaSqm: activeProperty.floorAreaSqm,
          locationCity: activeProperty.locationCity,
          totalContractPrice: result.totalContractPrice,
          reservationFee: activeProperty.reservationFee,
          monthlyDownPayment: result.monthlyDownPayment,
          downPaymentMonths: selectedDpMonths,
          monthlyAmortization: result.monthlyAmortization,
          loanTenorYears: selectedTenor,
          annualInterestRate: liveInput.annualInterestRate,
          buyerName: buyerLead
            ? `${buyerLead.firstName} ${buyerLead.lastName}`
            : undefined,
          buyerPhone: buyerLead?.phone,
          agentName: effectiveAgent?.fullName || "Licensed Real Estate Broker",
          agentLicense: effectiveAgent?.prcLicenseNumber || "PRC Accredited",
          shareUrl: `${
            typeof window !== "undefined"
              ? window.location.origin
              : "https://propflow.ph"
          }/quote/${params.token}?leadId=${buyerLead?.id || ""}&unit=${encodeURIComponent(
            activeProperty.unitCode
          )}`,
        }}
        initialCurrency={selectedCurrency}
      />
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
