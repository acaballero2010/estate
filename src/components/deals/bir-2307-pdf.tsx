"use client";

import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { type Deal, type CommissionSplit } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 28,
    paddingRight: 28,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  birHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    paddingBottom: 6,
    marginBottom: 8,
    textAlign: "center",
  },
  govTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#475569",
  },
  formTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    color: "#0f172a",
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 5,
    marginBottom: 8,
    borderRadius: 2,
  },
  periodItem: {
    flexDirection: "row",
    gap: 4,
  },
  labelBold: {
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  partHeader: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    padding: 3.5,
    marginTop: 4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3.5,
    alignItems: "center",
  },
  infoLabel: {
    width: "28%",
    color: "#64748b",
    fontSize: 7.5,
  },
  infoValue: {
    width: "72%",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    marginBottom: 8,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    fontSize: 7.5,
    alignItems: "center",
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
  },
  colNature: { width: "36%", paddingLeft: 6 },
  colAtc: { width: "14%", textAlign: "center" },
  colGross: { width: "25%", textAlign: "right", paddingRight: 6 },
  colTax: { width: "25%", textAlign: "right", paddingRight: 6 },
  payoutSummaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#93c5fd",
    padding: 6,
    marginBottom: 10,
    borderRadius: 3,
  },
  payoutItem: {
    textAlign: "center",
  },
  payoutLabel: {
    fontSize: 7,
    color: "#1e40af",
    textTransform: "uppercase",
  },
  payoutVal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 1,
  },
  declarationText: {
    fontSize: 6.8,
    color: "#475569",
    lineHeight: 1.3,
    marginBottom: 12,
    fontStyle: "italic",
    textAlign: "justify",
  },
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  sigBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#475569",
    paddingTop: 4,
    textAlign: "center",
  },
  sigName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#0f172a",
  },
  sigTitle: {
    fontSize: 6.8,
    color: "#64748b",
    marginTop: 1,
  },
  birBarcodeFooter: {
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 6,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export interface Bir2307PdfProps {
  deal: Deal;
  split: CommissionSplit;
  payorName?: string;
  payorTin?: string;
  payorAddress?: string;
  payeeTin?: string;
  payeeAddress?: string;
  reportingQuarter?: string;
}

export function Bir2307PdfDocument({
  deal,
  split,
  payorName = "PropFlow Realty & Development Corp.",
  payorTin = "009-881-294-000",
  payorAddress = "Level 28 High Street South Corporate Plaza, BGC, Taguig City 1634",
  payeeTin = "482-192-831-000",
  payeeAddress = "Metro Manila, Philippines",
  reportingQuarter = "Current Tax Period",
}: Bir2307PdfProps) {
  const currentDate = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const taxWithheldAmount =
    split.grossAmount * (split.withholdingTaxRate / 100);
  const netCommission = split.grossAmount - taxWithheldAmount;

  const isBroker =
    split.role === "LICENSED_BROKER" || split.role === "SALES_DIRECTOR";
  const atcCode = isBroker ? "WI 140" : "WI 141";
  const atcDescription = isBroker
    ? "Real Estate Brokers (10% or 15% EWT)"
    : "Real Estate Salespersons (10% EWT)";

  return (
    <Document title={`BIR-Form-2307-${deal.dealNumber}-${split.recipientName}`}>
      <Page size="A4" style={styles.page}>
        {/* BIR Official Header */}
        <View style={styles.birHeader}>
          <Text style={styles.govTitle}>
            Republic of the Philippines • Department of Finance
          </Text>
          <Text style={styles.govTitle}>Bureau of Internal Revenue</Text>
          <Text style={styles.formTitle}>
            Certificate of Creditable Tax Withheld at Source
          </Text>
          <Text style={styles.formSubtitle}>
            BIR Form No. 2307 • Pursuant to Sec. 2.57.2 of Revenue Regulations
            No. 2-98 (as amended)
          </Text>
        </View>

        {/* Period Covered & Reference Banner */}
        <View style={styles.periodRow}>
          <View style={styles.periodItem}>
            <Text style={styles.labelBold}>Tax Period / Quarter:</Text>
            <Text>{reportingQuarter}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.labelBold}>Deal Reference:</Text>
            <Text>{deal.dealNumber}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.labelBold}>Date Issued:</Text>
            <Text>{currentDate}</Text>
          </View>
        </View>

        {/* PART I: PAYEE (AGENT / BROKER) */}
        <Text style={styles.partHeader}>
          Part I — Payee Information (Accredited Agent / Broker)
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taxpayer Identification No. (TIN):</Text>
            <Text style={styles.infoValue}>{payeeTin}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payee&apos;s Name / Legal Name:</Text>
            <Text style={styles.infoValue}>
              {split.recipientName.toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role / Capacity:</Text>
            <Text style={styles.infoValue}>
              {split.role.replace(/_/g, " ")} ({atcDescription})
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Business Address:</Text>
            <Text style={styles.infoValue}>{payeeAddress}</Text>
          </View>
        </View>

        {/* PART II: PAYOR (DEVELOPER / REALTY BROKERAGE) */}
        <Text style={styles.partHeader}>
          Part II — Payor Information (Withholding Agent)
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taxpayer Identification No. (TIN):</Text>
            <Text style={styles.infoValue}>{payorTin}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payor&apos;s Name (Withholding Agent):</Text>
            <Text style={styles.infoValue}>{payorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Deal Property Unit:</Text>
            <Text style={styles.infoValue}>
              TCP: {formatCurrency(deal.totalContractPrice, "PHP", 0)} • Net
              Commissionable:{" "}
              {formatCurrency(deal.netCommissionablePrice, "PHP", 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registered Business Address:</Text>
            <Text style={styles.infoValue}>{payorAddress}</Text>
          </View>
        </View>

        {/* PART III: DETAILS OF INCOME PAYMENTS SUBJECT TO WITHHOLDING */}
        <Text style={styles.partHeader}>
          Part III — Details of Monthly / Quarterly Income Payments Subject to
          Expanded Withholding Tax
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNature}>
              Nature of Income Payment (EWT Schedule)
            </Text>
            <Text style={styles.colAtc}>ATC Code</Text>
            <Text style={styles.colGross}>Gross Commission (PHP)</Text>
            <Text style={styles.colTax}>Tax Withheld ({split.withholdingTaxRate}%)</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.colNature}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                Gross Professional / Realty Commission
              </Text>
              <Text style={{ fontSize: 6.8, color: "#64748b" }}>
                Deal {deal.dealNumber} • Allocation: {split.splitPercentage}% Split
              </Text>
            </View>
            <Text style={styles.colAtc}>{atcCode}</Text>
            <Text style={styles.colGross}>
              {formatCurrency(split.grossAmount, "PHP", 2)}
            </Text>
            <Text style={styles.colTax}>
              {formatCurrency(taxWithheldAmount, "PHP", 2)}
            </Text>
          </View>

          <View style={styles.tableRowTotal}>
            <Text style={styles.colNature}>TOTAL CREDITABLE WITHHOLDING TAX</Text>
            <Text style={styles.colAtc}>{atcCode}</Text>
            <Text style={styles.colGross}>
              {formatCurrency(split.grossAmount, "PHP", 2)}
            </Text>
            <Text style={styles.colTax}>
              {formatCurrency(taxWithheldAmount, "PHP", 2)}
            </Text>
          </View>
        </View>

        {/* Net Take-Home Payout Summary Box */}
        <View style={styles.payoutSummaryBox}>
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>Gross Commission</Text>
            <Text style={styles.payoutVal}>
              {formatCurrency(split.grossAmount, "PHP", 2)}
            </Text>
          </View>
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>
              Creditable Tax Withheld ({split.withholdingTaxRate}%)
            </Text>
            <Text style={[styles.payoutVal, { color: "#dc2626" }]}>
              - {formatCurrency(taxWithheldAmount, "PHP", 2)}
            </Text>
          </View>
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>Net Payout to Payee</Text>
            <Text style={[styles.payoutVal, { color: "#16a34a" }]}>
              {formatCurrency(netCommission, "PHP", 2)}
            </Text>
          </View>
        </View>

        {/* PART IV: DECLARATION UNDER OATH */}
        <Text style={styles.partHeader}>
          Part IV — Declaration &amp; Conforme (Under Penalties of Perjury)
        </Text>
        <Text style={styles.declarationText}>
          We declare, under the penalties of perjury, that this certificate has
          been made in good faith, verified by us, and to the best of our
          knowledge and belief, is true and correct pursuant to the provisions
          of the National Internal Revenue Code (NIRC), as amended, and the
          regulations issued under authority thereof. The creditable tax
          withheld has been remitted or shall be remitted to the Bureau of
          Internal Revenue via BIR Form 1601-EQ.
        </Text>

        <View style={styles.sigRow}>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{payorName}</Text>
            <Text style={styles.sigTitle}>
              Withholding Agent / Authorized Finance Officer
            </Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{split.recipientName}</Text>
            <Text style={styles.sigTitle}>
              Payee Signature / Conforme (TIN: {payeeTin})
            </Text>
          </View>
        </View>

        {/* BIR Barcode & Verification Footer */}
        <View style={styles.birBarcodeFooter}>
          <Text>
            PropFlow CRM • Verified Electronic Tax Certificate (BIR Form 2307)
          </Text>
          <Text>
            Form Hash: BIR2307-{deal.id.slice(0, 8).toUpperCase()}-
            {split.id.slice(0, 6).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Client-side trigger to download BIR Form 2307 as a PDF
 */
export async function downloadBir2307Pdf(props: Bir2307PdfProps) {
  const doc = <Bir2307PdfDocument {...props} />;
  const asBlob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(asBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BIR-2307-${props.deal.dealNumber}-${props.split.recipientName.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

