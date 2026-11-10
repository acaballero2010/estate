"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Eye,
  MessageCircle,
  MessageSquare,
  Share2,
} from "lucide-react";
import {
  CURRENCY_CONFIGS,
  type FormatQuotationShareParams,
  generateWhatsAppViberQuotationText,
  type SupportedCurrency,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WhatsAppViberShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationData: Omit<FormatQuotationShareParams, "currency" | "customNote">;
  initialCurrency?: SupportedCurrency;
}

export function WhatsAppViberShareModal({
  open,
  onOpenChange,
  quotationData,
  initialCurrency = "PHP",
}: WhatsAppViberShareModalProps) {
  const [selectedCurrency, setSelectedCurrency] =
    React.useState<SupportedCurrency>(initialCurrency);
  const [customNote, setCustomNote] = React.useState("");
  const [recipientPhone, setRecipientPhone] = React.useState(
    quotationData.buyerPhone || ""
  );
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setSelectedCurrency(initialCurrency);
  }, [initialCurrency, open]);

  React.useEffect(() => {
    if (quotationData.buyerPhone) {
      setRecipientPhone(quotationData.buyerPhone);
    }
  }, [quotationData.buyerPhone, open]);

  const formattedMessage = React.useMemo(() => {
    return generateWhatsAppViberQuotationText({
      ...quotationData,
      currency: selectedCurrency,
      customNote,
    });
  }, [quotationData, selectedCurrency, customNote]);

  const cleanPhone = React.useMemo(() => {
    // Strip spaces, dashes, parentheses
    return recipientPhone.replace(/[^0-9+]/g, "");
  }, [recipientPhone]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    toast.success("WhatsApp / Viber card copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(formattedMessage);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.replace("+", "")}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    toast.info("Opening WhatsApp with pre-filled proposal card...");
  };

  const handleOpenViber = () => {
    const encoded = encodeURIComponent(formattedMessage);
    // Standard Viber forward protocol
    const viberUrl = `viber://forward?text=${encoded}`;
    window.location.href = viberUrl;
    toast.info("Launching Viber to dispatch quotation...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 border-b bg-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Share via WhatsApp / Viber
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Generate an emoji-rich, multi-currency deal card for fast buyer messaging.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="text-[11px] gap-1 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
            >
              <Share2 className="h-3 w-3" />
              OFW Ready
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Currency Switcher Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-primary" />
                Select Overseas Display Currency
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Converts figures side-by-side
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]).map((curr) => {
                const conf = CURRENCY_CONFIGS[curr];
                const isSelected = selectedCurrency === curr;
                return (
                  <Button
                    key={curr}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-7 px-2.5 text-xs gap-1 ${
                      isSelected
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                    onClick={() => setSelectedCurrency(curr)}
                  >
                    <span>{conf.flag}</span>
                    <span className="font-semibold">{conf.code}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Optional inputs: Recipient Phone & Custom Note */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="share-phone" className="text-xs font-semibold">
                Buyer Phone / WhatsApp
              </Label>
              <Input
                id="share-phone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+63 917 880 1122 or +971 50..."
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Include country code for direct 1-click WhatsApp opening.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="share-note" className="text-xs font-semibold">
                Custom Promo Note <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="share-note"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Promo valid until end of month!"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Live Mobile Chat Bubble Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              Live Message Preview
            </Label>
            <div className="rounded-xl border bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 p-3.5 font-sans text-xs leading-relaxed space-y-1 text-foreground whitespace-pre-line max-h-56 overflow-y-auto shadow-inner">
              {formattedMessage}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-pipeline-won" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy WhatsApp Card"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-violet-600 border-violet-500/30 hover:bg-violet-500/10 dark:text-violet-400"
                onClick={handleOpenViber}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Open Viber
              </Button>

              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                onClick={handleOpenWhatsApp}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Send in WhatsApp</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

