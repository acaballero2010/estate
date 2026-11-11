import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminFirestore } from "@/lib/firebase/admin";

const SendMessageSchema = z.object({
  recipientPsid: z.string().min(1, "Recipient PSID is required"),
  text: z.string().min(1, "Message text is required"),
  pageAccessToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller if Firebase ID token is provided
    const authHeader = request.headers.get("authorization");
    let verifiedAgentUid: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7).trim();
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        verifiedAgentUid = decoded.uid;
      } catch (authErr) {
        console.warn("Invalid ID token in messenger/send:", authErr);
      }
    }

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

    const { recipientPsid, text } = parsed.data;
    let activeToken = parsed.data.pageAccessToken?.trim() || "";

    // 2. Shield token: If agent is authenticated, retrieve the pageAccessToken securely from Firestore
    if (verifiedAgentUid) {
      try {
        const settingsSnap = await adminFirestore
          .collection("agents")
          .doc(verifiedAgentUid)
          .collection("settings")
          .doc("messenger")
          .get();

        if (settingsSnap.exists) {
          const settings = settingsSnap.data() as {
            pageAccessToken?: string;
            isConnected?: boolean;
          };
          if (settings.pageAccessToken) {
            activeToken = settings.pageAccessToken.trim();
          }
        }
      } catch (dbErr) {
        console.warn("Could not load server-side messenger token:", dbErr);
      }
    }

    // 3. Simulated/Demo fallback for testing and development
    if (
      !activeToken ||
      activeToken.startsWith("demo_") ||
      activeToken.startsWith("EAAdemo") ||
      activeToken === "test" ||
      recipientPsid.startsWith("psid_sim_")
    ) {
      return NextResponse.json({
        success: true,
        messageId: `mid_sim_${Date.now()}`,
        simulated: true,
        recipientId: recipientPsid,
      });
    }

    // 4. Call Meta Graph API Send API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(
        activeToken
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
