"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Receipt,
  Users,
} from "lucide-react";
import { computeDealCommissionMetrics } from "@/lib/schemas";
import { downloadCommissionVoucherPdf } from "@/components/deals/commission-voucher-pdf";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DealsPage() {
  const { deals, leads, properties, toggleDealRequirementStatus } =
    useCrmStore();

  // Compute portfolio-wide commission summary
  const summary = React.useMemo(() => {
    return deals.reduce(
      (acc, deal) => {
        const metrics = computeDealCommissionMetrics(deal);
        acc.totalTcp += deal.totalContractPrice;
        acc.grossCommission += metrics.grossCommissionPool;
        acc.netProjected += metrics.totalNetProjected;
        acc.collected += metrics.totalCollected;
        acc.remaining += metrics.remainingCollectible;
        return acc;
      },
      {
        totalTcp: 0,
        grossCommission: 0,
        netProjected: 0,
        collected: 0,
        remaining: 0,
      }
    );
  }, [deals]);

  return (
    <div className="container space-y-6 py-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
          Deal Rooms, Closing Checklists & Commission Tracker
        </h1>
        <p className="text-xs text-muted-foreground">
          Monitor unit reservations, verify buyer loan takeout requirements, and track net commission disbursements.
        </p>
      </div>

      {/* Commission Summary KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">
              Closed & Reserved TCP Volume
            </CardDescription>
            <CardTitle className="text-lg font-bold tabular-nums sm:text-2xl">
              {formatCompactCurrency(summary.totalTcp)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Badge variant="reservation" className="text-[10px]">
              {deals.length} Active Deal Rooms
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">
              Total Projected Net Commission
            </CardDescription>
            <CardTitle className="text-lg font-bold tabular-nums sm:text-2xl">
              {formatCurrency(summary.netProjected, "PHP", 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-[11px] text-muted-foreground">
              Net of 10% Withholding Tax
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">
              Collected Commission YTD
            </CardDescription>
            <CardTitle className="text-lg font-bold text-pipeline-won tabular-nums sm:text-2xl">
              {formatCurrency(summary.collected, "PHP", 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Badge variant="won" className="text-[10px]">
              Released to Account
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">
              Pending / Collectible Balance
            </CardDescription>
            <CardTitle className="text-lg font-bold text-pipeline-proposal tabular-nums sm:text-2xl">
              {formatCurrency(summary.remaining, "PHP", 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <Badge variant="proposal" className="text-[10px]">
              Awaiting Loan Takeout
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Deal Room Cards */}
      <div className="space-y-5">
        {deals.map((deal) => {
          const buyer = leads.find((l) => l.id === deal.leadId);
          const property = properties.find((p) => p.id === deal.propertyId);
          const metrics = computeDealCommissionMetrics(deal);

          return (
            <Card key={deal.id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-[10px]">
                        {deal.dealNumber}
                      </Badge>
                      <Badge
                        variant={
                          deal.stage === "CLOSED_RELEASED"
                            ? "won"
                            : "reservation"
                        }
                        className="text-[10px]"
                      >
                        {deal.stage.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {deal.financingType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <CardTitle className="mt-1.5 text-base font-bold">
                      {property?.projectName} — {property?.unitCode}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Buyer:{" "}
                      <strong>
                        {buyer
                          ? `${buyer.firstName} ${buyer.lastName}`
                          : "Assigned Buyer"}
                      </strong>{" "}
                      • Total Contract Price:{" "}
                      <strong className="tabular-nums">
                        {formatCurrency(deal.totalContractPrice)}
                      </strong>
                    </CardDescription>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end text-left sm:text-right text-xs">
                    <div>
                      <span className="text-muted-foreground block">
                        Gross Commission Pool ({deal.totalCommissionRatePercent}%)
                      </span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        {formatCurrency(metrics.grossCommissionPool)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5"
                      onClick={async () => {
                        await downloadCommissionVoucherPdf({
                          deal,
                          buyerName: buyer
                            ? `${buyer.firstName} ${buyer.lastName}`
                            : "Assigned Buyer",
                          projectName:
                            property?.projectName || "Accredited Development",
                          unitCode: property?.unitCode || "Reserved Unit",
                        });
                        toast.success(
                          `Downloaded Commission Voucher PDF (${deal.dealNumber})`
                        );
                      }}
                    >
                      <Download className="h-3 w-3 text-primary" />
                      Download Commission Voucher PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5 p-4 lg:grid-cols-12">
                {/* Buyer Requirements Checklist (5 Cols) */}
                <div className="min-w-0 space-y-2.5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                      Closing & Loan Requirements Checklist
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      Tap status to cycle
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {deal.requirementsChecklist.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {req.status === "VERIFIED" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-pipeline-won" />
                          ) : (
                            <Clock className="h-4 w-4 shrink-0 text-pipeline-proposal" />
                          )}
                          <span className="font-medium leading-tight">
                            {req.label}
                          </span>
                        </div>
                        <Button
                          variant={
                            req.status === "VERIFIED"
                              ? "default"
                              : req.status === "SUBMITTED"
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          className="h-6 px-2 text-[10px] shrink-0"
                          onClick={() => {
                            toggleDealRequirementStatus(deal.id, req.id);
                            toast.success(`Updated ${req.code} status`);
                          }}
                        >
                          {req.status}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Verified Payment Proofs */}
                  <div className="pt-2 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-primary" />
                      Verified Reservation & Equity Receipts
                    </h4>
                    {deal.paymentProofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/20 p-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold">
                            {proof.paymentType.replace(/_/g, " ")}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {proof.paymentMethod} • Ref: {proof.referenceNo}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold tabular-nums">
                            {formatCurrency(proof.amountPaid)}
                          </span>
                          <Badge
                            variant="won"
                            className="ml-2 text-[9px] px-1.5 py-0"
                          >
                            Verified
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commission Split Table (7 Cols) */}
                <div className="min-w-0 space-y-2.5 lg:col-span-7">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Commission Split Breakdown (100% Allocation)
                    </h3>
                    <span className="text-xs font-semibold tabular-nums">
                      Collected:{" "}
                      {metrics.collectionProgressPercent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[11px]">
                          <TableHead>Recipient & Role</TableHead>
                          <TableHead className="text-right">Split %</TableHead>
                          <TableHead className="text-right">
                            Net Commission
                          </TableHead>
                          <TableHead className="text-right">Released</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {deal.commissionSplits.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell>
                              <div className="font-semibold">
                                {split.recipientName}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {split.role.replace(/_/g, " ")} (Less{" "}
                                {split.withholdingTaxRate}% EWT)
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {split.splitPercentage}%
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCurrency(split.netCommissionAmount)}
                            </TableCell>
                            <TableCell className="text-right text-pipeline-won font-medium tabular-nums">
                              {formatCurrency(split.releasedAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  split.releaseStatus === "FULLY_RELEASED"
                                    ? "won"
                                    : split.releaseStatus ===
                                      "PARTIALLY_RELEASED"
                                    ? "proposal"
                                    : "secondary"
                                }
                                className="text-[9px]"
                              >
                                {split.releaseStatus.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

