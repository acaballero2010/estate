"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSignature,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  MessageCircle,
  Receipt,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { getSafePropertyImageUrl } from "@/lib/property-images";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadReservationAgreementPdf } from "@/components/deals/reservation-agreement-pdf";

export default function BuyerDealPortalPage() {
  const params = useParams();
  const dealParam = String(params.dealId || "");

  const { deals, properties, leads } = useCrmStore();

  const deal = React.useMemo(() => {
    return (
      deals.find((d) => d.id === dealParam || d.dealNumber.toLowerCase() === dealParam.toLowerCase()) ||
      deals[0]!
    );
  }, [deals, dealParam]);

  const property = React.useMemo(() => {
    return properties.find((p) => p.id === deal?.propertyId) || properties[0]!;
  }, [properties, deal]);

  const buyer = React.useMemo(() => {
    return leads.find((l) => l.id === deal?.leadId) || leads[0];
  }, [leads, deal]);

  // Payment upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("42250");
  const [paymentMethod, setPaymentMethod] = React.useState<"BANK_TRANSFER" | "GCASH_MAYA" | "CHECK_PDC">("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = React.useState("BPI-INST-88492015");
  const [isSubmittingProof, setIsSubmittingProof] = React.useState(false);
  const [isGeneratingRaf, setIsGeneratingRaf] = React.useState(false);

  // Mock sample 24-month equity installment schedule
  const monthlyEquity = (deal.totalContractPrice * 0.2 - 100000) / 24;

  const installments = React.useMemo(() => {
    const arr = [];
    const baseDate = new Date(deal.reservationDate);
    for (let i = 1; i <= 24; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + i);

      // First 2 installments marked cleared for demo
      const isCleared = i <= 2;
      const isNextDue = i === 3;

      arr.push({
        monthNumber: i,
        dueDate,
        amount: monthlyEquity,
        status: isCleared ? ("CLEARED" as const) : isNextDue ? ("DUE_SOON" as const) : ("UPCOMING" as const),
      });
    }
    return arr;
  }, [deal.reservationDate, monthlyEquity]);

  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProof(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmittingProof(false);
    setIsUploadModalOpen(false);
    toast.success(`Payment proof (Ref: ${referenceNo}) uploaded! Our accounting team will verify within 24 hours.`);
  };

  const handleDownloadRaf = async () => {
    setIsGeneratingRaf(true);
    try {
      await downloadReservationAgreementPdf({
        deal,
        buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : "Assigned Buyer",
        buyerEmail: buyer?.email,
        buyerPhone: buyer?.phone,
        projectName: property.projectName,
        developerName: property.developerName,
        unitCode: property.unitCode,
        floorAreaSqm: property.floorAreaSqm || 84.5,
        parkingSlots: property.parkingSlots || 1,
        turnoverDate: property.turnoverDate || "Q4 2027",
      });
      toast.success("Downloaded Signed Reservation Agreement (PDF)!");
    } catch {
      toast.error("Failed to generate reservation agreement.");
    } finally {
      setIsGeneratingRaf(false);
    }
  };

  const heroImage = getSafePropertyImageUrl(
    property.thumbnailUrl || property.galleryImages?.[0],
    property.propertyType
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Luxury Client Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-serif text-lg font-normal tracking-tight text-foreground block leading-tight">
                PropFlow
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                Client Deal Room
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="won" className="text-[10px] gap-1 py-0.5 px-2">
              <ShieldCheck className="h-3 w-3" />
              Verified Deal Room
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              {deal.dealNumber}
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Unit Card */}
      <div className="border-b bg-muted/20 py-6 px-4">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="reservation" className="text-[10px]">
                  {deal.stage.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {deal.financingType.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Reserved: {new Date(deal.reservationDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
                {property.projectName}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                {property.unitCode} • {property.locationCity} ({property.developerName})
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleDownloadRaf}
                disabled={isGeneratingRaf}
              >
                {isGeneratingRaf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5 text-primary" />}
                <span>Signed Agreement (RAF)</span>
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload Payment Proof</span>
              </Button>
            </div>
          </div>

          {/* Key Financial Snapshot Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground block">Total Contract Price (TCP)</span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-foreground">
                {formatCurrency(deal.totalContractPrice)}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground block">Monthly Equity (24 Mo)</span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-primary">
                {formatCurrency(monthlyEquity)}/mo
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground block">80% Bank Loan Balance</span>
              <span className="text-base sm:text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(deal.totalContractPrice * 0.8)}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground block">Target Turnover</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                {property.turnoverDate || "Q4 2027"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <main className="container max-w-5xl py-6 flex-1 space-y-6">
        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="equity" className="text-xs gap-1.5 h-7">
              <Receipt className="h-3.5 w-3.5" />
              <span>Downpayment Schedule (24 Mo)</span>
            </TabsTrigger>
            <TabsTrigger value="mortgage" className="text-xs gap-1.5 h-7">
              <Landmark className="h-3.5 w-3.5" />
              <span>Bank Mortgage &amp; LOG</span>
            </TabsTrigger>
            <TabsTrigger value="construction" className="text-xs gap-1.5 h-7">
              <Building2 className="h-3.5 w-3.5" />
              <span>Turnover &amp; Construction</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs gap-1.5 h-7">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Document Repository</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Downpayment Schedule */}
          <TabsContent value="equity" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  24-Month Downpayment Equity Ledger
                </h3>
                <p className="text-xs text-muted-foreground">
                  Track monthly installment clearing, upcoming due dates, and post-dated check (PDC) clearances.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 self-start sm:self-auto"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <UploadCloud className="h-3 w-3 text-primary" />
                <span>Upload New Remittance Receipt</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {installments.map((inst) => (
                <div
                  key={inst.monthNumber}
                  className={`rounded-xl border p-3 flex items-center justify-between transition-all ${
                    inst.status === "CLEARED"
                      ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xs"
                      : inst.status === "DUE_SOON"
                      ? "border-amber-500/40 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/30"
                      : "border-border/60 bg-card/40"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground">
                        Month {inst.monthNumber} of 24
                      </span>
                      <Badge
                        variant={
                          inst.status === "CLEARED"
                            ? "won"
                            : inst.status === "DUE_SOON"
                            ? "reservation"
                            : "outline"
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {inst.status === "CLEARED"
                          ? "Cleared"
                          : inst.status === "DUE_SOON"
                          ? "Due Next"
                          : "Scheduled"}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      Due: {inst.dueDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold tabular-nums text-foreground block">
                      {formatCurrency(inst.amount)}
                    </span>
                    {inst.status === "CLEARED" ? (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                        <Check className="h-3 w-3" /> OR Issued
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        Submit Slip
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: Bank Mortgage & LOG */}
          <TabsContent value="mortgage" className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      Accredited Partner Bank: BPI Family Savings Bank
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Application Ref: BPI-HL-2026-88912 • Home Loan Specialist: Ma. Cristina Valenzuela
                    </p>
                  </div>
                </div>

                <Badge variant="won" className="text-xs font-semibold px-2.5 py-0.5">
                  Notice of Approval (NOA) Issued
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <span className="text-[10px] text-muted-foreground block">Takeout Loan Balance</span>
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {formatCurrency(deal.totalContractPrice * 0.8)}
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <span className="text-[10px] text-muted-foreground block">Approved Fixed Rate</span>
                  <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    6.75% Fixed (5 Years)
                  </span>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <span className="text-[10px] text-muted-foreground block">Target Letter of Guarantee (LOG)</span>
                  <span className="text-base font-bold text-foreground">
                    October 15, 2027
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Your 80% balance is 100% pre-approved. Our advisory team handles all appraisals and legal requirements directly with BPI.
                  </span>
                </div>

                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" asChild>
                  <a href="https://wa.me/639175554321" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3 w-3 text-emerald-600" />
                    <span>Chat Loan Officer</span>
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Construction & Turnover */}
          <TabsContent value="construction" className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    Construction &amp; Structural Milestones: 78% Complete
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Quarterly engineering audit report certified by {property.developerName}.
                  </p>
                </div>
                <Badge variant="won" className="text-xs font-mono">
                  On-Schedule for {property.turnoverDate || "Q4 2027"}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>Overall Project Accomplishment</span>
                  <span className="tabular-nums font-mono text-foreground font-bold">78.4%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: "78.4%" }} />
                </div>
              </div>

              {/* Construction gallery cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border overflow-hidden bg-card">
                  <div className="h-32 bg-muted relative">
                    <img src={heroImage} alt="Tower Structure" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                      Structural Frame
                    </span>
                  </div>
                  <div className="p-2.5 text-xs">
                    <span className="font-semibold block">Topping Off Ceremony Complete</span>
                    <span className="text-[10px] text-muted-foreground">42nd Floor Slab Poured &amp; Inspected</span>
                  </div>
                </div>

                <div className="rounded-xl border overflow-hidden bg-card">
                  <div className="h-32 bg-muted relative">
                    <img src={heroImage} alt="Facade Installation" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                      Facade &amp; Glazing
                    </span>
                  </div>
                  <div className="p-2.5 text-xs">
                    <span className="font-semibold block">Curtain Wall Glass 85%</span>
                    <span className="text-[10px] text-muted-foreground">Low-E Double Glazed Windows Installed</span>
                  </div>
                </div>

                <div className="rounded-xl border overflow-hidden bg-card">
                  <div className="h-32 bg-muted relative">
                    <img src={heroImage} alt="Interior Finishing" className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded">
                      Interior Units
                    </span>
                  </div>
                  <div className="p-2.5 text-xs">
                    <span className="font-semibold block">Flooring &amp; Kitchen Cabinets</span>
                    <span className="text-[10px] text-muted-foreground">Level 15–28 Sanitary &amp; Tiles Laid</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Document Repository */}
          <TabsContent value="documents" className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
              <div className="border-b pb-3">
                <h3 className="font-bold text-foreground text-sm">
                  Official Document &amp; Receipt Repository
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified agreements, BIR tax withholdings, and official developer receipts for {deal.dealNumber}.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileSignature className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Signed Reservation Agreement (RAF) &amp; Specimen Signatures
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Executed via Digital E-Sign on {new Date(deal.reservationDate).toLocaleDateString("en-PH")}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleDownloadRaf}>
                    <Download className="h-3 w-3" />
                    <span>PDF</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Official Developer Receipt (OR) — Reservation Fee (₱100,000)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        OR No: OR-AYALA-89211 • Validated
                      </span>
                    </div>
                  </div>
                  <Badge variant="won" className="text-[10px]">
                    Validated ✓
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Notice of Approval (NOA) — BPI Family Home Loan
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        App Ref: BPI-HL-2026-88912 • Loan: ₱15,450,460
                      </span>
                    </div>
                  </div>
                  <Badge variant="won" className="text-[10px]">
                    Approved
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Accredited Real Estate Advisory Footer Card */}
        <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-serif text-sm">
              DC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-foreground">
                  Accredited Broker: Don Caballero, REB
                </span>
                <Badge variant="won" className="text-[9px] px-1 py-0">
                  PRC Licensed
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your designated property advisor is available 7 days a week for banking, legal, and turnover queries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
              <a href="https://wa.me/639175554321" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp Advisor</span>
              </a>
            </Button>
            <Button size="sm" variant="default" className="h-7 text-xs gap-1.5" asChild>
              <Link href="/dashboard">
                <span>Agent CRM</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Upload Monthly Payment Proof Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5">
                <Receipt className="h-3 w-3" />
                Monthly Equity Remittance
              </Badge>
            </div>
            <DialogTitle className="text-base sm:text-lg">
              Upload Monthly Payment Slip
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit your bank deposit slip, GCash receipt, or PDC voucher for official validation by developer accounting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadPaymentProof} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Payment Method / Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-none"
              >
                <option value="BANK_TRANSFER">BPI / BDO Bank Transfer (InstaPay / PESONet)</option>
                <option value="GCASH_MAYA">GCash / Maya QR Payment</option>
                <option value="CHECK_PDC">Post-Dated Check (PDC) Deposit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Amount Paid (₱)
                </label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Bank Reference No.
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. BPI-INST-99482"
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Deposit Slip / Screen Capture
              </label>
              <div className="border border-dashed rounded-lg p-4 text-center bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors">
                <UploadCloud className="h-6 w-6 text-primary mx-auto" />
                <span className="text-xs font-medium text-foreground block mt-1">
                  Click to select photo or screenshot
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, or PDF up to 10MB
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingProof} className="gap-1.5">
                {isSubmittingProof ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Submit for Verification</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
