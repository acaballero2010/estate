"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import type { Lead } from "@/lib/schemas";
import {
  PREBUILT_DRIP_CAMPAIGNS,
  compileDripMessage,
  type DripStep,
} from "@/lib/drip-campaigns";
import { useCrmStore } from "@/lib/store/crm-store";
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

interface SmartDripCampaignModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SmartDripCampaignModal({
  lead,
  isOpen,
  onClose,
}: SmartDripCampaignModalProps) {
  const { properties, updateLeadTags, addLeadNote } = useCrmStore();
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>(
    PREBUILT_DRIP_CAMPAIGNS[0]!.id
  );
  const [copiedStepId, setCopiedStepId] = React.useState<string | null>(null);
  const [sentStepIds, setSentStepIds] = React.useState<Set<string>>(new Set());

  const campaign = React.useMemo(() => {
    return (
      PREBUILT_DRIP_CAMPAIGNS.find((c) => c.id === selectedCampaignId) ||
      PREBUILT_DRIP_CAMPAIGNS[0]!
    );
  }, [selectedCampaignId]);

  const matchedProperty = React.useMemo(() => {
    if (!lead) return properties[0];
    return (
      properties.find((p) =>
        lead.preferredLocations.some((loc) =>
          p.locationCity.toLowerCase().includes(loc.toLowerCase())
        )
      ) || properties[0]
    );
  }, [lead, properties]);

  if (!lead) return null;

  const handleCopyMessage = (step: DripStep) => {
    const text = compileDripMessage(step.messageTemplate, lead, matchedProperty);
    void navigator.clipboard.writeText(text);
    setCopiedStepId(step.id);
    toast.success(`Copied "${step.title}" message template to clipboard!`);
    setTimeout(() => setCopiedStepId(null), 2500);
  };

  const handleSendViaWhatsApp = (step: DripStep) => {
    const text = compileDripMessage(step.messageTemplate, lead, matchedProperty);
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");

    setSentStepIds((prev) => new Set([...prev, step.id]));
    addLeadNote(
      lead.id,
      `[Smart Drip Dispatched]: Sent "${step.title}" via WhatsApp.`
    );
    toast.success(`Dispatched Drip Step to ${lead.firstName} via WhatsApp!`);
  };

  const handleEnrollLead = () => {
    const dripTag = `DRIP:${campaign.code}`;
    const nextTags = Array.from(new Set([...lead.tags, dripTag]));
    updateLeadTags(lead.id, nextTags);
    addLeadNote(
      lead.id,
      `[Drip Plan Activated]: Enrolled in "${campaign.title}" (${campaign.steps.length} sequential steps).`
    );
    toast.success(`Lead successfully enrolled in ${campaign.title}!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-2">
            <Badge variant="won" className="text-[10px] gap-1 px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              Automated Follow-Up Sequences
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              Action Plans
            </Badge>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-serif mt-1">
            Smart Drip Campaign for {lead.firstName} {lead.lastName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Nurture buyers through automated multi-day sequences tailored for Philippine real estate, overseas OFW investors, and post-tripping decisions.
          </DialogDescription>
        </DialogHeader>

        {/* Campaign Plan Selector */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Select Action Plan Template:</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Based on top US &amp; Global brokerage workflows
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PREBUILT_DRIP_CAMPAIGNS.map((c) => {
              const isSelected = c.id === selectedCampaignId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border/70 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono mb-1.5 px-1.5 py-0"
                    >
                      {c.steps.length} Steps
                    </Badge>
                    <h4 className="font-semibold text-foreground text-xs leading-tight">
                      {c.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2 line-clamp-2">
                    {c.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Message Pipeline */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Campaign Schedule &amp; Live Message Previews
            </span>
            <span className="text-[11px] text-muted-foreground">
              Personalized with {lead.firstName}&apos;s budget &amp; property
            </span>
          </div>

          <div className="space-y-3">
            {campaign.steps.map((step, idx) => {
              const compiledText = compileDripMessage(
                step.messageTemplate,
                lead,
                matchedProperty
              );
              const isCopied = copiedStepId === step.id;
              const isSent = sentStepIds.has(step.id);

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                    isSent
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/80 bg-card/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground text-xs">
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Day +{step.dayOffset}
                      </Badge>
                      <Badge
                        variant={step.channel === "WHATSAPP" ? "won" : "default"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {step.channel}
                      </Badge>
                      {isSent && (
                        <Badge variant="won" className="text-[9px] px-1.5 py-0 gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Sent
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="rounded-lg border bg-background/80 p-2.5 text-xs text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap">
                    {compiledText}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleCopyMessage(step)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      onClick={() => handleSendViaWhatsApp(step)}
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Send via WhatsApp</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground text-left">
            Active Drip tag <code className="text-foreground font-mono">DRIP:{campaign.code}</code> will be added to the lead profile.
          </p>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleEnrollLead}>
              <Play className="h-3.5 w-3.5" />
              <span>Enroll in Plan</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
