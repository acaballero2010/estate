"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Smartphone,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Signal,
} from "lucide-react";
import type { Lead, Property } from "@/lib/schemas";
import {
  PH_REAL_ESTATE_SMS_TEMPLATES,
  compileSmsTemplate,
  calculateSmsSegments,
  normalizePhilippineMobile,
  sendDirectSms,
} from "@/lib/semaphore-sms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency } from "@/lib/utils";

interface SmsBroadcastModalProps {
  lead: Lead | null;
  property?: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName?: string;
  agentPhone?: string;
}

export function SmsBroadcastModal({
  lead,
  property,
  open,
  onOpenChange,
  agentName = "Marco Reyes, REB",
  agentPhone = "+63 917 555 4321",
}: SmsBroadcastModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>(
    "TRIPPING_CONFIRMATION"
  );
  const [message, setMessage] = React.useState<string>("");
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = React.useState<boolean>(false);

  const phoneInfo = React.useMemo(() => {
    return normalizePhilippineMobile(lead?.phone || "");
  }, [lead?.phone]);

  // Compile template whenever lead, property, or selected template changes
  React.useEffect(() => {
    if (!lead) return;

    const matchedTemplate = PH_REAL_ESTATE_SMS_TEMPLATES.find(
      (t) => t.id === selectedTemplateId
    );

    if (matchedTemplate) {
      const compiled = compileSmsTemplate(matchedTemplate.template, {
        firstName: lead.firstName,
        agentName,
        agentPhone,
        projectName: property?.projectName || "The Meridian Park",
        unitCode: property?.unitCode || "2BR Executive",
        propertyType: property?.propertyType || "CONDOMINIUM",
        locationCity: property?.locationCity || "BGC, Taguig",
        budgetMax: formatCompactCurrency(lead.budgetMax),
        date: "Tomorrow at 2:00 PM",
        time: "2:00 PM",
        tranche: "1",
        amount: "PHP 45,000",
        dealNumber: "DL-2026-0104",
        link: typeof window !== "undefined" ? `${window.location.origin}/showcase?view=client` : "https://propflow.ph/showcase",
      });
      setMessage(compiled);
    } else if (selectedTemplateId === "CUSTOM") {
      setMessage(`Hi ${lead.firstName}, `);
    }
  }, [selectedTemplateId, lead, property, agentName, agentPhone]);

  const { charCount, segments, remainingInSegment } = React.useMemo(() => {
    return calculateSmsSegments(message);
  }, [message]);

  const handleSend = async () => {
    if (!lead || !phoneInfo.isValid) {
      toast.error("Valid Philippine mobile number is required");
      return;
    }

    if (!message.trim()) {
      toast.error("Message content cannot be empty");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendDirectSms({
        to: phoneInfo.normalized,
        message,
        sendername: "PropFlow",
      });

      setSendSuccess(true);
      toast.success(
        res.status === "SIMULATED"
          ? `[Simulator] SMS sent to ${phoneInfo.normalized} (${phoneInfo.carrier})`
          : `SMS broadcast sent successfully via ${res.network || "Semaphore"}!`
      );

      setTimeout(() => {
        setSendSuccess(false);
        onOpenChange(false);
      }, 1200);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to dispatch SMS";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Direct Philippine SMS (Semaphore Gateway)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Direct telco routing to Globe, Smart, DITO, TNT &amp; TM with 98% open rates
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Recipient Details & Telco Carrier Pill */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">
                {lead.firstName} {lead.lastName}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {phoneInfo.normalized || lead.phone || "No phone number registered"}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {phoneInfo.isValid ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1"
                >
                  <Signal className="h-3 w-3" />
                  {phoneInfo.carrier} Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 text-[10px] gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  Invalid 09xx Number
                </Badge>
              )}
            </div>
          </div>

          {/* Template Quick Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>Choose High-Converting Real Estate Template</span>
              <span className="text-[10px] text-muted-foreground">RESA &amp; DNC Compliant</span>
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {PH_REAL_ESTATE_SMS_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`flex flex-col text-left rounded-md border p-2 text-xs transition-colors cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-medium text-foreground ring-1 ring-emerald-500"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-foreground text-[11px] truncate">
                    {tmpl.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {tmpl.description}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTemplateId("CUSTOM")}
                className={`flex flex-col text-left rounded-md border p-2 text-xs transition-colors cursor-pointer ${
                  selectedTemplateId === "CUSTOM"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-medium text-foreground ring-1 ring-emerald-500"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <span className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Custom SMS Draft
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Write freeform SMS message
                </span>
              </button>
            </div>
          </div>

          {/* Message Textarea & Character Meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Message Body</Label>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="font-mono font-semibold text-foreground">
                  {charCount}
                </span>
                / 160 chars
                <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                  {segments} {segments === 1 ? "credit" : "credits"} ({remainingInSegment} left)
                </Badge>
              </div>
            </div>

            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message..."
              className="text-xs resize-none font-sans"
            />
          </div>

          {/* Telco Delivery SLA Note */}
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
            <Signal className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Semaphore Direct Route: </span>
              High-priority transactional pipeline. Delivered via Philippine domestic telco SS7 switches within 3 seconds.
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          {phoneInfo.isValid && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
              asChild
            >
              <a href={`sms:${phoneInfo.normalized}?body=${encodeURIComponent(message)}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open Phone App
              </a>
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={isSending || sendSuccess || !phoneInfo.isValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-sm font-medium"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending via Semaphore...
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Dispatched!
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Instant SMS
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

