"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileSpreadsheet,
} from "lucide-react";
import type { CommissionTranche, Deal } from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CommissionTranchesCardProps {
  deal: Deal;
}

export function CommissionTranchesCard({ deal }: CommissionTranchesCardProps) {
  const { updateDealTrancheStatus } = useCrmStore();

  const tranches: CommissionTranche[] = deal.commissionTranches || [];

  const totalGross = tranches.reduce((sum, t) => sum + t.grossAmount, 0);
  const totalNet = tranches.reduce((sum, t) => sum + t.netAmount, 0);
  const releasedNet = tranches
    .filter((t) => t.status === "RELEASED")
    .reduce((sum, t) => sum + t.netAmount, 0);

  const progressPercent = totalNet > 0 ? (releasedNet / totalNet) * 100 : 0;

  const handleCycleStatus = (tranche: CommissionTranche) => {
    const nextStatus: CommissionTranche["status"] =
      tranche.status === "PENDING"
        ? "ELIGIBLE"
        : tranche.status === "ELIGIBLE"
        ? "INVOICED"
        : tranche.status === "INVOICED"
        ? "RELEASED"
        : "PENDING";

    updateDealTrancheStatus(deal.id, tranche.id, nextStatus);
    toast.success(`${tranche.name} updated to: ${nextStatus}`);
  };

  if (tranches.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card/60 p-4 space-y-4 text-xs shadow-2xs">
      {/* Header & Portfolio Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                Multi-Tranche Developer Commission Schedule
              </span>
              <Badge variant="won" className="text-[10px] font-mono">
                BIR Form 2307 Ready
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Philippine developers disburse broker fees in staged tranches across 12–24 months (Gross Pool: {formatCurrency(totalGross)}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block">Net Released / Total</span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {formatCurrency(releasedNet)} / {formatCurrency(totalNet)}
            </span>
          </div>
          <Badge
            variant={progressPercent === 100 ? "won" : "reservation"}
            className="text-[11px] px-2 py-0.5 font-semibold tabular-nums"
          >
            {progressPercent.toFixed(0)}% Cleared
          </Badge>
        </div>
      </div>

      {/* Progress Rail */}
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Tranches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tranches.map((tranche) => {
          const isReleased = tranche.status === "RELEASED";
          const isInvoiced = tranche.status === "INVOICED";
          const isEligible = tranche.status === "ELIGIBLE";
          const expDate = tranche.expectedClearanceDate
            ? new Date(tranche.expectedClearanceDate).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Upon Milestone";

          return (
            <div
              key={tranche.id}
              className={`rounded-xl border p-3 flex flex-col justify-between space-y-3 transition-all ${
                isReleased
                  ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xs"
                  : isInvoiced
                  ? "border-amber-500/40 bg-amber-500/5"
                  : isEligible
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70 bg-card/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-1.5 py-0 border-muted-foreground/30"
                  >
                    Tranche {tranche.trancheNumber} ({tranche.percentage}%)
                  </Badge>

                  <Badge
                    variant={
                      isReleased
                        ? "won"
                        : isInvoiced
                        ? "reservation"
                        : isEligible
                        ? "new"
                        : "secondary"
                    }
                    className="text-[9px] px-2 py-0 font-semibold"
                  >
                    {tranche.status}
                  </Badge>
                </div>

                <h4 className="font-semibold text-foreground text-xs leading-snug">
                  {tranche.name}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {tranche.milestoneCondition}
                </p>
              </div>

              {/* Financial Numbers */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Gross Pool:</span>
                  <span className="font-mono tabular-nums">{formatCurrency(tranche.grossAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Less 10% CWT:</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    -{formatCurrency(tranche.withholdingTaxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t">
                  <span>Net Payout:</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(tranche.netAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {expDate}
                  </span>
                  {tranche.orNumber && (
                    <span className="font-mono text-emerald-700 dark:text-emerald-300">
                      OR: {tranche.orNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={isReleased ? "outline" : "default"}
                size="sm"
                className="w-full h-7 text-[11px] gap-1 font-medium mt-1"
                onClick={() => handleCycleStatus(tranche)}
              >
                {isReleased ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Released (Click to reset)</span>
                  </>
                ) : isInvoiced ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Confirm Developer Release</span>
                  </>
                ) : isEligible ? (
                  <>
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Mark as Invoiced / Billed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Advance to Eligible</span>
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
