import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SendMessageSchema = z.object({
  recipientPsid: z.string().min(1, "Recipient PSID is required"),
  text: z.string().min(1, "Message text is required"),
  pageAccessToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { recipientPsid, text, pageAccessToken } = parsed.data;

    // If no token or simulated/demo token, return simulated success
    if (
      !pageAccessToken ||
      pageAccessToken.startsWith("demo_") ||
      pageAccessToken.startsWith("EAAdemo") ||
      pageAccessToken === "test" ||
      recipientPsid.startsWith("psid_sim_")
    ) {
      return NextResponse.json({
        success: true,
        messageId: `mid_sim_${Date.now()}`,
        simulated: true,
        recipientId: recipientPsid,
      });
    }

    // Call Meta Graph API Send API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(
        pageAccessToken.trim()
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          message: { text },
          messaging_type: "RESPONSE",
        }),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok || metaData.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            metaData.error?.message ||
            `Meta Send API returned status ${metaResponse.status}`,
          code: metaData.error?.code,
          type: metaData.error?.type,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: metaData.message_id,
      recipientId: metaData.recipient_id,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to dispatch message via Meta Graph API",
      },
      { status: 500 }
    );
  }
}

