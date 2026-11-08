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
  RefreshCw,
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

/**
 * Universally safe rounded-rectangle path builder that never throws
 * across all browser rendering engines and WebViews.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Loads an image safely with CORS. If CORS fails or image is broken,
 * resolves to null rather than hanging or tainting the canvas.
 */
function loadSafeCorsImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Loads a base64 QR data URL safely.
 */
function loadBase64Image(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function SocialShareCardModal({
  property,
  isOpen,
  onClose,
}: SocialShareCardModalProps) {
  const { agentProfile, user } = useAuth();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasCopiedCaption, setHasCopiedCaption] = React.useState(false);
  const [renderCount, setRenderCount] = React.useState(0);

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

  // Main Canvas Rendering Effect
  React.useEffect(() => {
    if (!isOpen || !property) return;
    const currentProp = property;
    let isCancelled = false;

    async function renderCard() {
      setIsGenerating(true);

      try {
        // 1. Generate QR Code Data URL
        let qrDataUrl = "";
        try {
          qrDataUrl = await QRCode.toDataURL(inquiryUrl, {
            width: 260,
            margin: 1,
            color: {
              dark: "#0a0f1d",
              light: "#ffffff",
            },
          });
        } catch (e) {
          console.warn("QR code generation fallback:", e);
        }

        // 2. Load images in parallel (with safe CORS)
        const imgSrc =
          currentProp.thumbnailUrl ||
          currentProp.galleryImages?.[0] ||
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

        const [propImg, qrImg] = await Promise.all([
          loadSafeCorsImage(imgSrc),
          qrDataUrl ? loadBase64Image(qrDataUrl) : Promise.resolve(null),
        ]);

        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set high-res dimensions (1080 x 1080 Instagram/Facebook 1:1)
        canvas.width = 1080;
        canvas.height = 1080;

        // 1. Background Gradient (Dark Navy / Slate "Quiet Luxury")
        const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
        bgGradient.addColorStop(0, "#080c14");
        bgGradient.addColorStop(0.5, "#0d1527");
        bgGradient.addColorStop(1, "#03060f");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Subtle ambient radial glow
        const glow = ctx.createRadialGradient(540, 220, 40, 540, 220, 600);
        glow.addColorStop(0, "rgba(59, 130, 246, 0.15)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1080, 800);

        // 2. Top Header / Brand Tag
        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
        ctx.fillText(
          `${(currentProp.developerName || "EXCLUSIVE PARTNER").toUpperCase()} • EXCLUSIVE LISTING`,
          60,
          72
        );

        // Project Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "normal 52px 'Instrument Serif', Georgia, serif";
        ctx.fillText(currentProp.projectName, 60, 136);

        // Unit Code & Location
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 24px system-ui, -apple-system, sans-serif";
        ctx.fillText(`${currentProp.unitCode} • ${currentProp.locationCity}`, 60, 176);

        // 3. Main Property Image (Centered 960 x 500)
        const imgX = 60;
        const imgY = 210;
        const imgW = 960;
        const imgH = 500;
        const radius = 24;

        ctx.save();
        drawRoundedRect(ctx, imgX, imgY, imgW, imgH, radius);
        ctx.clip();

        if (propImg && propImg.width > 0 && propImg.height > 0) {
          // Draw property photograph with cover-crop scaling
          const imgRatio = propImg.width / propImg.height;
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
          ctx.drawImage(propImg, renderX, renderY, renderW, renderH);

          // Dark gradient overlay at bottom of photo
          const overlayGrad = ctx.createLinearGradient(
            imgX,
            imgY + 280,
            imgX,
            imgY + imgH
          );
          overlayGrad.addColorStop(0, "rgba(0,0,0,0)");
          overlayGrad.addColorStop(1, "rgba(0,0,0,0.7)");
          ctx.fillStyle = overlayGrad;
          ctx.fillRect(imgX, imgY + 280, imgW, 220);
        } else {
          // Luxury Architectural Placeholder Canvas Artwork
          const artGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
          artGrad.addColorStop(0, "#0f172a");
          artGrad.addColorStop(1, "#1e293b");
          ctx.fillStyle = artGrad;
          ctx.fillRect(imgX, imgY, imgW, imgH);

          // Geometric Blueprint Grid
          ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
          ctx.lineWidth = 1;
          for (let gx = imgX; gx <= imgX + imgW; gx += 40) {
            ctx.beginPath();
            ctx.moveTo(gx, imgY);
            ctx.lineTo(gx, imgY + imgH);
            ctx.stroke();
          }
          for (let gy = imgY; gy <= imgY + imgH; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(imgX, gy);
            ctx.lineTo(imgX + imgW, gy);
            ctx.stroke();
          }

          // Center Luxury Badge
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PREMIER RESIDENTIAL RESIDENCE", imgX + imgW / 2, imgY + imgH / 2 - 15);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "normal 20px system-ui, -apple-system, sans-serif";
          ctx.fillText("Official Architectural Showcase & Floor Layout", imgX + imgW / 2, imgY + imgH / 2 + 25);
          ctx.textAlign = "left";
        }

        // On-Image Specs Badge
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.fillRect(imgX + 24, imgY + imgH - 64, 420, 42);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
        ctx.fillText(
          `${currentProp.bedrooms} BR • ${currentProp.floorAreaSqm} SQM • ${currentProp.turnoverDate || "Prime Turnkey"}`,
          imgX + 38,
          imgY + imgH - 36
        );

        ctx.restore();

        // Border outline for photo card
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, imgX, imgY, imgW, imgH, radius);
        ctx.stroke();

        // 4. Financial Highlights Box (Bottom Left: 680 x 195)
        ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
        drawRoundedRect(ctx, 60, 735, 680, 195, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, 60, 735, 680, 195, 20);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
        ctx.fillText("TOTAL CONTRACT PRICE (TCP)", 90, 780);

        ctx.fillStyle = "#60a5fa";
        ctx.font = "normal 56px 'Instrument Serif', Georgia, serif";
        ctx.fillText(formatCurrency(currentProp.listPrice, "PHP", 0), 90, 842);

        const estMonthly = (currentProp.listPrice * 0.2) / 24;
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 22px system-ui, -apple-system, sans-serif";
        ctx.fillText(
          `Starts at ${formatCurrency(estMonthly * 0.77, "PHP", 0)}/mo with Step-Up Equity`,
          90,
          895
        );

        // 5. QR Code Card (Bottom Right: 250 x 195)
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(ctx, 770, 735, 250, 195, 20);
        ctx.fill();

        // Draw QR Image
        if (qrImg) {
          ctx.drawImage(qrImg, 810, 746, 170, 145);
        }

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCAN FOR COMPUTATION", 895, 912);
        ctx.textAlign = "left";

        // 6. Bottom Broker Accreditation Strip
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
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
      } catch (err) {
        console.error("Canvas render error:", err);
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    }

    renderCard();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, property, inquiryUrl, agentName, agentLicense, agentPhone, agencyName, renderCount]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !property) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `PropFlow-${(property.projectName || "Property").replace(/\s+/g, "_")}-${(property.unitCode || "Unit").replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloaded 1080×1080 Social Media Card (PNG)!");
    } catch (err) {
      console.error("Canvas export error:", err);
      toast.error("Could not export canvas. Please try again.");
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
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-base font-serif font-normal">
              <Share2 className="h-4 w-4 text-primary" />
              Social Media Marketing Card Generator (1080×1080)
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Regenerate Card"
              onClick={() => setRenderCount((c) => c + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
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
            <Copy className="h-3.5 w-3.5" />
            Copy Post Caption &amp; Hashtags
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs gap-1.5"
              disabled={isGenerating}
              onClick={handleDownloadImage}
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
