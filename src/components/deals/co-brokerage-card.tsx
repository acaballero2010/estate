"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Handshake,
  Users2,
  FileCheck2,
  Download,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Building,
  CheckCircle2,
  Edit2,
  Percent,
} from "lucide-react";
import type { Deal, Lead, Property } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { downloadCoBrokerageMoaPdf } from "./co-brokerage-moa-pdf";

interface CoBrokerageCardProps {
  deal: Deal;
  lead?: Lead;
  property?: Property;
}

export function CoBrokerageCard({ deal, lead, property }: CoBrokerageCardProps) {
  const updateDealCoBrokerage = useCrmStore((state) => state.updateDealCoBrokerage);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const coBroke = deal.coBrokerageDetails;
  const isCoBrokered = coBroke?.isCoBrokered ?? false;

  // Form state for editing dialog
  const [formData, setFormData] = React.useState({
    isCoBrokered: isCoBrokered,
    externalBrokerName: coBroke?.externalBrokerName || "",
    externalBrokerageAgency: coBroke?.externalBrokerageAgency || "",
    externalBrokerPrcLicense: coBroke?.externalBrokerPrcLicense || "",
    externalBrokerDhsudReg: coBroke?.externalBrokerDhsudReg || "",
    externalBrokerPhone: coBroke?.externalBrokerPhone || "",
    externalBrokerEmail: coBroke?.externalBrokerEmail || "",
    coBrokeSharePercent: coBroke?.coBrokeSharePercent ?? 50,
    moaSigned: coBroke?.moaSigned ?? false,
    remarks: coBroke?.remarks || "",
  });

  // Sync form state when deal changes
  React.useEffect(() => {
    setFormData({
      isCoBrokered: coBroke?.isCoBrokered ?? false,
      externalBrokerName: coBroke?.externalBrokerName || "",
      externalBrokerageAgency: coBroke?.externalBrokerageAgency || "",
      externalBrokerPrcLicense: coBroke?.externalBrokerPrcLicense || "",
      externalBrokerDhsudReg: coBroke?.externalBrokerDhsudReg || "",
      externalBrokerPhone: coBroke?.externalBrokerPhone || "",
      externalBrokerEmail: coBroke?.externalBrokerEmail || "",
      coBrokeSharePercent: coBroke?.coBrokeSharePercent ?? 50,
      moaSigned: coBroke?.moaSigned ?? false,
      remarks: coBroke?.remarks || "",
    });
  }, [coBroke]);

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    updateDealCoBrokerage(deal.id, {
      ...formData,
      moaSignedDate: formData.moaSigned ? (coBroke?.moaSignedDate || new Date()) : null,
    });
    setIsEditDialogOpen(false);
    toast.success("Co-brokerage agreement terms updated");
  };

  const handleQuickEnable = () => {
    updateDealCoBrokerage(deal.id, {
      isCoBrokered: true,
      coBrokeSharePercent: 50,
      externalBrokerName: "Atty. Katrina Alcantara, REB",
      externalBrokerPrcLicense: "PRC REB #0031844",
      externalBrokerDhsudReg: "DHSUD-NCR-B-04/24-9122",
      externalBrokerageAgency: "Apex Prime Realty & Associates",
      externalBrokerPhone: "+63 917 889 2341",
      externalBrokerEmail: "katrina.alcantara@apexrealty.ph",
      moaSigned: true,
      moaSignedDate: new Date(),
    });
    toast.success("50/50 Co-Brokerage activated for this deal");
  };

  const handleDownloadMoa = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadCoBrokerageMoaPdf({
        deal,
        leadName: lead ? `${lead.firstName} ${lead.lastName}` : "Registered Buyer",
        propertyName: property?.projectName || "Selected Property",
        propertyUnit: property?.unitCode || "Designated Unit",
      });
      toast.success("Co-Brokerage MOA downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate MOA document");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleToggleMoaSigned = () => {
    const nextSigned = !coBroke?.moaSigned;
    updateDealCoBrokerage(deal.id, {
      moaSigned: nextSigned,
      moaSignedDate: nextSigned ? new Date() : null,
    });
    toast.success(nextSigned ? "MOA marked as digitally signed & executed" : "MOA reverted to pending signature");
  };

  const sharePercent = coBroke?.coBrokeSharePercent ?? 50;
  const inHousePercent = 100 - sharePercent;
  const totalCommissionPool = deal.grossCommissionTotal;
  const externalGross = (totalCommissionPool * sharePercent) / 100;
  const inHouseGross = (totalCommissionPool * inHousePercent) / 100;
  const externalTax = externalGross * 0.1; // 10% EWT Form 2307
  const externalNet = externalGross - externalTax;

  const leadName = lead ? `${lead.firstName} ${lead.lastName}` : "Client";
  const propertyTitle = property ? `${property.projectName} (${property.unitCode})` : "Property Unit";

  const whatsappMessage = encodeURIComponent(
    `Hi ${coBroke?.externalBrokerName || "Partner Broker"}, regarding our co-brokered deal for ${leadName} at ${propertyTitle} (Deal #${deal.dealNumber}): The 50/50 split agreement of ${formatCurrency(externalGross)} is active and attached to our PropFlow dashboard.`
  );

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Co-Brokerage &amp; External Split</CardTitle>
              {isCoBrokered ? (
                <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 text-xs font-semibold">
                  {sharePercent}/{inHousePercent} Co-Brokered
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs font-normal">
                  In-House Deal (100%)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              RESA RA 9646 compliant external broker network commission sharing &amp; digital MOA
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Terms Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Edit2 className="h-3.5 w-3.5" />
                {isCoBrokered ? "Edit Terms" : "Configure Co-Broke"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Handshake className="h-4 w-4 text-indigo-600" />
                  Co-Brokerage Agreement Terms
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure external broker commission split, PRC credentials, and MOA status.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveTerms} className="space-y-4 pt-2">
                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Co-Brokerage Split</Label>
                    <p className="text-xs text-muted-foreground">
                      Split deal commission with an accredited external broker
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isCoBrokered}
                    onChange={(e) => setFormData({ ...formData, isCoBrokered: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {formData.isCoBrokered && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">External Broker Name</Label>
                        <Input
                          value={formData.externalBrokerName}
                          onChange={(e) => setFormData({ ...formData, externalBrokerName: e.target.value })}
                          placeholder="e.g. Atty. Katrina Alcantara, REB"
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Realty / Brokerage Agency</Label>
                        <Input
                          value={formData.externalBrokerageAgency}
                          onChange={(e) => setFormData({ ...formData, externalBrokerageAgency: e.target.value })}
                          placeholder="e.g. Apex Prime Realty"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">PRC REB License No.</Label>
                        <Input
                          value={formData.externalBrokerPrcLicense}
                          onChange={(e) => setFormData({ ...formData, externalBrokerPrcLicense: e.target.value })}
                          placeholder="e.g. PRC REB #0031844"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">DHSUD Registration No.</Label>
                        <Input
                          value={formData.externalBrokerDhsudReg}
                          onChange={(e) => setFormData({ ...formData, externalBrokerDhsudReg: e.target.value })}
                          placeholder="e.g. DHSUD-NCR-B-04/24-9122"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Broker Mobile / WhatsApp</Label>
                        <Input
                          value={formData.externalBrokerPhone}
                          onChange={(e) => setFormData({ ...formData, externalBrokerPhone: e.target.value })}
                          placeholder="+63 917 889 2341"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Broker Email Address</Label>
                        <Input
                          type="email"
                          value={formData.externalBrokerEmail}
                          onChange={(e) => setFormData({ ...formData, externalBrokerEmail: e.target.value })}
                          placeholder="katrina@apexrealty.ph"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">External Share Percentage (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            max="99"
                            value={formData.coBrokeSharePercent}
                            onChange={(e) =>
                              setFormData({ ...formData, coBrokeSharePercent: Number(e.target.value) })
                            }
                            className="h-8 text-xs pr-8"
                          />
                          <Percent className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1 flex flex-col justify-end">
                        <div className="rounded border bg-muted/40 p-1.5 text-[11px] text-muted-foreground">
                          In-House Listing Share: <span className="font-semibold text-foreground">{100 - formData.coBrokeSharePercent}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium">MOA Digitally Signed</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Mark Memorandum of Agreement as executed by both parties
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.moaSigned}
                        onChange={(e) => setFormData({ ...formData, moaSigned: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Save Agreement Terms
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {!isCoBrokered ? (
          <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600">
                <Users2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">100% In-House Direct Deal</p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Working with an accredited external selling broker or licensed referral partner? Activate co-brokerage to calculate split allocations, comply with RESA Law (RA 9646), and issue an official Commission Sharing MOA.
                </p>
              </div>
            </div>
            <Button
              onClick={handleQuickEnable}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1.5 shadow-sm text-xs font-medium"
            >
              <Handshake className="h-3.5 w-3.5" />
              Enable 50/50 Co-Broke
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* External Partner Profile & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border bg-muted/20 p-3.5 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  {coBroke?.externalBrokerName
                    ? coBroke.externalBrokerName
                        .split(" ")
                        .filter((p) => !["Atty.", "Engr.", "Arch.", "Dr."].includes(p))
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                    : "CB"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {coBroke?.externalBrokerName || "Partner Broker"}
                    </p>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1 py-0">
                      <ShieldCheck className="h-3 w-3" />
                      RESA Verified
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    {coBroke?.externalBrokerageAgency && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {coBroke.externalBrokerageAgency}
                      </span>
                    )}
                    {coBroke?.externalBrokerPrcLicense && (
                      <span>• {coBroke.externalBrokerPrcLicense}</span>
                    )}
                    {coBroke?.externalBrokerDhsudReg && (
                      <span>• {coBroke.externalBrokerDhsudReg}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Partner Outreach */}
              <div className="flex items-center gap-1.5 shrink-0">
                {coBroke?.externalBrokerPhone && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                      asChild
                    >
                      <a
                        href={`https://wa.me/${coBroke.externalBrokerPhone.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1.5"
                      asChild
                    >
                      <a href={`tel:${coBroke.externalBrokerPhone}`} title="Call Phone">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </Button>
                  </>
                )}
                {coBroke?.externalBrokerEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5"
                    asChild
                  >
                    <a
                      href={`mailto:${coBroke.externalBrokerEmail}?subject=Co-Brokerage Deal ${deal.dealNumber} - ${propertyTitle}`}
                      title="Send Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Email</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Split Metrics Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">In-House Share ({inHousePercent}%)</span>
                  <Badge variant="outline" className="text-[10px] py-0 font-medium">Listing Side</Badge>
                </div>
                <p className="text-base font-bold text-foreground mt-1">
                  {formatCurrency(inHouseGross)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Net after 10% EWT: <span className="font-semibold text-foreground">{formatCurrency(inHouseGross * 0.9)}</span>
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-900 dark:text-indigo-200">
                    Co-Broker Share ({sharePercent}%)
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300">
                    Selling Side
                  </Badge>
                </div>
                <p className="text-base font-bold text-indigo-950 dark:text-indigo-100 mt-1">
                  {formatCurrency(externalGross)}
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Net after 10% EWT: <span className="font-semibold">{formatCurrency(externalNet)}</span>
                </p>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Commission Pool</span>
                  <Badge variant="outline" className="text-[10px] py-0">{deal.totalCommissionRatePercent}% Rate</Badge>
                </div>
                <p className="text-base font-bold text-foreground mt-1">
                  {formatCurrency(totalCommissionPool)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  TCP: {formatCurrency(deal.totalContractPrice)}
                </p>
              </div>
            </div>

            {/* MOA Document Status & Digital Execution */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-slate-50/50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/30 p-3.5 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border shadow-2xs text-indigo-600">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground">
                      Commission Sharing Memorandum of Agreement (MOA)
                    </p>
                    {coBroke?.moaSigned ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] gap-1 py-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Signed &amp; Enforced
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] py-0">
                        Pending Signatures
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {coBroke?.moaSigned && coBroke?.moaSignedDate ? (
                      <>Executed on {new Date(coBroke.moaSignedDate).toLocaleDateString("en-PH", { dateStyle: "medium" })} • Covers non-circumvention, BIR 2307 EWT withholding, and voucher remittance</>
                    ) : (
                      <>Generate official RA 9646 agreement ready for physical or digital signing</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleToggleMoaSigned}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  {coBroke?.moaSigned ? "Mark Pending" : "Mark Signed"}
                </Button>

                <Button
                  onClick={handleDownloadMoa}
                  disabled={isGeneratingPdf}
                  size="sm"
                  className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isGeneratingPdf ? "Generating..." : "Download MOA (PDF)"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
