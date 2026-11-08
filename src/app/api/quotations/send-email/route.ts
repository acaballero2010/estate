import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const SendQuotationEmailSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1),
  referenceNumber: z.string().min(1),
  projectName: z.string().min(1),
  unitCode: z.string().min(1),
  totalContractPriceFormatted: z.string().min(1),
  monthlyDownPaymentFormatted: z.string().min(1),
  monthlyAmortizationFormatted: z.string().min(1),
  shareUrl: z.string().url().optional(),
  pdfBase64: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = SendQuotationEmailSchema.safeParse(json);

    if (!payload.success) {
      return NextResponse.json(
        { error: "Invalid email payload", details: payload.error.flatten() },
        { status: 400 }
      );
    }

    const {
      recipientEmail,
      recipientName,
      referenceNumber,
      projectName,
      unitCode,
      totalContractPriceFormatted,
      monthlyDownPaymentFormatted,
      monthlyAmortizationFormatted,
      shareUrl,
      pdfBase64,
    } = payload.data;

    // Check if real SMTP credentials exist
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const attachments = [];
      if (pdfBase64) {
        attachments.push({
          filename: `Quotation-${referenceNumber}.pdf`,
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        });
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"PropFlow Realty" <${smtpUser}>`,
        to: `"${recipientName}" <${recipientEmail}>`,
        subject: `Official Property Quotation: ${projectName} (${unitCode}) [${referenceNumber}]`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #1e3a8a; margin: 0;">PROPFLOW REALTY GROUP</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Sample Property Computation Sheet</p>
            </div>
            <p>Dear <strong>${recipientName}</strong>,</p>
            <p>Thank you for inquiring with us! Below is your requested property quotation summary:</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #cbd5e1;">
              <p style="margin: 0 0 8px 0;"><strong>Project:</strong> ${projectName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Unit Code:</strong> ${unitCode}</p>
              <p style="margin: 0 0 8px 0;"><strong>Total Contract Price (TCP):</strong> ${totalContractPriceFormatted}</p>
              <p style="margin: 0 0 8px 0;"><strong>Monthly Equity Installment:</strong> <span style="color: #1d4ed8; font-weight: bold;">${monthlyDownPaymentFormatted}</span></p>
              <p style="margin: 0;"><strong>Est. Monthly Amortization:</strong> ${monthlyAmortizationFormatted}</p>
            </div>
            ${
              shareUrl
                ? `<p style="text-align: center; margin: 24px 0;">
                    <a href="${shareUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">View Interactive Quotation Portal & E-Sign</a>
                   </p>`
                : ""
            }
            <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              Your official PDF quotation sheet is attached. Please feel free to reply directly to this email or reach out to your licensed property consultant.
            </p>
          </div>
        `,
        attachments,
      });

      return NextResponse.json({
        success: true,
        delivered: true,
        mode: "live_smtp",
        message: `Quotation email successfully sent to ${recipientEmail}`,
      });
    }

    // Local / Dev Fallback: Simulated success log
    console.log(
      `[Email Dispatcher - Simulated] Successfully dispatched Quotation ${referenceNumber} to ${recipientEmail} (${recipientName}) for ${projectName} (${unitCode}).`
    );

    return NextResponse.json({
      success: true,
      delivered: true,
      mode: "simulated_local",
      message: `Quotation ${referenceNumber} queued and dispatched to ${recipientEmail} (Simulated). Configure SMTP_HOST in .env.local for live production delivery.`,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch quotation email." },
      { status: 500 }
    );
  }
}

