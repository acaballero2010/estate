"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BellRing,
  Building2,
  Check,
  Copy,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import {
  PIPELINE_STAGE_LABELS,
  type Property,
} from "@/lib/schemas";
import {
  buildPropertyAlertMessage,
  findMatchingLeadsForProperty,
} from "@/lib/lead-scoring";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import { cn, formatCompactCurrency, formatCurrency } from "@/lib/utils";
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

export interface PropertyMatchAlertModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyMatchAlertModal({
  property,
  open,
  onOpenChange,
}: PropertyMatchAlertModalProps) {
  const { user } = useAuth();
  const { leads, sendMessage, messengerSettings } = useCrmStore();
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<string[]>([]);
  const [customNote, setCustomNote] = React.useState("");
  const [copiedLeadId, setCopiedLeadId] = React.useState<string | null>(null);
  const [isDispatching, setIsDispatching] = React.useState(false);

  const matches = React.useMemo(() => {
    if (!property) return [];
    return findMatchingLeadsForProperty(property, leads);
  }, [property, leads]);

  React.useEffect(() => {
    if (open && matches.length > 0) {
      setSelectedLeadIds(matches.map((m) => m.lead.id));
    } else if (!open) {
      setCustomNote("");
      setCopiedLeadId(null);
    }
  }, [open, matches]);

  if (!property) return null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://propflow.ph";

  const buildLeadPortalUrl = (leadId: string) =>
    `${origin}/quote/${leadId.slice(0, 8)}?leadId=${leadId}&unit=${encodeURIComponent(
      property.unitCode
    )}`;

  const toggleLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleCopyForLead = (leadId: string) => {
    const match = matches.find((m) => m.lead.id === leadId);
    if (!match) return;
    const msg = buildPropertyAlertMessage(
      property,
      match.lead,
      buildLeadPortalUrl(leadId),
      customNote
    );
    navigator.clipboard.writeText(msg);
    setCopiedLeadId(leadId);
    toast.success(`Copied personalized alert for ${match.lead.firstName}`);
    setTimeout(() => setCopiedLeadId(null), 2000);
  };

  const handleDispatchSelected = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error("Select at least one matching buyer to alert.");
      return;
    }

    setIsDispatching(true);
    try {
      const isPageConnected = Boolean(
        messengerSettings?.isConnected && messengerSettings?.pageAccessToken
      );

      for (const leadId of selectedLeadIds) {
        const match = matches.find((m) => m.lead.id === leadId);
        if (!match) continue;
        const text = buildPropertyAlertMessage(
          property,
          match.lead,
          buildLeadPortalUrl(leadId),
          customNote
        );

        sendMessage(leadId, text);

        if (match.lead.messengerPsid && isPageConnected) {
          const idToken = user ? await user.getIdToken() : "";
          void fetch("/api/messenger/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              recipientPsid: match.lead.messengerPsid,
              text,
              ...(messengerSettings?.pageAccessToken ? { pageAccessToken: messengerSettings.pageAccessToken } : {}),
            }),
          }).catch(() => {});
        }
      }

      toast.success(
        `Dispatched Smart Property Alert for ${property.unitCode} to ${selectedLeadIds.length} matching buyer${
          selectedLeadIds.length > 1 ? "s" : ""
        }!`
      );
      onOpenChange(false);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b bg-card shrink-0 pr-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Smart Property Match Alert
              </DialogTitle>
              <DialogDescription className="text-xs">
                Notify active buyers whose budget, preferred city, and unit type match this listing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Property Summary Card */}
          <div className="rounded-xl border bg-muted/30 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold truncate">
                  {property.projectName} — {property.unitCode}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {property.locationCity} • {property.bedrooms}BR • {property.floorAreaSqm} sqm
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-muted-foreground block">List Price</span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {formatCurrency(property.listPrice, "PHP", 0)}
              </span>
            </div>
          </div>

          {/* Optional Promo Note */}
          <div className="space-y-1.5">
            <Label htmlFor="match-custom-note" className="text-xs font-semibold">
              Optional Agent Promo Note
            </Label>
            <Input
              id="match-custom-note"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Freshly released unit with 3% spot promo this week!"
              className="h-8 text-xs"
            />
          </div>

          {/* Matched Buyers List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Matching Pipeline Buyers ({matches.length})
              </span>
              {matches.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedLeadIds(
                      selectedLeadIds.length === matches.length
                        ? []
                        : matches.map((m) => m.lead.id)
                    )
                  }
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {selectedLeadIds.length === matches.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No active pipeline leads currently fall within this property&apos;s budget and location window.
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(({ lead, matchScore, matchReasons }) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  return (
                    <div
                      key={lead.id}
                      className={cn(
                        "rounded-xl border p-3 transition-colors space-y-2",
                        isChecked
                          ? "border-primary/40 bg-primary/5"
                          : "bg-card opacity-75"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLead(lead.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold">
                                {lead.firstName} {lead.lastName}
                              </span>
                              <Badge variant="won" className="h-4 px-1.5 text-[9px]">
                                {matchScore}% Match
                              </Badge>
                              <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                                {PIPELINE_STAGE_LABELS[lead.stage]}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              Budget: {formatCompactCurrency(lead.budgetMin)} –{" "}
                              {formatCompactCurrency(lead.budgetMax)} •{" "}
                              {lead.preferredLocations.join(", ")}
                            </p>
                          </div>
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] gap-1 shrink-0"
                          onClick={() => handleCopyForLead(lead.id)}
                          title="Copy personalized alert for WhatsApp / Viber"
                        >
                          {copiedLeadId === lead.id ? (
                            <Check className="h-3 w-3 text-pipeline-won" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy</span>
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1 pl-6">
                        {matchReasons.map((reason) => (
                          <Badge
                            key={reason}
                            variant="secondary"
                            className="h-4 px-1.5 text-[9px] font-normal"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3.5 border-t bg-muted/20 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs gap-1.5"
            disabled={selectedLeadIds.length === 0 || isDispatching}
            onClick={handleDispatchSelected}
          >
            <Send className="h-3.5 w-3.5" />
            Send Alert to {selectedLeadIds.length} Buyer
            {selectedLeadIds.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

