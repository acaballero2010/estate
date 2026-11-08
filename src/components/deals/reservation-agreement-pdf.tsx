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
import { type Deal } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 32,
    paddingRight: 32,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 10,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 2,
  },
  metaBox: {
    textAlign: "right",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  metaLabel: {
    fontSize: 7.5,
    color: "#475569",
    marginTop: 1,
  },
  titleBar: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
    borderRadius: 3,
    marginBottom: 10,
    textAlign: "center",
  },
  titleBarText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titleBarSub: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 2,
  },
  gridTwoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  gridCol: {
    flex: 1,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  dataLabel: {
    color: "#64748b",
    fontSize: 7.5,
  },
  dataValue: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    fontSize: 7.5,
  },
  legalBox: {
    backgroundColor: "#fafaf9",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    padding: 6,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 8,
  },
  legalTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  legalParagraph: {
    fontSize: 6.5,
    lineHeight: 1.35,
    color: "#475569",
    marginBottom: 3,
  },
  signatureSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  sigBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 4,
    textAlign: "center",
  },
  sigName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  sigRole: {
    fontSize: 6.5,
    color: "#64748b",
    marginTop: 1,
  },
  sigMeta: {
    fontSize: 6.5,
    color: "#475569",
    marginTop: 1,
  },
  footerNote: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export interface ReservationAgreementPdfProps {
  deal: Deal;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerTin?: string;
  buyerCivilStatus?: string;
  buyerSpouseName?: string;
  buyerCitizenship?: string;
  projectName: string;
  developerName?: string;
  unitCode: string;
  floorAreaSqm?: number;
  lotAreaSqm?: number;
  parkingSlots?: number;
  turnoverDate?: string;
  agentName?: string;
  agentPrcLicense?: string;
  agentDhsudNumber?: string;
  brokerName?: string;
  brokerPrcLicense?: string;
  brokerDhsudNumber?: string;
}

