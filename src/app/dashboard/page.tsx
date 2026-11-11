"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bot,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  Film,
  Flame,
  Globe,
  Kanban,
  MessageSquareText,
} from "lucide-react";
import { computeDealCommissionMetrics } from "@/lib/schemas";
import {
  evaluateLeadStaleness,
  type LeadStalenessInfo,
} from "@/lib/lead-scoring";
import { useAutomationSettings } from "@/lib/hooks/use-automation-settings";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollingNumber } from "@/components/ui/rolling-number";

export default function DashboardPage() {
  const { leads, properties, deals, quotations, messages } = useCrmStore();
  const { staleLeadHours, enableAiCopilot, nowMs, hydrated } =
    useAutomationSettings();

  const { stalenessMap, overdueCount } = React.useMemo(() => {
    const map = new Map<string, LeadStalenessInfo>();
    let overdue = 0;
    if (hydrated && nowMs > 0) {
      for (const lead of leads) {
        const info = evaluateLeadStaleness(lead, staleLeadHours, nowMs);
        map.set(lead.id, info);
        if (info.isOverdue) overdue += 1;
      }
    }
    return { stalenessMap: map, overdueCount: overdue };
  }, [leads, staleLeadHours, nowMs, hydrated]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "unauthorized_admin") {
        toast.error("Access Denied: Platform Administrator privileges required to access /admin.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  const liveMetrics = React.useMemo(() => {
    const activePipelineValue = leads
      .filter((l) => l.stage !== "CLOSED_LOST")
      .reduce((sum, l) => sum + (l.budgetMax || 0), 0);

    const activeThreads = new Set(messages.map((m) => m.leadId)).size;
    const hotLeadsCount = leads.filter((l) => l.priority === "HOT").length;

    const availableUnits = properties.filter(
      (p) => p.status === "AVAILABLE"
    ).length;

    const commissionTotals = deals.reduce(
      (acc, d) => {
        const m = computeDealCommissionMetrics(d);
        acc.projected += m.totalNetProjected;
        acc.collected += m.totalCollected;
        return acc;
      },
      { projected: 0, collected: 0 }
    );

    return {
      activePipelineValue,
      activeThreads,
      hotLeadsCount,
      availableUnits,
      totalProposals: quotations.length + 12,
      projectedCommission: commissionTotals.projected,
      collectedCommission: commissionTotals.collected,
    };
  }, [leads, properties, deals, quotations, messages]);

  const priorityFollowUps = React.useMemo(() => {
    return [...leads]
      .filter((l) => l.stage !== "CLOSED_WON" && l.stage !== "CLOSED_LOST")
      .sort((a, b) => {
        const aStale = stalenessMap.get(a.id);
        const bStale = stalenessMap.get(b.id);
        const aOverdue = aStale?.isOverdue ? 1 : 0;
        const bOverdue = bStale?.isOverdue ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        if (a.priority === "HOT" && b.priority !== "HOT") return -1;
        if (a.priority !== "HOT" && b.priority === "HOT") return 1;
        if (aOverdue && bOverdue) {
          return (bStale?.hoursSinceContact ?? 0) - (aStale?.hoursSinceContact ?? 0);
        }
        return b.budgetMax - a.budgetMax;
      })
      .slice(0, 5);
  }, [leads, stalenessMap]);

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-foreground sm:text-3xl">
            Sales Enablement Command Center
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Track real estate leads, Meta Messenger inquiries, buyer amortization sheets, and unit reservations in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/showcase">
              <Film className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Showcase
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/quotations">
              <Calculator className="mr-1.5 h-3.5 w-3.5" />
              New Quotation
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/pipeline">
              <Kanban className="mr-1.5 h-3.5 w-3.5" />
              Open Kanban
            </Link>
          </Button>
        </div>
      </div>

      {/* Live High-Contrast KPI Summary Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">
              Active Pipeline Value
            </CardDescription>
            <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground tabular-nums sm:text-3xl">
              <RollingNumber value={liveMetrics.activePipelineValue} compact prefix="₱" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="new" className="text-[10px]">
              {leads.length} Active Leads ({liveMetrics.hotLeadsCount} Hot)
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">
              Messenger Lead Threads
            </CardDescription>
            <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground tabular-nums sm:text-3xl">
              {liveMetrics.activeThreads} Threads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="contacted" className="text-[10px]">
              {messages.length} synced messages
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">
              Available Units &amp; Proposals
            </CardDescription>
            <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground tabular-nums sm:text-3xl">
              {liveMetrics.availableUnits} Units Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="proposal" className="text-[10px]">
              {properties.length} Total in Inventory
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium">
              Projected Net Commission
            </CardDescription>
            <CardTitle className="text-2xl font-serif font-normal tracking-tight text-foreground tabular-nums sm:text-3xl">
              <RollingNumber value={liveMetrics.projectedCommission} compact prefix="₱" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Badge variant="won" className="text-[10px]">
              <RollingNumber value={liveMetrics.collectedCommission} compact prefix="₱" /> collected YTD
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Live Active Deal Milestone Task Card */}
      {deals[0] && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border/80 border-l-4 border-l-pipeline-won bg-card p-3.5 sm:p-4 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pipeline-won/20 text-pipeline-won font-bold">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground truncate">
                  Latest Reservation: {deals[0].dealNumber}
                </span>
                <Badge variant="won" className="text-[9px] uppercase px-1.5 py-0">
                  {deals[0].stage.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {(() => {
                  const deal = deals[0];
                  if (!deal) return "";
                  const b = leads.find((l) => l.id === deal.leadId);
                  const p = properties.find((prop) => prop.id === deal.propertyId);
                  return `${b ? `${b.firstName} ${b.lastName}` : "Buyer"} reserved ${p?.projectName || "Unit"} (${p?.unitCode || ""}) • TCP: ${formatCurrency(deal.totalContractPrice)}`;
                })()}
              </p>
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1.5 bg-pipeline-won hover:bg-pipeline-won/90 text-white shrink-0" asChild>
            <Link href="/deals">
              <span>Open Deal Room</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Priority Buyer Follow-Up Action Queue */}
      <Card>
        <CardHeader className="flex flex-col gap-2 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex flex-wrap items-center gap-2">
              <Flame className="h-4 w-4 text-destructive" />
              <span>Priority Buyer Follow-Up &amp; Action Queue</span>
              {hydrated && overdueCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  <Clock className="h-3 w-3" />
                  {overdueCount} Overdue (&gt;{staleLeadHours}h SLA)
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked by follow-up SLA urgency ({staleLeadHours}h threshold), priority, and target budget.{" "}
              <Link href="/settings" className="underline hover:text-foreground">
                Configure SLA
              </Link>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hydrated && overdueCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-fit border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                asChild
              >
                <Link href="/pipeline?overdue=true">
                  <Clock className="mr-1 h-3 w-3" />
                  Filter Overdue ({overdueCount})
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs w-fit" asChild>
              <Link href="/pipeline">View All {leads.length} Leads →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {priorityFollowUps.map((lead) => {
            const staleness = stalenessMap.get(lead.id);
            return (
              <div
                key={lead.id}
                className="flex flex-col justify-between gap-3 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">
                      {lead.firstName} {lead.lastName}
                    </span>
                    <Badge
                      variant={lead.priority === "HOT" ? "destructive" : "new"}
                      className="text-[10px]"
                    >
                      {lead.priority}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {lead.stage.replace(/_/g, " ")}
                    </Badge>
                    {staleness?.isOverdue && (
                      <Badge
                        variant="outline"
                        className={
                          staleness.severity === "CRITICAL"
                            ? "text-[10px] gap-1 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "text-[10px] gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }
                        title={`Last contacted ${staleness.hoursSinceContact}h ago (SLA: ${staleLeadHours}h)`}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        Overdue • {staleness.elapsedLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Budget: Up to{" "}
                    <strong className="text-foreground tabular-nums">
                      {formatCurrency(lead.budgetMax, "PHP", 0)}
                    </strong>{" "}
                    • {lead.preferredLocations.join(", ")} ({lead.financingPreference})
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {staleness?.isOverdue && enableAiCopilot && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                      asChild
                    >
                      <Link href={`/inbox?leadId=${lead.id}&checkIn=true`}>
                        <Bot className="h-3.5 w-3.5" />
                        AI Check-In
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    asChild
                  >
                    <Link href={`/inbox?leadId=${lead.id}`}>
                      <MessageSquareText className="h-3.5 w-3.5 text-primary" />
                      Message
                    </Link>
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1.5" asChild>
                    <Link href={`/quotations?leadId=${lead.id}`}>
                      <Calculator className="h-3.5 w-3.5" />
                      Quote
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Module Quick Launch Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Kanban className="h-5 w-5 text-pipeline-new" />
              <Badge variant="new">{leads.length} Active</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Lead Kanban Pipeline
            </CardTitle>
            <CardDescription className="text-xs">
              Drag-and-drop leads from New Inquiry through Site Tripping, Quotation, and Reservation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/pipeline">
                Launch Pipeline <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <MessageSquareText className="h-5 w-5 text-pipeline-contacted" />
              <Badge variant="contacted">Webhook Ready</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Meta Messenger Hub
            </CardTitle>
            <CardDescription className="text-xs">
              Unified two-way chat inbox with saved reply accelerators and one-click quotation attachments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/inbox">
                Open Inbox <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Calculator className="h-5 w-5 text-pipeline-proposal" />
              <Badge variant="proposal">PDF Engine</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Quotation &amp; Amortization
            </CardTitle>
            <CardDescription className="text-xs">
              Compute TCP, reservation, monthly equity DP, balloon lumpsums, and loan schedules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/quotations">
                Build Quotation <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <FileCheck2 className="h-5 w-5 text-pipeline-won" />
              <Badge variant="won">{deals.length} Deal Rooms</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Deals &amp; Commissions
            </CardTitle>
            <CardDescription className="text-xs">
              Manage signed reservation agreements, buyer KYC checklists, and downloadable commission vouchers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/deals">
                View Deals <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Storefront, Trippings & Lead Capture Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-between border-primary/20 bg-primary/5">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Film className="h-5 w-5 text-primary" />
              <Badge variant="new">Photos &amp; Video</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Property Showcase &amp; Virtual Tours
            </CardTitle>
            <CardDescription className="text-xs">
              Showcase architectural photo galleries, model unit video walkthroughs, and amenities to buyers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button size="sm" className="w-full text-xs" asChild>
              <Link href="/showcase">
                Explore Showcase <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CalendarCheck className="h-5 w-5 text-pipeline-tripping" />
              <Badge variant="tripping">.ICS Calendar</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Site Tripping Scheduler
            </CardTitle>
            <CardDescription className="text-xs">
              Coordinate showroom viewings, dispatch Messenger gate passes, and download calendar invites.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/trippings">
                Manage Trippings <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Globe className="h-5 w-5 text-pipeline-won" />
              <Badge variant="won">Public Capture</Badge>
            </div>
            <CardTitle className="mt-2 text-base">
              Online Inquiry &amp; Instant Quote
            </CardTitle>
            <CardDescription className="text-xs">
              Public buyer landing form that captures leads into your Kanban pipeline and unlocks a live quotation portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button variant="secondary" size="sm" className="w-full text-xs" asChild>
              <Link href="/inquire">
                Open Lead Form <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

