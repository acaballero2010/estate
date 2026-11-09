"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSignature,
  Lock,
  UserCheck,
} from "lucide-react";
import type { Lead, Property } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
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

interface ConvertLeadToDealModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ConvertLeadToDealModal({
  lead,
  isOpen,
  onClose,
}: ConvertLeadToDealModalProps) {
  const router = useRouter();
  const { properties, quotations, createDealFromReservation, moveLeadStage } = useCrmStore();

  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>("");
  const [tcpAmount, setTcpAmount] = React.useState<number>(0);
  const [reservationFee, setReservationFee] = React.useState<number>(50000);
  const [financingType, setFinancingType] = React.useState<
    "BANK_FINANCING" | "SPOT_DEFERRED_CASH" | "PAG_IBIG_HDMF" | "IN_HOUSE_FINANCING"
  >("BANK_FINANCING");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "BANK_TRANSFER" | "GCASH_MAYA" | "CHECK_PDC" | "CREDIT_CARD"
  >("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = React.useState<string>(() => `REF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // When modal opens or lead changes, select matching property or quotation
  React.useEffect(() => {
    if (lead && isOpen) {
      // Check if lead has an accepted or existing quotation
      const leadQuotes = quotations.filter((q) => q.leadId === lead.id);
      const latestQuote = leadQuotes[0];

      let targetProp: Property | undefined;
      if (latestQuote) {
        targetProp = properties.find((p) => p.id === latestQuote.propertyId);
      }
      if (!targetProp && properties.length > 0) {
        targetProp = properties[0];
      }

      if (targetProp) {
        setSelectedPropertyId(targetProp.id);
        setTcpAmount(targetProp.listPrice);
        setReservationFee(targetProp.reservationFee || 50000);
      }
      setReferenceNo(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [lead, isOpen, properties, quotations]);

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setTcpAmount(prop.listPrice);
      setReservationFee(prop.reservationFee || 50000);
    }
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !selectedPropertyId) {
      toast.error("Please select a target property unit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const matchingQuote = quotations.find(
        (q) => q.leadId === lead.id && q.propertyId === selectedPropertyId
      );

      const netCommissionable = Math.round(tcpAmount * 0.95);

      const deal = createDealFromReservation({
        leadId: lead.id,
        propertyId: selectedPropertyId,
        quotationId: matchingQuote?.id,
        totalContractPrice: tcpAmount,
        netCommissionablePrice: netCommissionable,
        financingType,
        reservationFee,
        paymentMethod,
        referenceNo,
        receiptImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      });

      moveLeadStage(lead.id, "RESERVATION");

      toast.success(
        `Created Deal Room ${deal.dealNumber} for ${lead.firstName} ${lead.lastName}! Unit officially reserved.`,
        {
          action: {
            label: "Open Deal Room",
            onClick: () => router.push("/deals"),
          },
        }
      );

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert lead to deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Convert Lead to Official Deal Room
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Formalize unit reservation, log reservation payment, and initialize closing milestones for {lead.firstName} {lead.lastName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConvertSubmit} className="space-y-4 px-6 py-4">
          {/* Buyer Summary */}
          <div className="rounded-lg border bg-muted/30 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <span className="font-semibold block text-foreground">
                  {lead.firstName} {lead.lastName}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {lead.phone} • {lead.email || "No email"}
                </span>
              </div>
            </div>
            <Badge variant="reservation" className="text-[10px]">
              Moving to Reservation
            </Badge>
          </div>

          {/* Unit Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reserved Property / Unit *</Label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} — {p.unitCode} ({formatCurrency(p.listPrice, "PHP", 0)})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing & Reservation Fee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Contract Price (₱) *</Label>
              <Input
                type="number"
                step="50000"
                value={tcpAmount}
                onChange={(e) => setTcpAmount(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-semibold"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reservation Fee (₱) *</Label>
              <Input
                type="number"
                step="5000"
                value={reservationFee}
                onChange={(e) => setReservationFee(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs font-mono font-semibold"
                required
              />
            </div>
          </div>

          {/* Financing Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Financing Scheme</Label>
              <select
                value={financingType}
                onChange={(e) =>
                  setFinancingType(
                    e.target.value as
                      | "BANK_FINANCING"
                      | "SPOT_DEFERRED_CASH"
                      | "PAG_IBIG_HDMF"
                      | "IN_HOUSE_FINANCING"
                  )
                }
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="BANK_FINANCING">Bank Financing</option>
                <option value="SPOT_DEFERRED_CASH">Spot Cash / Deferred</option>
                <option value="PAG_IBIG_HDMF">Pag-IBIG Fund (HDMF)</option>
                <option value="IN_HOUSE_FINANCING">In-House Financing</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payment Channel</Label>
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
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="BANK_TRANSFER">Bank Wire / Online Transfer</option>
                <option value="GCASH_MAYA">GCash / Maya E-Wallet</option>
                <option value="CHECK_PDC">Manager&apos;s Check / PDC</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Proof / Reference Number */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Deposit Reference / Slip Code</Label>
            <Input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. BPI-REF-992810"
              className="h-8 text-xs font-mono"
              required
            />
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            💡 Initializing this Deal Room will lock the unit, generate an official Reservation Agreement (RAF), and start the developer CTS &amp; loan requirement checklist in <strong>Deals &amp; Closing</strong>.
          </p>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isSubmitting}
            >
              <Lock className="h-3.5 w-3.5" />
              {isSubmitting ? "Opening Deal Room..." : "Lock Unit & Initialize Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

