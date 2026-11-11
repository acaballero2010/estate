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
import type { Deal } from "@/lib/schemas";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    lineHeight: 1.45,
  },
  headerBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
  },
  brandSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    color: "#0f172a",
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 8,
    fontStyle: "italic",
    textAlign: "center",
    color: "#64748b",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 8,
    textAlign: "justify",
  },
  clauseTitle: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  gridTwoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  brokerBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  brokerName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  brokerField: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
  },
  financialTable: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  financialRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  financialRowHeader: {
    backgroundColor: "#f1f5f9",
    borderBottomColor: "#cbd5e1",
  },
  colLabel: {
    flex: 2,
    fontSize: 8,
    color: "#475569",
  },
  colValue: {
    flex: 3,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  signatoryContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  signatoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 10,
  },
  signatoryBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 6,
    marginTop: 28,
  },
  signatoryName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  signatoryTitle: {
    fontSize: 7.5,
    color: "#64748b",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 7,
    color: "#94a3b8",
  },
});

export interface CoBrokerageMoaPdfProps {
  deal: Deal;
  leadName: string;
  propertyName: string;
  propertyUnit: string;
  inHouseBrokerName?: string;
  inHouseBrokerPrc?: string;
}

export function CoBrokerageMoaPdfDocument({
  deal,
  leadName,
  propertyName,
  propertyUnit,
  inHouseBrokerName = "Marco Reyes, REB",
  inHouseBrokerPrc = "PRC Lic. #0031842 | DHSUD Reg. #NCR-B-03/24-7719",
}: CoBrokerageMoaPdfProps) {
  const coBroke = deal.coBrokerageDetails;
  const externalBroker = coBroke?.externalBrokerName || "Accredited Partner Broker";
  const externalPrc = coBroke?.externalBrokerPrcLicense || "PRC REB Licensed";
  const externalDhsud = coBroke?.externalBrokerDhsudReg || "DHSUD Registered";
  const externalAgency = coBroke?.externalBrokerageAgency || "External Realty Firm";
  const sharePercent = coBroke?.coBrokeSharePercent ?? 50;
  const inHousePercent = 100 - sharePercent;

  const totalCommissionPool = deal.grossCommissionTotal;
  const externalGross = (totalCommissionPool * sharePercent) / 100;
  const inHouseGross = (totalCommissionPool * inHousePercent) / 100;
  const externalTax = externalGross * 0.1; // 10% EWT Form 2307
  const externalNet = externalGross - externalTax;

  const agreementDate = coBroke?.moaSignedDate
    ? new Date(coBroke.moaSignedDate).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <Document title={`Co-Brokerage MOA - ${deal.dealNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Banner */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.brandTitle}>PROPFLOW REALTY ADVISORY</Text>
            <Text style={styles.brandSubtitle}>
              Institutional Real Estate Brokerage Network • PRC Accredited
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e3a8a" }}>
              REF: MOA-{deal.dealNumber}
            </Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Date: {agreementDate}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.docTitle}>
          MEMORANDUM OF AGREEMENT FOR CO-BROKERAGE COMMISSION SHARING
        </Text>
        <Text style={styles.docSubtitle}>
          Executed in accordance with Republic Act No. 9646 (Real Estate Service Act of the Philippines)
        </Text>

        <Text style={styles.paragraph}>
          This Memorandum of Agreement (the &quot;Agreement&quot;) is entered into on this{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{agreementDate}</Text> by and between:
        </Text>

        {/* The Two Parties */}
        <View style={styles.gridTwoCol}>
          <View style={styles.brokerBox}>
            <Text style={styles.partyLabel}>Party A: Listing / In-House Brokerage</Text>
            <Text style={styles.brokerName}>{inHouseBrokerName}</Text>
            <Text style={styles.brokerField}>Brokerage: PropFlow Estates &amp; Advisory Corp.</Text>
            <Text style={styles.brokerField}>{inHouseBrokerPrc}</Text>
            <Text style={styles.brokerField}>TIN: 009-442-819-000</Text>
          </View>

          <View style={styles.brokerBox}>
            <Text style={styles.partyLabel}>Party B: External Co-Broker / Partner</Text>
            <Text style={styles.brokerName}>{externalBroker}</Text>
            <Text style={styles.brokerField}>Brokerage: {externalAgency}</Text>
            <Text style={styles.brokerField}>PRC License: {externalPrc}</Text>
            <Text style={styles.brokerField}>DHSUD: {externalDhsud}</Text>
          </View>
        </View>

        {/* Recitals */}
        <Text style={styles.sectionTitle}>1. Subject Property &amp; Buyer Particulars</Text>
        <View style={styles.financialTable}>
          <View style={[styles.financialRow, styles.financialRowHeader]}>
            <Text style={styles.colLabel}>Parameter</Text>
            <Text style={styles.colValue}>Contract Particulars</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Buyer / Client Name</Text>
            <Text style={styles.colValue}>{leadName}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Property Development &amp; Unit</Text>
            <Text style={styles.colValue}>{propertyName} - {propertyUnit}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Total Contract Price (TCP)</Text>
            <Text style={styles.colValue}>
              PHP {deal.totalContractPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Net Commissionable Base</Text>
            <Text style={styles.colValue}>
              PHP {deal.netCommissionablePrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })} ({deal.totalCommissionRatePercent}%)
            </Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Total Gross Commission Pool</Text>
            <Text style={styles.colValue}>
              PHP {totalCommissionPool.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Commission Split Terms */}
        <Text style={styles.sectionTitle}>2. Commission Sharing Ratio &amp; Remittance</Text>
        <Text style={styles.paragraph}>
          The Parties hereby agree that all commissions released by the Developer shall be apportioned as follows:
        </Text>
        <View style={styles.financialTable}>
          <View style={[styles.financialRow, styles.financialRowHeader]}>
            <Text style={styles.colLabel}>Party / Role</Text>
            <Text style={[styles.colValue, { flex: 1.5 }]}>Share %</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>Gross Share</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>Est. Net (less 10% EWT)</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Party A (PropFlow Realty - Listing)</Text>
            <Text style={[styles.colValue, { flex: 1.5 }]}>{inHousePercent}%</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>PHP {inHouseGross.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>PHP {(inHouseGross * 0.9).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.colLabel}>Party B ({externalBroker} - Selling)</Text>
            <Text style={[styles.colValue, { flex: 1.5 }]}>{sharePercent}%</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>PHP {externalGross.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
            <Text style={[styles.colValue, { flex: 2 }]}>PHP {externalNet.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Legal Clauses */}
        <Text style={styles.sectionTitle}>3. Standard Terms &amp; Tax Compliance</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.clauseTitle}>3.1 Withholding Tax (BIR Form 2307): </Text>
          All disbursements are subject to Creditable Withholding Tax (CWT) at the prevailing rate of 10% pursuant to BIR Revenue Regulations. An official Certificate of Creditable Tax Withheld at Source (BIR Form 2307) shall be furnished to Party B upon each tranche remittance.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.clauseTitle}>3.2 Staged Tranche Disbursements: </Text>
          Commissions shall be remitted to Party B within five (5) banking days following actual clearance and credit of each respective developer voucher into Party A&apos;s escrow repository.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.clauseTitle}>3.3 RESA Law &amp; Client Non-Circumvention: </Text>
          Both Parties warrant that they are duly licensed by the PRC and registered with DHSUD. Party B agrees not to solicit or circumvent Party A regarding the Developer project for a period of one (1) year following this execution.
        </Text>

        {/* Signatories */}
        <View style={styles.signatoryContainer}>
          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#1e3a8a" }}>
            IN WITNESS WHEREOF, the Parties have signed this Agreement on {agreementDate}.
          </Text>
          <View style={styles.signatoryRow}>
            <View style={styles.signatoryBox}>
              <Text style={styles.signatoryName}>{inHouseBrokerName}</Text>
              <Text style={styles.signatoryTitle}>Listing Broker / Principal Broker</Text>
              <Text style={styles.signatoryTitle}>PropFlow Estates &amp; Advisory</Text>
            </View>

            <View style={styles.signatoryBox}>
              <Text style={styles.signatoryName}>{externalBroker}</Text>
              <Text style={styles.signatoryTitle}>External Co-Broker / Selling Partner</Text>
              <Text style={styles.signatoryTitle}>{externalAgency}</Text>
              {coBroke?.moaSigned && (
                <Text style={{ fontSize: 7, color: "#16a34a", fontFamily: "Helvetica-Bold", marginTop: 2 }}>
                  [DIGITALLY VERIFIED &amp; EXECUTED]
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            PropFlow Real Estate Advisory • Republic Act No. 9646 Compliant Co-Brokerage Document • Deal #{deal.dealNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadCoBrokerageMoaPdf(props: CoBrokerageMoaPdfProps) {
  const blob = await pdf(<CoBrokerageMoaPdfDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `CoBrokerage-MOA-${props.deal.dealNumber}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
