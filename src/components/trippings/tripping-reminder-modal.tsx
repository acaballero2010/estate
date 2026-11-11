"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BellRing,
  CalendarCheck,
  Check,
  Copy,
  MapPin,
  MessageSquare,
  Send,
  Smartphone,
} from "lucide-react";
import type { Lead, Property, TrippingScheduleItem } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { useAuth } from "@/lib/firebase/auth-context";
import { normalizePhoneForWhatsApp, normalizePhoneForTel } from "@/lib/utils";
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

export interface TrippingReminderModalProps {
  tripping: TrippingScheduleItem | null;
  lead: Lead | null;
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrippingReminderModal({
  tripping,
  lead,
  property,
  open,
  onOpenChange,
}: TrippingReminderModalProps) {
  const { sendMessage, messengerSettings } = useCrmStore();
  const { user, agentProfile } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const googleMapsUrl = React.useMemo(() => {
    if (!property) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${property.projectName} ${property.address || property.locationCity}`
    )}`;
  }, [property]);

  const wazeUrl = React.useMemo(() => {
    if (!property) return "";
    return `https://waze.com/ul?q=${encodeURIComponent(
      `${property.projectName} ${property.address || property.locationCity}`
    )}`;
  }, [property]);

  const defaultDraft = React.useMemo(() => {
    if (!tripping || !lead || !property) return "";

    const agentName = agentProfile?.fullName || "Marco Reyes, REB";
    const agentPhone = agentProfile?.phone || "+63 917 880 1122";

    return `Good day ${lead.firstName}! Confirming our VIP site viewing scheduled for tomorrow:

📍 Project: ${property.projectName} (${property.unitCode})
⏰ Date & Time: ${tripping.scheduledDate} at ${tripping.scheduledTime}
📌 Meeting Point: ${tripping.meetingPoint || "Main Project Showroom"}

🗺️ Live Navigation Directions:
• Google Maps: ${googleMapsUrl}
• Waze: ${wazeUrl}

⚠️ Visitor Reminder: Please bring at least 1 valid government-issued photo ID for the lobby security visitor pass.

Looking forward to showing you the property! Please feel free to reply directly or call me if you need directions.

Warm regards,
${agentName}
${agentProfile?.agencyName || "PropFlow Realty Group"}
Contact: ${agentPhone}`;
  }, [tripping, lead, property, agentProfile, googleMapsUrl, wazeUrl]);

  const [messageBody, setMessageBody] = React.useState(defaultDraft);

  React.useEffect(() => {
    setMessageBody(defaultDraft);
  }, [defaultDraft]);

  if (!tripping || !lead || !property) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopied(true);
      toast.success("Reminder text copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  const handleSendToCrm = async () => {
    if (!messageBody.trim()) return;
    setIsSending(true);

    try {
      // 1. Record message in CRM
      sendMessage(lead.id, messageBody);

      // 2. Dispatch to Meta Messenger if connected & buyer has PSID
      const isPageConnected = Boolean(
        messengerSettings?.isConnected && messengerSettings?.pageAccessToken
      );

      if (lead.messengerPsid && isPageConnected) {
        const idToken = user ? await user.getIdToken() : "";
        void fetch("/api/messenger/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            recipientPsid: lead.messengerPsid,
            text: messageBody,
            ...(messengerSettings?.pageAccessToken
              ? { pageAccessToken: messengerSettings.pageAccessToken }
              : {}),
          }),
        }).catch(() => {});
      }

      toast.success(
        `Dispatched 24h Site Viewing Reminder to ${lead.firstName} ${lead.lastName}!`
      );
      onOpenChange(false);
    } catch {
      toast.error("Failed to send reminder.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const phone = normalizePhoneForWhatsApp(lead.phone);
    if (!phone) {
      toast.error("Buyer does not have a valid phone number for WhatsApp.");
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageBody)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenViber = () => {
    const phone = normalizePhoneForTel(lead.phone);
    if (!phone) {
      toast.error("Buyer does not have a valid phone number for Viber.");
      return;
    }
    const url = `viber://chat?number=${encodeURIComponent(phone)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 gap-1 text-[11px]">
              <BellRing className="h-3 w-3" />
              24-Hour Automated Tripping Reminder
            </Badge>
          </div>
          <DialogTitle className="text-lg font-serif">
            Send Site Viewing Reminder to {lead.firstName} {lead.lastName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Confirm gate pass details, arrival time, and live Google Maps/Waze navigation directions before tomorrow&apos;s visit.
          </DialogDescription>
        </DialogHeader>

        {/* Visit Details Pill Banner */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-primary" />
              {property.projectName} ({property.unitCode})
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {tripping.scheduledDate} @ {tripping.scheduledTime}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{tripping.meetingPoint || property.address}</span>
          </div>
        </div>

        {/* Message Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-foreground">
              Personalized Reminder Draft
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Text
                </>
              )}
            </Button>
          </div>
          <textarea
            value={messageBody}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setMessageBody(e.target.value)
            }
            rows={10}
            className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWhatsApp}
              className="h-8 text-xs gap-1.5 flex-1 sm:flex-none border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <Smartphone className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenViber}
              className="h-8 text-xs gap-1.5 flex-1 sm:flex-none border-purple-500/30 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Viber
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSendToCrm}
              disabled={isSending || !messageBody.trim()}
              className="h-8 text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? "Sending..." : "Dispatch to Lead Inbox"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
