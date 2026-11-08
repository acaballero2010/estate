"use client";

import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Share2,
  Sparkles,
  Check,
  Building2,
} from "lucide-react";
import { type Property } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SocialShareCardModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialShareCardModal({
  property,
  isOpen,
  onClose,
}: SocialShareCardModalProps) {
  const { agentProfile, user } = useAuth();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasCopiedCaption, setHasCopiedCaption] = React.useState(false);

  const agentName =
    agentProfile?.fullName || user?.displayName || "Licensed Real Estate Specialist";
  const agentLicense = agentProfile?.prcLicenseNumber || "PRC RESA Accredited";
  const agentPhone = agentProfile?.phone || "+63 917 000 0000";
  const agencyName = agentProfile?.agencyName || "PropFlow Realty Group";

  const inquiryUrl = React.useMemo(() => {
    if (!property) return "https://propflow.app/inquire";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/inquire?unitCode=${encodeURIComponent(property.unitCode)}`;
    }
    return `https://propflow.app/inquire?unitCode=${encodeURIComponent(property.unitCode)}`;
  }, [property]);

  // Generate QR Code data URL
  React.useEffect(() => {
    if (!isOpen || !property) return;
    let isSubscribed = true;

    QRCode.toDataURL(inquiryUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isSubscribed) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR Code:", err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, property, inquiryUrl]);

  // Render 1080x1080 Canvas Card
  React.useEffect(() => {
    if (!isOpen || !property || !qrDataUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsGenerating(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src =
      property.thumbnailUrl ||
      property.galleryImages[0] ||
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

    const qrImg = new Image();
    qrImg.src = qrDataUrl;

    let imagesLoaded = 0;
    const checkReadyAndDraw = () => {
      imagesLoaded++;
      if (imagesLoaded < 2) return;

      // Canvas dimensions: 1080x1080 (Instagram / FB 1:1 format)
      canvas.width = 1080;
      canvas.height = 1080;

      // 1. Background Gradient (Dark Navy / Slate "Quiet Luxury")
      const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      bgGradient.addColorStop(0, "#090d16");
      bgGradient.addColorStop(0.5, "#0f172a");
      bgGradient.addColorStop(1, "#020617");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Subtle gold ambient glow
      const glow = ctx.createRadialGradient(540, 200, 50, 540, 200, 600);
      glow.addColorStop(0, "rgba(59, 130, 246, 0.12)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 800);

      // 2. Top Header / Brand Tag
      ctx.fillStyle = "#93c5fd";
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText(
        `${property.developerName.toUpperCase()} • EXCLUSIVE LISTING`,
        60,
        75
      );

      // Project Title & Unit
      ctx.fillStyle = "#ffffff";
      ctx.font = "normal 52px 'Instrument Serif', Georgia, serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(property.projectName, 60, 138);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${property.unitCode} • ${property.locationCity}`, 60, 178);

      // 3. Main Property Image (Centered 960 x 510 with rounded corners)
      const imgX = 60;
      const imgY = 210;
      const imgW = 960;
      const imgH = 500;
      const radius = 24;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(imgX + radius, imgY);
      ctx.lineTo(imgX + imgW - radius, imgY);
      ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + radius);
      ctx.lineTo(imgX + imgW, imgY + imgH - radius);
      ctx.quadraticCurveTo(
        imgX + imgW,
        imgY + imgH,
        imgX + imgW - radius,
        imgY + imgH
      );
      ctx.lineTo(imgX + radius, imgY + imgH);
      ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - radius);
      ctx.lineTo(imgX, imgY + radius);
      ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
      ctx.closePath();
      ctx.clip();

      // Cover scaling for property photo
      const imgRatio = img.width / img.height;
      const targetRatio = imgW / imgH;
      let renderW = imgW;
      let renderH = imgH;
      let renderX = imgX;
      let renderY = imgY;

      if (imgRatio > targetRatio) {
        renderW = imgH * imgRatio;
        renderX = imgX - (renderW - imgW) / 2;
      } else {
        renderH = imgW / imgRatio;
        renderY = imgY - (renderH - imgH) / 2;
      }
      ctx.drawImage(img, renderX, renderY, renderW, renderH);

      // Subtle shadow overlay at bottom of photo
      const overlayGrad = ctx.createLinearGradient(
        imgX,
        imgY + 300,
        imgX,
        imgY + imgH
      );
      overlayGrad.addColorStop(0, "rgba(0,0,0,0)");
      overlayGrad.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(imgX, imgY + 300, imgW, 200);

      // On-Image Badges
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(imgX + 24, imgY + imgH - 64, 380, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        `${property.bedrooms} BR • ${property.floorAreaSqm} SQM • ${property.turnoverDate || "Prime Turnkey"}`,
        imgX + 40,
        imgY + imgH - 36
      );

      ctx.restore();

      // Border outline for photo
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Financial Highlights Box (Bottom Left: 680 x 200)
      ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
      ctx.beginPath();
      ctx.roundRect(60, 735, 680, 195, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText("TOTAL CONTRACT PRICE (TCP)", 90, 780);

      ctx.fillStyle = "#60a5fa";
      ctx.font = "normal 56px 'Instrument Serif', Georgia, serif";
      ctx.fillText(formatCurrency(property.listPrice, "PHP", 0), 90, 842);

      const estMonthly = (property.listPrice * 0.2) / 24;
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 22px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        `Starts at ${formatCurrency(estMonthly * 0.77, "PHP", 0)}/mo with Step-Up Equity`,
        90,
        895
      );

      // 5. QR Code Card (Bottom Right: 250 x 195)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(770, 735, 250, 195, 20);
      ctx.fill();

      // Draw QR Image
      ctx.drawImage(qrImg, 810, 748, 170, 145);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN FOR COMPUTATION", 895, 912);
      ctx.textAlign = "left";

      // 6. Bottom Broker Accreditation Strip (Y: 960 to 1040)
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(60, 955, 960, 1);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.fillText(agentName, 60, 995);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        `${agentLicense} • ${agencyName} • Viber/WhatsApp: ${agentPhone}`,
        60,
        1025
      );

      setIsGenerating(false);
    };

    img.onload = checkReadyAndDraw;
    qrImg.onload = checkReadyAndDraw;

    if (img.complete) imagesLoaded++;
    if (qrImg.complete) imagesLoaded++;
    if (imagesLoaded >= 2) checkReadyAndDraw();
  }, [isOpen, property, qrDataUrl, agentName, agentLicense, agentPhone, agencyName]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !property) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `PropFlow-${property.projectName.replace(/\s+/g, "_")}-${property.unitCode.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloaded 1080×1080 Social Media Card (PNG)!");
    } catch {
      toast.error("Failed to export image canvas.");
    }
  };

  const handleCopyCaption = () => {
    if (!property) return;
    const estMonthly = (property.listPrice * 0.2) / 24;

    const caption = `🏙️ EXCLUSIVE PROPERTY LISTING: ${property.projectName}
📍 Location: ${property.locationCity}
🏷️ Unit: ${property.unitCode} (${property.bedrooms} BR • ${property.floorAreaSqm} sqm)

✨ Highlights:
• Total Contract Price: ${formatCurrency(property.listPrice, "PHP", 0)}
• Step-Up Down Payment Scheme: Starts at ${formatCurrency(estMonthly * 0.77, "PHP", 0)}/mo
• Turnover: ${property.turnoverDate || "Prime Turnkey"}
• Accredited Developer: ${property.developerName}

📲 View live amortization schedule, floor plans, and reserve directly:
${inquiryUrl}

Direct inquiries & site viewing bookings:
👤 ${agentName} (${agentLicense})
🏢 ${agencyName}
📞 Viber / WhatsApp: ${agentPhone}

#AyalaLand #LuxuryRealEstatePH #BGCRealEstate #Nuvali #OFWInvestment #InvestInPhilippines #PhilippineProperties #PropFlow`;

    navigator.clipboard.writeText(caption);
    setHasCopiedCaption(true);
    toast.success("Marketing caption & hashtags copied to clipboard!");
    setTimeout(() => setHasCopiedCaption(false), 3000);
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-serif font-normal">
            <Share2 className="h-4 w-4 text-primary" />
            Social Media Marketing Card Generator (1080×1080)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate branded, high-resolution square cards for Instagram, Facebook, LinkedIn, and WhatsApp status with your agent accreditation and live inquiry QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Live Canvas Preview */}
          <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-xl border bg-slate-950 p-2 shadow-inner">
            <canvas
              ref={canvasRef}
              className="h-auto w-full max-w-[420px] rounded-lg shadow-2xl"
              style={{ aspectRatio: "1 / 1" }}
            />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Rendering 1080×1080 High-Res Card...
                </span>
              </div>
            )}
          </div>

          {/* Social Caption Preview Box */}
          <div className="rounded-xl border bg-muted/20 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Auto-Generated Promotional Caption
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary"
                onClick={handleCopyCaption}
              >
                {hasCopiedCaption ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Caption
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-3">
              🏙️ EXCLUSIVE PROPERTY LISTING: {property.projectName} • {property.unitCode} ({property.bedrooms} BR, {property.floorAreaSqm} sqm) • TCP: {formatCurrency(property.listPrice, "PHP", 0)} • Starts at {formatCurrency(((property.listPrice * 0.2) / 24) * 0.77, "PHP", 0)}/mo with Step-Up Equity...
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleCopyCaption}
          >
            {hasCopiedCaption ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy Post Caption &amp; Hashtags
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 shadow-md"
              onClick={handleDownloadImage}
              disabled={isGenerating}
            >
              <Download className="h-3.5 w-3.5" />
              Download 1080×1080 PNG
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
