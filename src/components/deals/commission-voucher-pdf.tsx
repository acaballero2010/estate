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
import { computeDealCommissionMetrics, type Deal } from "@/lib/schemas";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  metaBox: {
    textAlign: "right",
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  metaLabel: {
    fontSize: 8,
    color: "#475569",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  calloutRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  calloutCard: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
  },
  calloutCardHighlight: {
    flex: 1,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 4,
  },
  calloutLabel: {
    fontSize: 7.5,
    color: "#475569",
    marginBottom: 3,
  },
  calloutValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  calloutValuePrimary: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontFamily: "Helvetica-Bold",
  },
  colLeft: {
    flex: 2,
  },
  colRight: {
    flex: 1,
    textAlign: "right",
  },
  signatoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    gap: 16,
  },
  signatoryBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 8,
    fontSize: 7.5,
    color: "#64748b",
    lineHeight: 1.4,
  },
});

function fmtPhp(amount: number): string {
  return `PHP ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface CommissionVoucherPdfProps {
  deal: Deal;
  buyerName: string;
  projectName: string;
  unitCode: string;
}

export function CommissionVoucherPdfDocument({
  deal,
  buyerName,
  projectName,
  unitCode,
}: CommissionVoucherPdfProps) {
  const metrics = computeDealCommissionMetrics(deal);

  return (
    <Document
      title={`Commission Voucher - ${deal.dealNumber}`}
      author="PropFlow Realty Brokerage"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>
              PROPFLOW REALTY BROKERAGE — COMMISSION VOUCHER
            </Text>
            <Text style={styles.brandSubtitle}>
              Official Broker Commission Billing & EWT Disbursement Statement
            </Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaValue}>Voucher #{deal.dealNumber}</Text>
            <Text style={styles.metaLabel}>
              Stage: {deal.stage.replace(/_/g, " ")}
            </Text>
            <Text style={styles.metaLabel}>
              Issued: {new Date().toLocaleDateString("en-PH")}
            </Text>
          </View>
        </View>

        {/* Deal Summary */}
        <Text style={styles.sectionTitle}>1. Closed / Reserved Deal Particulars</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.colLeft}>Project & Unit Code</Text>
            <Text style={styles.colRight}>
              {projectName} — {unitCode}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colLeft}>Buyer / Client Name</Text>
            <Text style={styles.colRight}>{buyerName}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colLeft}>Financing Channel</Text>
            <Text style={styles.colRight}>
              {deal.financingType.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colLeft}>Total Contract Price (TCP)</Text>
            <Text style={styles.colRight}>{fmtPhp(deal.totalContractPrice)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colLeft}>
              Net Commissionable Price (Excl. VAT & Misc.)
            </Text>
            <Text style={styles.colRight}>
              {fmtPhp(deal.netCommissionablePrice)}
            </Text>
          </View>
        </View>

        {/* Callout Boxes */}
        <View style={styles.calloutRow}>
          <View style={styles.calloutCard}>
            <Text style={styles.calloutLabel}>
              Gross Commission Pool ({deal.totalCommissionRatePercent}%)
            </Text>
            <Text style={styles.calloutValue}>
              {fmtPhp(metrics.grossCommissionPool)}
            </Text>
          </View>
          <View style={styles.calloutCardHighlight}>
            <Text style={styles.calloutLabel}>
              Net Payable (After Withholding Tax)
            </Text>
            <Text style={styles.calloutValuePrimary}>
              {fmtPhp(metrics.totalNetProjected)}
            </Text>
          </View>
          <View style={styles.calloutCard}>
            <Text style={styles.calloutLabel}>
              Released / Collectible Balance
            </Text>
            <Text style={styles.calloutValue}>
              {fmtPhp(metrics.totalCollected)} / {fmtPhp(metrics.remainingCollectible)}
            </Text>
          </View>
        </View>

        {/* Split Table */}
        <Text style={styles.sectionTitle}>
          2. Commission Split & Withholding Tax (BIR Form 2307) Breakdown
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={{ flex: 2.2 }}>Recipient & Role</Text>
            <Text style={{ flex: 0.6, textAlign: "right" }}>Split %</Text>
            <Text style={{ flex: 1.2, textAlign: "right" }}>Gross Share</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>Less EWT</Text>
            <Text style={{ flex: 1.2, textAlign: "right" }}>Net Payable</Text>
            <Text style={{ flex: 1.1, textAlign: "right" }}>Released</Text>
          </View>
          {deal.commissionSplits.map((split) => {
            const grossShare =
              (metrics.grossCommissionPool * split.splitPercentage) / 100;
            const ewtTax = grossShare * (split.withholdingTaxRate / 100);
            const netPayable = grossShare - ewtTax;
            return (
              <View key={split.id} style={styles.tableRow}>
                <Text style={{ flex: 2.2 }}>
                  {split.recipientName} ({split.role.replace(/_/g, " ")})
                </Text>
                <Text style={{ flex: 0.6, textAlign: "right" }}>
                  {split.splitPercentage}%
                </Text>
                <Text style={{ flex: 1.2, textAlign: "right" }}>
                  {fmtPhp(grossShare)}
                </Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  - {fmtPhp(ewtTax)} ({split.withholdingTaxRate}%)
                </Text>
                <Text
                  style={{
                    flex: 1.2,
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {fmtPhp(netPayable)}
                </Text>
                <Text style={{ flex: 1.1, textAlign: "right" }}>
                  {fmtPhp(split.releasedAmount)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Signatories */}
        <View style={styles.signatoryRow}>
          <View style={styles.signatoryBox}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Prepared & Submitted By:
            </Text>
            <Text style={{ marginTop: 2 }}>
              Marco Reyes, REB (PRC Lic. #0031842)
            </Text>
          </View>
          <View style={styles.signatoryBox}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Verified & Approved For Release:
            </Text>
            <Text style={{ marginTop: 2 }}>
              Developer Broker Accounting & Treasury
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            PropFlow Realty Brokerage | BIR Tin # 009-442-819-000 | Official
            Commission Billing Statement for Deal {deal.dealNumber}. Subject to
            BIR Expanded Withholding Tax (EWT) Form 2307 issuance.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadCommissionVoucherPdf(
  props: CommissionVoucherPdfProps
) {
  const blob = await pdf(<CommissionVoucherPdfDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Commission-Voucher-${props.deal.dealNumber}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

