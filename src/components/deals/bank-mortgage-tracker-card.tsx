"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Landmark,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  LOG_STATUS_LABELS,
  PARTNER_BANK_LABELS,
  type BankLoanDetails,
  type Deal,
  type LogStatus,
  type PartnerBank,
} from "@/lib/schemas";
import { useCrmStore } from "@/lib/store/crm-store";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BankMortgageTrackerCardProps {
  deal: Deal;
}

const LOG_STAGES_ORDER: LogStatus[] = [
  "DOCS_COLLECTING",
  "SUBMITTED_TO_BANK",
  "APPRAISAL_ONGOING",
  "NOTICE_OF_APPROVAL",
  "LOG_RELEASED",
  "TAKEOUT_COMPLETE",
];

export function BankMortgageTrackerCard({ deal }: BankMortgageTrackerCardProps) {
  const { updateDealBankLoanDetails, toggleDealIncomeDoc } = useCrmStore();
  const [isEditingBank, setIsEditingBank] = React.useState(false);

  const loan: BankLoanDetails = deal.bankLoanDetails || {
    partnerBank: "BPI_FAMILY",
    applicationRefNo: "",
    loanOfficerName: "",
    loanOfficerPhone: "",
    loanOfficerEmail: "",
    targetLoanAmount: deal.totalContractPrice * 0.8,
    approvedLoanAmount: deal.totalContractPrice * 0.8,
    loanShortfall: 0,
    logStatus: "DOCS_COLLECTING",
    targetLogDate: deal.targetLoanTakeoutDate || null,
    actualLogReleaseDate: null,
    incomeDocsChecklist: [
      { code: "BIR_2316", label: "BIR Form 2316 / Latest ITR with AFS", collected: false },
      { code: "PAYSLIPS_3M", label: "Latest 3 Months Official Payslips", collected: false },
      { code: "COE_COMPENSATION", label: "Certificate of Employment & Compensation", collected: false },
      { code: "BANK_STATEMENTS_6M", label: "6 Months Bank Statements", collected: false },
      { code: "GOV_ID_2X", label: "2 Valid Government IDs with Signatures", collected: false },
    ],
  };

  const currentStageIndex = LOG_STAGES_ORDER.indexOf(loan.logStatus);
  const targetDate = loan.targetLogDate ? new Date(loan.targetLogDate) : null;
  const daysUntilDeadline = targetDate
    ? Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleStageSelect = (stage: LogStatus) => {
    updateDealBankLoanDetails(deal.id, {
      logStatus: stage,
      actualLogReleaseDate: stage === "LOG_RELEASED" || stage === "TAKEOUT_COMPLETE" ? new Date() : null,
    });
    toast.success(`Bank Mortgage Status updated: ${LOG_STATUS_LABELS[stage]}`);
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBank = e.target.value as PartnerBank;
    updateDealBankLoanDetails(deal.id, { partnerBank: newBank });
    toast.success(`Endorsement bank changed to ${PARTNER_BANK_LABELS[newBank]}`);
    setIsEditingBank(false);
  };

  return (
    <div className="rounded-xl border bg-card/60 p-4 space-y-4 text-xs shadow-2xs">
      {/* Header & Bank Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                Bank Mortgage &amp; LOG Tracker
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                80% Takeout Balance
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
              <span>Accredited Bank:</span>
              {isEditingBank ? (
                <select
                  value={loan.partnerBank}
                  onChange={handleBankChange}
                  className="rounded border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  {Object.entries(PARTNER_BANK_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBank(true)}
                  className="font-semibold text-foreground hover:underline flex items-center gap-1"
                  title="Click to change partner bank"
                >
                  {PARTNER_BANK_LABELS[loan.partnerBank]}
                  <span className="text-[10px] text-primary underline">Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LOG Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant={
              loan.logStatus === "LOG_RELEASED" || loan.logStatus === "TAKEOUT_COMPLETE"
                ? "won"
                : loan.logStatus === "REJECTED_RE_ENDORSING"
                ? "lost"
                : "reservation"
            }
            className="text-[11px] py-0.5 px-2.5 font-semibold gap-1"
          >
            {loan.logStatus === "LOG_RELEASED" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {LOG_STATUS_LABELS[loan.logStatus]}
          </Badge>
        </div>
      </div>

      {/* Visual LOG Progress Rail */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Mortgage Pipeline Progression:</span>
          <span>
            Step {Math.max(1, currentStageIndex + 1)} of {LOG_STAGES_ORDER.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
          {LOG_STAGES_ORDER.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => handleStageSelect(stage)}
                className={`p-1.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isCurrent
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/40"
                    : isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 font-medium"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full text-[9px] mb-1">
                  <span>Step {idx + 1}</span>
                  {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />}
                </div>
                <span className="text-[10px] leading-tight line-clamp-2">
                  {stage === "DOCS_COLLECTING" && "1. Income Docs"}
                  {stage === "SUBMITTED_TO_BANK" && "2. Endorsed"}
                  {stage === "APPRAISAL_ONGOING" && "3. Appraisal"}
                  {stage === "NOTICE_OF_APPROVAL" && "4. NOA Issued"}
                  {stage === "LOG_RELEASED" && "5. LOG Released"}
                  {stage === "TAKEOUT_COMPLETE" && "6. Takeout Done"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Comparison & Shortfall Alert */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="rounded-lg border bg-muted/20 p-2.5">
          <span className="text-[10px] text-muted-foreground block">Required Balance (80% TCP)</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(loan.targetLoanAmount)}
          </span>
        </div>

        <div className="rounded-lg border bg-muted/20 p-2.5">
          <span className="text-[10px] text-muted-foreground block">Approved Bank Loan</span>
          <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(loan.approvedLoanAmount)}
          </span>
        </div>

        <div
          className={`rounded-lg border p-2.5 ${
            loan.loanShortfall > 0
              ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <span className="text-[10px] block opacity-85">Shortfall / Spot Cash Needed</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {loan.loanShortfall > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(loan.loanShortfall)}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-bold">100% Fully Financed</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loan Officer & Target LOG Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
        {/* Officer Contact */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-primary" /> Assigned Bank Loan Officer
          </span>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2">
            <div>
              <p className="font-semibold text-foreground text-xs">
                {loan.loanOfficerName || "Bank Mortgage Specialist"}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                App Ref: {loan.applicationRefNo || "Pending Application"}
              </p>
            </div>
            {loan.loanOfficerPhone && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 rounded-full text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                  asChild
                >
                  <a
                    href={`https://wa.me/${loan.loanOfficerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp Loan Officer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 rounded-full"
                  asChild
                >
                  <a href={`tel:${loan.loanOfficerPhone}`} title="Call Loan Officer">
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* LOG Deadline Countdown */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" /> Target LOG Release Deadline
          </span>
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2">
            <div>
              <p className="font-semibold text-foreground text-xs">
                {targetDate ? targetDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "TBD with Developer"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Before Developer Downpayment Grace Period Lapses
              </p>
            </div>
            {daysUntilDeadline !== null && (
              <Badge
                variant={daysUntilDeadline < 30 ? "destructive" : daysUntilDeadline < 60 ? "reservation" : "won"}
                className="text-[10px] font-mono px-2 py-0.5"
              >
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : "Overdue"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Income Documents Checklist */}
      <div className="space-y-2 pt-1 border-t">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <FileCheck2 className="h-3 w-3 text-primary" /> Bank Income Qualification Checklist
          </span>
          <span className="text-[10px] text-muted-foreground">
            {loan.incomeDocsChecklist.filter((d) => d.collected).length} of {loan.incomeDocsChecklist.length} verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {loan.incomeDocsChecklist.map((doc) => (
            <button
              key={doc.code}
              type="button"
              onClick={() => {
                toggleDealIncomeDoc(deal.id, doc.code);
                toast.success(`Updated ${doc.label}`);
              }}
              className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors ${
                doc.collected
                  ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                  : "border-border/70 bg-background text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <span className="text-[11px] font-medium leading-tight pr-2">{doc.label}</span>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                  doc.collected
                    ? "bg-emerald-600 text-white"
                    : "border border-input text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes / Remarks */}
      {loan.remarks && (
        <div className="rounded-lg border bg-primary/5 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Underwriter Note: </span>
          {loan.remarks}
        </div>
      )}
    </div>
  );
}