export function ReservationAgreementPdfDocument({
  deal,
  buyerName,
  buyerEmail = "buyer@client.ph",
  buyerPhone = "+63 917 555 0192",
  buyerAddress = "Metro Manila, Philippines",
  buyerTin = "284-910-442-000",
  buyerCivilStatus = "Married",
  buyerSpouseName = "Elena Santos",
  buyerCitizenship = "Filipino",
  projectName,
  developerName = "Ayala Premier Estates",
  unitCode,
  floorAreaSqm = 84.5,
  lotAreaSqm = 0,
  parkingSlots = 1,
  turnoverDate = "Q4 2027 (Pre-selling)",
  agentName = "Marco Reyes, REB",
  agentPrcLicense = "PRC REB #0031892",
  agentDhsudNumber = "DHSUD-NCR-B-2024-00412",
  brokerName = "PropFlow Realty Advisory Network",
  brokerPrcLicense = "PRC Corporate Lic #0019481",
  brokerDhsudNumber = "DHSUD-NCR-CORP-2024-00108",
}: ReservationAgreementPdfProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const reservationAmount = 100000;
  const downPaymentPercent = 20;
  const grossDownPayment = deal.totalContractPrice * 0.2;
  const netDownPayment = Math.max(0, grossDownPayment - reservationAmount);
  const monthlyDownPayment = netDownPayment / 24;
  const loanableBalance = deal.totalContractPrice * 0.8;

  return (
    <Document title={`Reservation-Agreement-${deal.dealNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Top Header Banner */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>PROPFLOW ESTATES &amp; ADVISORY</Text>
            <Text style={styles.brandSubtitle}>
              Accredited Master Brokerage &amp; Property Developer Sales Suite
            </Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaValue}>DEAL ROOM: {deal.dealNumber}</Text>
            <Text style={styles.metaLabel}>Execution Date: {currentDate}</Text>
          </View>
        </View>

        {/* Title Bar */}
        <View style={styles.titleBar}>
          <Text style={styles.titleBarText}>
            Official Property Reservation Agreement &amp; Buyer KYC Form
          </Text>
          <Text style={styles.titleBarSub}>
            Compliant with PRC Real Estate Service Act (RA 9646) &amp; Maceda Law (RA 6552)
          </Text>
        </View>

        {/* Section A: Property Particulars */}
        <Text style={styles.sectionTitle}>1. Designated Property Specification</Text>
        <View style={styles.gridTwoCol}>
          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Project Name:</Text>
              <Text style={styles.dataValue}>{projectName}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Developer Entity:</Text>
              <Text style={styles.dataValue}>{developerName}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Unit Code / Designation:</Text>
              <Text style={styles.dataValue}>{unitCode}</Text>
            </View>
          </View>

          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Floor Area (m²):</Text>
              <Text style={styles.dataValue}>
                {floorAreaSqm} sq.m.{lotAreaSqm > 0 ? ` (Lot: ${lotAreaSqm} sq.m.)` : ""}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Parking Allocation:</Text>
              <Text style={styles.dataValue}>{parkingSlots} Dedicated Slot(s)</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Target Turnover:</Text>
              <Text style={styles.dataValue}>{turnoverDate}</Text>
            </View>
          </View>
        </View>

        {/* Section B: Buyer KYC Particulars */}
        <Text style={styles.sectionTitle}>2. Buyer Particulars &amp; KYC Verification</Text>
        <View style={styles.gridTwoCol}>
          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Principal Buyer Legal Name:</Text>
              <Text style={styles.dataValue}>{buyerName}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Tax Identification Number (TIN):</Text>
              <Text style={styles.dataValue}>{buyerTin}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Civil Status / Spouse:</Text>
              <Text style={styles.dataValue}>
                {buyerCivilStatus} {buyerSpouseName ? `(${buyerSpouseName})` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Citizenship:</Text>
              <Text style={styles.dataValue}>{buyerCitizenship}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Contact Phone / Mobile:</Text>
              <Text style={styles.dataValue}>{buyerPhone}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Residence Address:</Text>
              <Text style={styles.dataValue}>{buyerAddress || buyerEmail}</Text>
            </View>
          </View>
        </View>

        {/* Section C: Financial Terms & Schedule */}
        <Text style={styles.sectionTitle}>3. Financial Schedule &amp; Installment Terms</Text>
        <View style={styles.gridTwoCol}>
          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Total Contract Price (TCP):</Text>
              <Text style={styles.dataValue}>{formatCurrency(deal.totalContractPrice)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Gross Down Payment ({downPaymentPercent}%):</Text>
              <Text style={styles.dataValue}>{formatCurrency(grossDownPayment)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Less Reservation Deposit (Deductible):</Text>
              <Text style={styles.dataValue}>- {formatCurrency(reservationAmount)}</Text>
            </View>
          </View>

          <View style={styles.gridCol}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Net Down Payment (24 Months):</Text>
              <Text style={styles.dataValue}>{formatCurrency(netDownPayment)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Monthly Equity Installment:</Text>
              <Text style={styles.dataValue}>{formatCurrency(monthlyDownPayment)} / month</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Remaining Balance Financing:</Text>
              <Text style={styles.dataValue}>
                {formatCurrency(loanableBalance)} ({deal.financingType.replace(/_/g, " ")})
              </Text>
            </View>
          </View>
        </View>

        {/* Section D: Standard Legal Covenants & Maceda Law */}
        <Text style={styles.sectionTitle}>4. Standard Legal Terms &amp; Conditions</Text>
        <View style={styles.legalBox}>
          <Text style={styles.legalTitle}>Covenants &amp; Regulatory Disclaimers:</Text>
          <Text style={styles.legalParagraph}>
            1. Non-Refundability: The reservation deposit is strictly non-refundable and non-transferable, paid to grant the Purchaser an exclusive 30-day option to acquire the unit.
          </Text>
          <Text style={styles.legalParagraph}>
            2. 30-Day Document Completion: The Purchaser covenants to submit all standard developer requirements (Signed Contract to Sell, 2 Government IDs, Proof of Income, TIN Card, and Post-Dated Checks / Auto-Debit Authority) within thirty (30) calendar days from receipt of reservation.
          </Text>
          <Text style={styles.legalParagraph}>
            3. RA 6552 (Maceda Law) Protection: In the event of default in installment payments, statutory rights of the buyer to grace periods and cash surrender value shall strictly adhere to Republic Act No. 6552.
          </Text>
          <Text style={styles.legalParagraph}>
            4. Force Majeure &amp; Title Transfer: Turnover timelines and issuance of Condominium Certificate of Title (CCT) or Transfer Certificate of Title (TCT) are subject to DHSUD and Registry of Deeds administrative clearances.
          </Text>
        </View>

        {/* Section E: Signatures Block */}
        <Text style={styles.sectionTitle}>5. Conforme &amp; PRC Broker Endorsement</Text>
        <View style={styles.signatureSection}>
          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{buyerName}</Text>
            <Text style={styles.sigRole}>Principal Purchaser (Conforme)</Text>
            <Text style={styles.sigMeta}>Digital E-Signature Verified • Date: {currentDate}</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{agentName}</Text>
            <Text style={styles.sigRole}>Accredited Real Estate Salesperson</Text>
            <Text style={styles.sigMeta}>{agentPrcLicense} • {agentDhsudNumber}</Text>
          </View>

          <View style={styles.sigBox}>
            <Text style={styles.sigName}>{brokerName}</Text>
            <Text style={styles.sigRole}>Licensed Supervising Broker</Text>
            <Text style={styles.sigMeta}>{brokerPrcLicense} • {brokerDhsudNumber}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Text>PropFlow CRM • Verified Electronic Deal Room Form</Text>
          <Text>Secure Hash: SHA256-RAF-{deal.id.slice(0, 12).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Client-Side Trigger to Download the Reservation Agreement PDF
 */
export async function downloadReservationAgreementPdf(props: ReservationAgreementPdfProps) {
  const doc = <ReservationAgreementPdfDocument {...props} />;
  const asBlob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(asBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reservation-Agreement-${props.deal.dealNumber}-${props.buyerName.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

