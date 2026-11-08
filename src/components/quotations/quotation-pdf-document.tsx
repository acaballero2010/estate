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
import {
  FINANCING_TYPE_DEFAULTS,
  type QuotationCalculationInput,
  type QuotationComputationResult,
} from "@/lib/schemas";

const pdfStyles = StyleSheet.create({
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
    fontSize: 16,
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
  metaLabel: {
    fontSize: 8,
    color: "#475569",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 10,
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
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  calloutValuePrimary: {
    fontSize: 12,
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
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tableRowHighlight: {
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
  colQuarter: {
    flex: 1,
    textAlign: "right",
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

export interface QuotationPdfProps {
  referenceNumber: string;
  buyerName: string;
  agentName?: string;
  agentLicense?: string;
  input: QuotationCalculationInput;
  result: QuotationComputationResult;
}

export function QuotationPdfDocument({
  referenceNumber,
  buyerName,
  agentName = "Marco Reyes, REB",
  agentLicense = "PRC Real Estate Broker Lic. #0031842",
  input,
  result,
}: QuotationPdfProps) {
  const financingLabel =
    FINANCING_TYPE_DEFAULTS[input.financingType]?.label ?? input.financingType;

  return (
    <Document
      title={`${referenceNumber} - ${input.projectName} Quotation`}
      author={agentName}
    >
      <Page size="A4" style={pdfStyles.page}>
        {/* Branded Header */}
        <View style={pdfStyles.headerBanner}>
          <View>
            <Text style={pdfStyles.brandTitle}>PROPFLOW REALTY GROUP</Text>
            <Text style={pdfStyles.brandSubtitle}>
              Official Property Quotation & Sample Amortization Schedule
            </Text>
          </View>
          <View style={pdfStyles.metaBox}>
            <Text style={pdfStyles.metaValue}>Ref: {referenceNumber}</Text>
            <Text style={pdfStyles.metaLabel}>
              Date: {new Date().toLocaleDateString("en-PH")}
            </Text>
            <Text style={pdfStyles.metaLabel}>Prepared For: {buyerName}</Text>
          </View>
        </View>

        {/* Unit Details */}
        <Text style={pdfStyles.sectionTitle}>1. Property Unit Details</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>Project / Development</Text>
            <Text style={pdfStyles.colRight}>{input.projectName}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>Unit / Block-Lot Code</Text>
            <Text style={pdfStyles.colRight}>{input.unitCode}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>Floor Area / Lot Area</Text>
            <Text style={pdfStyles.colRight}>
              {input.floorAreaSqm} sqm Floor
              {input.lotAreaSqm > 0 ? ` / ${input.lotAreaSqm} sqm Lot` : ""}
            </Text>
          </View>
        </View>

        {/* Key Callout Boxes */}
        <View style={pdfStyles.calloutRow}>
          <View style={pdfStyles.calloutCard}>
            <Text style={pdfStyles.calloutLabel}>
              Total Contract Price (TCP)
            </Text>
            <Text style={pdfStyles.calloutValue}>
              {fmtPhp(result.totalContractPrice)}
            </Text>
          </View>
          <View style={pdfStyles.calloutCardHighlight}>
            <Text style={pdfStyles.calloutLabel}>
              Monthly Equity ({input.downPaymentTermMonths} Months)
            </Text>
            <Text style={pdfStyles.calloutValuePrimary}>
              {fmtPhp(result.monthlyDownPayment)}
            </Text>
          </View>
          <View style={pdfStyles.calloutCard}>
            <Text style={pdfStyles.calloutLabel}>
              Est. Monthly Amortization ({input.loanTenorYears} Yrs)
            </Text>
            <Text style={pdfStyles.calloutValue}>
              {fmtPhp(result.monthlyAmortization)}
            </Text>
          </View>
        </View>

        {/* Financial Breakdown */}
        <Text style={pdfStyles.sectionTitle}>
          2. Total Contract Price & Financing Breakdown
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>Gross Unit List Price</Text>
            <Text style={pdfStyles.colRight}>{fmtPhp(input.listPrice)}</Text>
          </View>
          {result.discountAmount > 0 && (
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.colLeft}>
                Less Promotional Discount ({input.promoDiscountPercent}%)
              </Text>
              <Text style={pdfStyles.colRight}>
                - {fmtPhp(result.discountAmount)}
              </Text>
            </View>
          )}
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>
              Transfer Taxes & Miscellaneous Fees ({input.miscFeesPercent}%)
            </Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.miscFeesAmount)}
            </Text>
          </View>
          <View style={pdfStyles.tableRowHighlight}>
            <Text style={pdfStyles.colLeft}>Total Contract Price (TCP)</Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.totalContractPrice)}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>
              Gross Down Payment ({input.downPaymentPercent}%)
            </Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.grossDownPayment)}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>
              Less Reservation Fee (Deductible)
            </Text>
            <Text style={pdfStyles.colRight}>
              - {fmtPhp(input.reservationFee)}
            </Text>
          </View>
          <View style={pdfStyles.tableRowHighlight}>
            <Text style={pdfStyles.colLeft}>
              Net Equity Down Payment ({input.downPaymentTermMonths} Monthly
              Installments{input.isStepUpEquity ? " - Step-Up Escalating Scheme" : ""})
            </Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.netDownPayment)} ({fmtPhp(result.monthlyDownPayment)}
              /mo)
            </Text>
          </View>
          {(input.annualLumpsumAmount ?? 0) > 0 && (
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.colLeft}>
                Includes Annual Balloon / Lumpsum Payment (Every 12th Month)
              </Text>
              <Text style={pdfStyles.colRight}>
                {fmtPhp(input.annualLumpsumAmount ?? 0)} / yr
              </Text>
            </View>
          )}
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>
              Loanable Balance ({100 - input.downPaymentPercent}% via{" "}
              {financingLabel} @ {input.annualInterestRate}% p.a.)
            </Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.loanableBalance)}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colLeft}>
              Required Gross Monthly Income (30% Bank DTI Qualification)
            </Text>
            <Text style={pdfStyles.colRight}>
              {fmtPhp(result.requiredGrossMonthlyIncome)}
            </Text>
          </View>
        </View>

        {/* Annual Loan Summary (First 10 Years) */}
        <Text style={pdfStyles.sectionTitle}>
          3. Annual Loan Amortization Schedule ({financingLabel})
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRowHighlight}>
            <Text style={{ flex: 0.6 }}>Year</Text>
            <Text style={pdfStyles.colQuarter}>Annual Payment</Text>
            <Text style={pdfStyles.colQuarter}>Principal Paid</Text>
            <Text style={pdfStyles.colQuarter}>Interest Paid</Text>
            <Text style={pdfStyles.colQuarter}>Ending Balance</Text>
          </View>
          {result.annualLoanSummary.slice(0, 10).map((row) => (
            <View key={row.year} style={pdfStyles.tableRow}>
              <Text style={{ flex: 0.6 }}>Year {row.year}</Text>
              <Text style={pdfStyles.colQuarter}>
                {fmtPhp(row.annualPayment)}
              </Text>
              <Text style={pdfStyles.colQuarter}>
                {fmtPhp(row.principalPaid)}
              </Text>
              <Text style={pdfStyles.colQuarter}>
                {fmtPhp(row.interestPaid)}
              </Text>
              <Text style={pdfStyles.colQuarter}>
                {fmtPhp(row.endingBalance)}
              </Text>
            </View>
          ))}
        </View>

        {/* Agent Branding & Disclaimer Footer */}
        <View style={pdfStyles.footer}>
          <Text>
            Prepared by: {agentName} | {agentLicense} | PropFlow Realty Group
          </Text>
          <Text>
            Disclaimer: Prices, promotional discounts, and bank/HDMF interest
            rates are subject to change without prior notice. Official unit
            reservation is confirmed only upon submission of a signed Buyer
            Information Sheet and verified Reservation Fee payment.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generates and triggers a non-blocking browser download of the PDF quotation
 */
export async function downloadQuotationPdf(props: QuotationPdfProps) {
  const blob = await pdf(<QuotationPdfDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${props.referenceNumber}-${props.input.unitCode
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 32)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

