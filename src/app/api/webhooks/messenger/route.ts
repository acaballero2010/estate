import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase/config";

/**
 * Verifies Meta Graph API X-Hub-Signature-256 HMAC-SHA256 payload signature
 * when META_APP_SECRET is configured in the environment.
 */
function verifyMetaWebhookSignature(
  rawBodyText: string,
  signatureHeader: string | null,
  appSecret: string | undefined
): boolean {
  if (!appSecret) {
    // Allow local dev simulation when META_APP_SECRET is not set
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const expectedSig =
    "sha256=" +
    createHmac("sha256", appSecret).update(rawBodyText, "utf8").digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

/**
 * Zod Validation Schema for Incoming Meta Graph API Messenger Webhook Payloads
 */
const MetaMessengerWebhookSchema = z.object({
  object: z.literal("page"),
  entry: z.array(
    z.object({
      id: z.string(),
      time: z.number(),
      messaging: z
        .array(
          z.object({
            sender: z.object({ id: z.string() }),
            recipient: z.object({ id: z.string() }),
            timestamp: z.number(),
            message: z
              .object({
                mid: z.string(),
                text: z.string().optional(),
                attachments: z
                  .array(
                    z.object({
                      type: z.string(),
                      payload: z.object({
                        url: z.string().optional(),
                      }),
                    })
                  )
                  .optional(),
              })
              .optional(),
            postback: z
              .object({
                title: z.string(),
                payload: z.string(),
              })
              .optional(),
          })
        )
        .optional(),
    })
  ),
});

/**
 * GET /api/webhooks/messenger
 * Meta Graph API Webhook Verification Endpoint (`hub.mode`, `hub.verify_token`, `hub.challenge`)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "propflow_meta_verify_secret_2026";

  if (mode === "subscribe" && token === expectedVerifyToken && challenge) {
    // Return challenge plain-text with 200 OK as required by Meta Messenger Platform
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    {
      error: "Meta Webhook verification failed. Invalid verify_token or mode.",
    },
    { status: 403 }
  );
}

/**
 * POST /api/webhooks/messenger
 * Receives real-time incoming messages and postbacks from Facebook Messenger leads
 */
export async function POST(request: NextRequest) {
  try {
    const rawBodyText = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    if (
      !verifyMetaWebhookSignature(
        rawBodyText,
        signatureHeader,
        process.env.META_APP_SECRET
      )
    ) {
      return NextResponse.json(
        { error: "Invalid X-Hub-Signature-256 webhook signature" },
        { status: 401 }
      );
    }

    const rawBody: unknown = JSON.parse(rawBodyText);
    const parsed = MetaMessengerWebhookSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid Messenger webhook payload structure",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const processedEvents: Array<{
      pageId: string;
      senderPsid: string;
      mid?: string;
      text?: string;
      timestamp: number;
    }> = [];

    for (const entry of parsed.data.entry) {
      let targetAgentUid: string | null = null;
      try {
        const routeDoc = await getDoc(doc(firestoreDb, "page_routes", entry.id));
        if (routeDoc.exists()) {
          targetAgentUid = (routeDoc.data() as { agentUid?: string })?.agentUid ?? null;
        }
      } catch (routingErr) {
        console.warn("Could not query page_routes collection:", routingErr);
      }

      for (const event of entry.messaging ?? []) {
        if (event.message || event.postback) {
          const text = event.message?.text ?? event.postback?.payload;
          processedEvents.push({
            pageId: entry.id,
            senderPsid: event.sender.id,
            mid: event.message?.mid,
            text,
            timestamp: event.timestamp,
          });

          // Route directly into the agent's Firestore collection if mapped
          if (targetAgentUid && text) {
            try {
              const msgId = crypto.randomUUID();
              const msgRef = doc(firestoreDb, "agents", targetAgentUid, "messages", msgId);
              await setDoc(
                msgRef,
                {
                  id: msgId,
                  leadId: `lead_meta_${event.sender.id}`,
                  senderType: "LEAD",
                  senderId: event.sender.id,
                  channel: "FACEBOOK_MESSENGER",
                  metaMid: event.message?.mid || `mid_${Date.now()}`,
                  content: text,
                  deliveryStatus: "DELIVERED",
                  createdAt: new Date(event.timestamp).toISOString(),
                },
                { merge: true }
              );
            } catch (persistErr) {
              console.warn("Firestore inbound webhook persist error:", persistErr);
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        status: "EVENT_RECEIVED",
        processedCount: processedEvents.length,
        events: processedEvents,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to parse Messenger webhook request body",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

