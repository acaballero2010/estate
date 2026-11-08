"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  Compass,
  FileCheck2,
  Film,
  Globe2,
  MessageSquareText,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  CURRENCY_CONFIGS,
  convertFromPhp,
  formatCurrency,
  type SupportedCurrency,
} from "@/lib/utils";

export default function PublicLandingPage() {
  const { theme, setTheme } = useTheme();
  const { user, agentProfile } = useAuth();

  // Interactive Live Calculator Teaser State
  const [calcPrice, setCalcPrice] = React.useState<number>(18500000);
  const [calcDpMonths, setCalcDpMonths] = React.useState<number>(24);
  const [calcCurrency, setCalcCurrency] = React.useState<SupportedCurrency>("PHP");
  const [calcStepUp, setCalcStepUp] = React.useState<boolean>(true);

  // Live Teaser Math
  const reservationFee = 100000;
  const grossDp = calcPrice * 0.2;
  const netDp = Math.max(0, grossDp - reservationFee);
  const baseMonthlyDp = netDp / calcDpMonths;
  // Step-Up Year 1 Starter factor (0.7x)
  const starterStepUpDp = calcStepUp ? baseMonthlyDp * 0.77 : baseMonthlyDp;
  const loanableBalance = calcPrice * 0.8;
  // 15 years @ 7.5% bank financing
  const monthlyRate = 0.075 / 12;
  const totalMonths = 180;
  const estMonthlyLoan =
    (loanableBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 1. PUBLIC STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-serif font-normal tracking-tight leading-none text-foreground">
                PropFlow
              </span>
              <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                Estates &amp; Advisory
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Pillars &amp; Solutions
            </a>
            <Link href="/showcase" className="hover:text-foreground transition-colors">
              Showcase
            </Link>
            <Link href="/quotations" className="hover:text-foreground transition-colors">
              Amortization Studio
            </Link>
            <a href="#calculator" className="hover:text-foreground transition-colors">
              Interactive Pricing
            </a>
            <a href="#developers" className="hover:text-foreground transition-colors">
              Accredited Developers
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle Theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-xs font-semibold text-muted-foreground">
                  {agentProfile?.fullName || user.displayName || user.email}
                </span>
                <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm" asChild>
                  <Link href="/dashboard">
                    <span>Command Center</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex h-8 text-xs" asChild>
                  <Link href="/login">Agent Sign In</Link>
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm" asChild>
                  <Link href="/login">
                    <span>Register Free</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION ("QUIET LUXURY" EDITORIAL STATEMENT) */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle Architectural Grid Background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container flex flex-col items-center text-center space-y-6 max-w-4xl">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary gap-1.5 rounded-full"
          >
            <Sparkles className="h-3.5 w-3.5" /> High-Ticket Real Estate Advisory &amp; Sales Operating System
          </Badge>

          <h1 className="text-3xl font-serif font-normal tracking-tight text-foreground sm:text-5xl md:text-6xl leading-[1.12]">
            Where High-Ticket Real Estate Meets{" "}
            <span className="font-serif italic font-normal text-primary">
              Private Wealth Precision.
            </span>
          </h1>

          <p className="max-w-2xl text-xs sm:text-base leading-relaxed text-muted-foreground">
            Built for elite developers, licensed brokerages, and overseas sales teams. Automate Meta Messenger buyer inquiries, compute multi-currency Step-Up equity schedules, and close reservations in bespoke digital deal rooms.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Button size="lg" className="h-10 sm:h-11 px-6 text-xs sm:text-sm gap-2 shadow-md" asChild>
                <Link href="/dashboard">
                  Enter Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="h-10 sm:h-11 px-6 text-xs sm:text-sm gap-2 shadow-md" asChild>
                <Link href="/login">
                  Launch Agent Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-10 sm:h-11 px-6 text-xs sm:text-sm gap-2" asChild>
              <Link href="/showcase">
                <Film className="h-4 w-4 text-primary" />
                Explore Model Units &amp; Tours
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="h-10 sm:h-11 px-6 text-xs sm:text-sm gap-2" asChild>
              <Link href="/quotations">
                <Calculator className="h-4 w-4" />
                Sample Amortization Studio
              </Link>
            </Button>
          </div>

          {/* Trust Endorsement */}
          <div className="pt-6 border-t border-border/40 w-full flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Powering Sales Teams Representing Premier Philippine &amp; Regional Developments
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-muted-foreground/80 pt-1">
              <span>AYALA LAND PREMIER</span>
              <span>•</span>
              <span>MEGAWORLD PRESTIGE</span>
              <span>•</span>
              <span>ROCKWELL LAND</span>
              <span>•</span>
              <span>SHANG PROPERTIES</span>
              <span>•</span>
              <span>SMDC PRIME</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE HERO PRODUCT SHOWCASE MOCKUP */}
      <section className="container pb-20">
        <div className="relative rounded-2xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-xl">
          {/* Top Mock Window Bar */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 px-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-pipeline-proposal/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-pipeline-won/60" />
              <span className="ml-2 text-[11px] font-mono text-muted-foreground hidden sm:inline">
                https://propflow.app/dashboard • BGC &amp; Nuvali Portfolio
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-pipeline-won animate-pulse" />
              Live Meta Graph API Sync
            </div>
          </div>

          {/* Inner Product Layout Preview */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* KPI Cards Strip (4 Cols) */}
            <div className="space-y-3 lg:col-span-4">
              <Card className="border border-border/60 bg-muted/20">
                <CardHeader className="p-3.5 pb-1">
                  <CardDescription className="text-[11px]">Active Pipeline Value</CardDescription>
                  <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground">
                    ₱185,450,000
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-1 text-[11px] text-pipeline-won flex items-center gap-1 font-semibold">
                  <TrendingUp className="h-3 w-3" /> +18.4% vs last quarter
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-muted/20">
                <CardHeader className="p-3.5 pb-1">
                  <CardDescription className="text-[11px]">OFW &amp; Overseas Indicative Values</CardDescription>
                  <CardTitle className="text-lg font-serif font-normal text-primary">
                    USD $3.17M · AED 11.64M · SGD 4.20M
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-1 text-[10px] text-muted-foreground">
                  Direct BSP daily indicative forex rates applied
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-muted/20">
                <CardHeader className="p-3.5 pb-1">
                  <CardDescription className="text-[11px]">Projected Net Commission Pool</CardDescription>
                  <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground">
                    ₱6,420,000
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-1 text-[10px] text-muted-foreground">
                  Computed net of 10% BIR Withholding Tax (WHT)
                </CardContent>
              </Card>
            </div>

            {/* Interactive 2D Blueprint Hotspot Preview (8 Cols) */}
            <div className="rounded-xl border border-border/80 bg-[#070b14] p-4 text-slate-100 lg:col-span-8 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-sky-400" />
                  <span className="font-semibold text-white">The Meridian Residences — Tower B (Corner 2BR Suite)</span>
                </div>
                <Badge variant="outline" className="border-sky-500/40 text-sky-400 text-[10px]">
                  84.5 m² Architectural Layout
                </Badge>
              </div>

              {/* Blueprint Graphic */}
              <div className="relative my-3 aspect-[16/8] w-full overflow-hidden rounded-lg border border-slate-800 bg-[#090d16]">
                <svg viewBox="0 0 800 400" className="h-full w-full pointer-events-none">
                  <defs>
                    <pattern id="landingGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                  </defs>
                  <rect width="800" height="400" fill="#090d16" />
                  <rect width="800" height="400" fill="url(#landingGrid)" />
                  <rect x="80" y="40" width="640" height="320" rx="4" fill="none" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.8" />
                  <rect x="80" y="100" width="90" height="200" fill="#0369a1" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="125" y="205" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">BALCONY</text>
                  <rect x="170" y="40" width="300" height="220" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
                  <text x="320" y="150" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">LIVING &amp; DINING</text>
                  <rect x="170" y="260" width="300" height="100" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
                  <text x="320" y="315" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">GOURMET KITCHEN</text>
                  <rect x="470" y="40" width="250" height="180" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
                  <text x="595" y="130" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">MASTER SUITE</text>
                  <rect x="470" y="220" width="250" height="140" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="1" />
                  <text x="595" y="295" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">BEDROOM 2 / STUDY</text>
                </svg>

                {/* Hotspot Pins */}
                <div className="absolute top-[35%] left-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  Living Lounge (26.0m²)
                </div>
                <div className="absolute top-[32%] left-[74%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700 px-2 py-0.5 text-[9px] font-semibold text-slate-200">
                  Master Bedroom (18.5m²)
                </div>
                <div className="absolute top-[75%] left-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700 px-2 py-0.5 text-[9px] font-semibold text-slate-200">
                  Gourmet Kitchen (9.5m²)
                </div>
              </div>

              {/* Bottom Showcase Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                <span>Features Step-Up Escalating Down Payment: Starts at ₱37,472/mo (Yr 1)</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] border-slate-700 text-white" asChild>
                  <Link href="/showcase">Interactive Virtual Tour →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PERFORMANCE NUMBERS / EDITORIAL METRICS BANNER */}
      <section className="border-y border-border/60 bg-muted/20 py-12">
        <div className="container grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-foreground">
              ₱4.8B+
            </span>
            <p className="text-xs text-muted-foreground font-medium">
              Accredited Inventory Pipeline Modeled
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <span className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-foreground">
              3.4x
            </span>
            <p className="text-xs text-muted-foreground font-medium">
              Faster Buyer Lead-to-Quotation Speed
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <span className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-foreground">
              4 Currencies
            </span>
            <p className="text-xs text-muted-foreground font-medium">
              Instant PHP, USD, AED, SGD, EUR Conversion
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <span className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-foreground">
              100%
            </span>
            <p className="text-xs text-muted-foreground font-medium">
              PRC &amp; Maceda Law Regulatory Compliance
            </p>
          </div>
        </div>
      </section>

      {/* 5. CORE PILLAR FEATURES (THE 4 ARCHITECTURAL PILLARS) */}
      <section id="features" className="py-20">
        <div className="container space-y-12">
          <div className="max-w-2xl space-y-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
              Platform Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Four Specialized Engines for Enterprise Real Estate Sales
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Purpose-built tools replacing fragmented spreadsheets, WhatsApp notes, and manual amortization calculators.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pillar 1 */}
            <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-serif font-normal tracking-tight">
                  1. Omnichannel Meta Graph API Automation
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
                  Connect Facebook Lead Ads and Instagram inquiries directly into an automated pipeline. Reply with quick-response quotation sheets and dispatch official brochures without leaving your CRM inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Meta Graph API Webhook with PSID lead attribution</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Bulk CSV Lead Import/Export with standard team templates</span>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 2 */}
            <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <Calculator className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-serif font-normal tracking-tight">
                  2. Step-Up Equity &amp; Multi-Currency Engine
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
                  Overcome buyer affordability hesitation with weighted starter equity schemes (Year 1: 0.7x lower cash-out, Year 2: 1.0x, Year 3: 1.3x). Real-time currency conversions for OFW buyers in Dubai, Singapore, and North America.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Deterministic 3-Way Compare: Bank 15y vs Pag-IBIG 30y vs In-House</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Export branded high-resolution PDF quotation sheets instantly</span>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 3 */}
            <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <Compass className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-serif font-normal tracking-tight">
                  3. Interactive Blueprint Hotspots &amp; Stacking Plans
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
                  Elevate property inspections beyond static images. Prospective buyers click room pins on an architectural 2D floor plan to inspect room dimensions, finishes, and interior photo views.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Interactive Tower Stacking Plan with floor-by-floor availability</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>High-definition video walkthroughs and architectural photo galleries</span>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 4 */}
            <Card className="border border-border/80 shadow-sm hover:border-primary/40 transition-all">
              <CardHeader className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-serif font-normal tracking-tight">
                  4. Digital Deal Rooms &amp; Commission Vouchers
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
                  Track unit reservation agreements, verified bank transfer receipts, and buyer loan takeout requirements under RA 6552 (Maceda Law). Generate downloadable commission disbursement vouchers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Automated 50/40/10 broker split and 10% Withholding Tax math</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-pipeline-won shrink-0" />
                  <span>Downloadable .ics calendar invites for scheduled site trippings</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE LIVE AMORTIZATION CALCULATOR TEASER */}
      <section id="calculator" className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
              Live Financial Studio
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Try the Interactive Amortization Studio
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Simulate high-ticket unit purchases. Toggle currencies to calculate indicative payments for international and OFW buyers.
            </p>
          </div>

          <Card className="border border-border/80 p-5 sm:p-6 shadow-md bg-card">
            {/* Currency Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Select Buyer Currency:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(Object.keys(CURRENCY_CONFIGS) as SupportedCurrency[]).map((curr) => {
                  const conf = CURRENCY_CONFIGS[curr];
                  return (
                    <Button
                      key={curr}
                      size="sm"
                      variant={calcCurrency === curr ? "default" : "outline"}
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setCalcCurrency(curr)}
                    >
                      <span>{conf.flag}</span>
                      <span>{conf.code}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Slider & Controls */}
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Property List Price (TCP):</span>
                  <span className="text-lg font-serif font-normal text-foreground tabular-nums">
                    {formatCurrency(calcPrice, "PHP", 0)}
                    {calcCurrency !== "PHP" && (
                      <span className="text-xs text-primary ml-1.5 font-sans font-semibold">
                        (≈ {formatCurrency(convertFromPhp(calcPrice, calcCurrency), calcCurrency, 0)})
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={3500000}
                  max={45000000}
                  step={500000}
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₱3.5M (Starter Condo)</span>
                  <span>₱18.5M (BGC Corner 2BR)</span>
                  <span>₱45.0M (Luxury Penthouse)</span>
                </div>
              </div>

              {/* Term & Step-Up Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-xs">
                  <span className="text-muted-foreground">Down Payment Stretch:</span>
                  <div className="flex gap-1">
                    {[12, 24, 36].map((m) => (
                      <Button
                        key={m}
                        size="sm"
                        variant={calcDpMonths === m ? "default" : "outline"}
                        className="h-6 px-2 text-[11px]"
                        onClick={() => setCalcDpMonths(m)}
                      >
                        {m}m
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-xs">
                  <span className="text-muted-foreground">Step-Up Escalating (0.7x Yr 1):</span>
                  <Button
                    size="sm"
                    variant={calcStepUp ? "default" : "outline"}
                    className="h-6 px-2.5 text-[11px]"
                    onClick={() => setCalcStepUp(!calcStepUp)}
                  >
                    {calcStepUp ? "Enabled ✓" : "Equal Split"}
                  </Button>
                </div>
              </div>

              {/* Output Results 3 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="rounded-lg border p-3">
                  <span className="text-[11px] text-muted-foreground block">20% Gross Down Payment</span>
                  <span className="text-lg font-serif font-normal text-foreground tabular-nums block">
                    {formatCurrency(grossDp, "PHP", 0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Net of ₱100k Reservation</span>
                </div>

                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-primary block">
                      Monthly Down Payment ({calcDpMonths} mos)
                    </span>
                    {calcStepUp && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary text-primary">
                        Yr 1 Starter
                      </Badge>
                    )}
                  </div>
                  <span className="text-xl font-serif font-normal text-primary tabular-nums block">
                    {formatCurrency(starterStepUpDp, "PHP", 0)}
                  </span>
                  {calcCurrency !== "PHP" && (
                    <span className="text-xs font-bold text-primary/80 block tabular-nums">
                      ≈ {formatCurrency(convertFromPhp(starterStepUpDp, calcCurrency), calcCurrency, 0)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {calcStepUp ? "0.7x lower starter cash-out" : "Equal monthly installments"}
                  </span>
                </div>

                <div className="rounded-lg border p-3">
                  <span className="text-[11px] text-muted-foreground block">Est. Bank Loan (15 yrs @ 7.5%)</span>
                  <span className="text-lg font-serif font-normal text-foreground tabular-nums block">
                    {formatCurrency(estMonthlyLoan, "PHP", 0)}
                  </span>
                  {calcCurrency !== "PHP" && (
                    <span className="text-xs font-semibold text-primary block tabular-nums">
                      ≈ {formatCurrency(convertFromPhp(estMonthlyLoan, calcCurrency), calcCurrency, 0)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground block mt-0.5">80% Loanable Balance</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 text-center">
                <Button className="w-full sm:w-auto px-8 text-xs gap-1.5" asChild>
                  <Link href="/quotations">
                    Open Full Quotation Studio &amp; Export PDF
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 7. ACCREDITED DEVELOPERS & INVENTORY ECOSYSTEM */}
      <section id="developers" className="py-20">
        <div className="container space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
              Inventory Portfolio
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Accredited Masterplanned Developments
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Pre-integrated inventories with architectural floor plans, high-definition photo galleries, and sample quotations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                    alt="The Meridian Park Residences"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <Badge variant="new" className="absolute top-2.5 left-2.5 text-[10px]">
                    Ayala Premier
                  </Badge>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif text-base font-normal">The Meridian Park Residences</h3>
                  <p className="text-xs text-muted-foreground">34th Street, Bonifacio Global City, Taguig</p>
                  <p className="text-xs font-semibold text-primary pt-1">From ₱18,500,000</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/showcase?propertyId=10000000-0000-4000-8000-000000000001">
                    Virtual Tour &amp; Floor Plan
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                    alt="Solana Verde Estates"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <Badge variant="new" className="absolute top-2.5 left-2.5 text-[10px]">
                    Ayala Land
                  </Badge>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif text-base font-normal">Solana Verde Estates</h3>
                  <p className="text-xs text-muted-foreground">Nuvali South, Santa Rosa, Laguna</p>
                  <p className="text-xs font-semibold text-primary pt-1">From ₱11,200,000</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/showcase?propertyId=10000000-0000-4000-8000-000000000002">
                    Virtual Tour &amp; Floor Plan
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
                    alt="Aurelia Sky Suites"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <Badge variant="new" className="absolute top-2.5 left-2.5 text-[10px]">
                    Shang Properties
                  </Badge>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif text-base font-normal">Aurelia Sky Suites</h3>
                  <p className="text-xs text-muted-foreground">Ayala Avenue cor. Makati Ave, Makati CBD</p>
                  <p className="text-xs font-semibold text-primary pt-1">From ₱32,000,000</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/showcase?propertyId=10000000-0000-4000-8000-000000000003">
                    Virtual Tour &amp; Floor Plan
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden border border-border/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80"
                    alt="Horizons Point Marina"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <Badge variant="new" className="absolute top-2.5 left-2.5 text-[10px]">
                    Megaworld
                  </Badge>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif text-base font-normal">Horizons Point Marina</h3>
                  <p className="text-xs text-muted-foreground">Seaside Boulevard, Cebu IT Park &amp; Port</p>
                  <p className="text-xs font-semibold text-primary pt-1">From ₱8,750,000</p>
                </div>
              </div>
              <div className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="/showcase?propertyId=10000000-0000-4000-8000-000000000004">
                    Virtual Tour &amp; Floor Plan
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. EXECUTIVE FAQ SECTION */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container max-w-3xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about adopting PropFlow CRM for your sales organization.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <Card className="border border-border/80 p-4">
              <h3 className="font-semibold text-foreground">
                How does PropFlow solve buyer hesitation for Overseas Filipino Workers (OFW)?
              </h3>
              <p className="mt-1.5 text-muted-foreground leading-relaxed text-xs">
                PropFlow features an automated Multi-Currency Switcher (USD, AED, SGD, EUR) alongside Philippine Peso figures. Furthermore, our Step-Up Escalating Down Payment scheme reduces Year 1 equity cash-out by 30% (0.7x factor), allowing overseas buyers to comfortably start their property investment before stepping up into Year 2 and Year 3.
              </p>
            </Card>

            <Card className="border border-border/80 p-4">
              <h3 className="font-semibold text-foreground">
                Is PropFlow compliant with PRC Real Estate Service Act (RA 9646) and Maceda Law (RA 6552)?
              </h3>
              <p className="mt-1.5 text-muted-foreground leading-relaxed text-xs">
                Yes. All generated quotation sheets, reservation agreements, and commission disbursement vouchers include designated fields for PRC Broker and Salesperson License numbers, DHSUD/HLURB accreditation details, and statutory Maceda Law buyer protection notices.
              </p>
            </Card>

            <Card className="border border-border/80 p-4">
              <h3 className="font-semibold text-foreground">
                Can our brokerage import our existing client lists and property inventory?
              </h3>
              <p className="mt-1.5 text-muted-foreground leading-relaxed text-xs">
                Yes. PropFlow provides 1-click Bulk CSV Import and Export for both Lead Contacts on <code>/pipeline</code> and Property Inventory on <code>/properties</code>, complete with downloadable sample templates that work with Excel and Google Sheets.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CALL TO ACTION */}
      <section className="py-20 text-center">
        <div className="container max-w-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-foreground">
            Ready to Modernize Your Real Estate Sales Operation?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Join hundreds of licensed real estate brokers and sales directors closing higher-ticket deals with PropFlow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {user ? (
              <Button size="lg" className="h-11 px-8 text-xs sm:text-sm gap-2 shadow-md" asChild>
                <Link href="/dashboard">
                  Launch Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="h-11 px-8 text-xs sm:text-sm gap-2 shadow-md" asChild>
                <Link href="/login">
                  Create Agent Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-11 px-8 text-xs sm:text-sm" asChild>
              <Link href="/inquire">
                Request Brokerage Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 10. LUXURY EDITORIAL FOOTER */}
      <footer className="border-t border-border/60 bg-card py-12 text-xs text-muted-foreground">
        <div className="container space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-serif font-normal tracking-tight leading-none text-foreground">
                  PropFlow
                </span>
                <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                  Estates &amp; Advisory Platform
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <Link href="/dashboard" className="hover:text-foreground">Command Center</Link>
              <Link href="/pipeline" className="hover:text-foreground">Pipeline</Link>
              <Link href="/quotations" className="hover:text-foreground">Quotations</Link>
              <Link href="/showcase" className="hover:text-foreground">Showcase</Link>
              <Link href="/deals" className="hover:text-foreground">Deal Rooms</Link>
              <Link href="/login" className="hover:text-foreground">Agent Login</Link>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>
              © {new Date().getFullYear()} PropFlow CRM. All rights reserved. Compliant with PRC RESA (RA 9646) &amp; Maceda Law (RA 6552).
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pipeline-won" />
              <span>TLS 1.3 Encryption • Firebase Enterprise Security Rules Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
