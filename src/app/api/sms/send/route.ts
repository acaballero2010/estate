import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizePhilippineMobile,
  calculateSmsSegments,
} from "@/lib/semaphore-sms";

const SendSmsRequestSchema = z.object({
  to: z.string().min(1, "Recipient mobile number is required"),
  message: z.string().min(1, "SMS message content cannot be empty").max(918, "SMS message exceeds maximum length"),
  sendername: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = SendSmsRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { to, message, sendername } = parsed.data;
    const { normalized, isValid, carrier } = normalizePhilippineMobile(to);

    if (!isValid) {
      return NextResponse.json(
        {
          error: `Invalid Philippine mobile number: "${to}". Must be a valid 11-digit number starting with 09 (Globe, Smart, DITO).`,
        },
        { status: 400 }
      );
    }

    const { segments } = calculateSmsSegments(message);
    const apiKey = process.env.SEMAPHORE_API_KEY;

    // If Semaphore API key is configured, send via real live Philippine Telco gateway
    if (apiKey && apiKey !== "mock_key") {
      const formParams = new URLSearchParams();
      formParams.append("apikey", apiKey);
      formParams.append("number", normalized);
      formParams.append("message", message);
      if (sendername) {
        formParams.append("sendername", sendername);
      }

      const response = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formParams.toString(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Semaphore API error:", data);
        return NextResponse.json(
          {
            error: data?.message || "Semaphore Gateway error",
            details: data,
          },
          { status: response.status }
        );
      }

      const firstResult = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({
        success: true,
        messageId: firstResult?.message_id || `sem_${Date.now()}`,
        recipient: normalized,
        status: "SENT",
        network: carrier,
        creditsUsed: segments,
        rawResponse: data,
      });
    }

    // Development / Simulator Mode when no API key is set
    console.log(`[SEMAPHORE SIMULATOR] Dispatching SMS to ${normalized} (${carrier}): "${message}"`);

    return NextResponse.json({
      success: true,
      messageId: `sim_sms_${Date.now()}`,
      recipient: normalized,
      status: "SIMULATED",
      network: carrier,
      creditsUsed: segments,
      note: "Simulator Mode: Message dispatched successfully to mock Philippine telco switch. Set SEMAPHORE_API_KEY in environment to broadcast live SMS.",
    });
  } catch (error) {
    console.error("SMS endpoint unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error while dispatching SMS" },
      { status: 500 }
    );
  }
}

