import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { adminFirestore } from "@/lib/firebase/admin";
import {
  buildPersonalizedGreetingReply,
  parseBuyerMessengerIntent,
} from "@/lib/messenger-auto-responder";

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
      leadCreated?: boolean;
      autoReplied?: boolean;
    }> = [];

    let leadsCreatedCount = 0;
    let autoRepliedCount = 0;

    for (const entry of parsed.data.entry) {
      let targetAgentUid: string | null = null;
      try {
        const routeDoc = await adminFirestore.collection("page_routes").doc(entry.id).get();
        if (routeDoc.exists) {
          targetAgentUid = (routeDoc.data() as { agentUid?: string })?.agentUid ?? null;
        }
      } catch (routingErr) {
        console.warn("Could not query page_routes collection via admin Firestore:", routingErr);
      }

      // Load agent messenger settings once per entry if mapped
      let agentMessengerConfig: {
        isConnected?: boolean;
        autoReplyGreeting?: boolean;
        greetingMessage?: string;
        pageAccessToken?: string;
      } | null = null;

      if (targetAgentUid) {
        try {
          const settingsSnap = await adminFirestore
            .collection("agents")
            .doc(targetAgentUid)
            .collection("settings")
            .doc("messenger")
            .get();
          if (settingsSnap.exists) {
            agentMessengerConfig = settingsSnap.data() as {
              isConnected?: boolean;
              autoReplyGreeting?: boolean;
              greetingMessage?: string;
              pageAccessToken?: string;
            };
          }
        } catch (settingsErr) {
          console.warn("Could not load agent messenger settings via admin Firestore:", settingsErr);
        }
      }

      for (const event of entry.messaging ?? []) {
        if (event.message || event.postback) {
          const text = event.message?.text ?? event.postback?.payload;
          const leadDocId = `lead_meta_${event.sender.id}`;
          let leadCreated = false;
          let autoReplied = false;

          // Route directly into the agent's Firestore collection if mapped
          if (targetAgentUid && text) {
            const intent = parseBuyerMessengerIntent(text);
            const eventIso = new Date(event.timestamp).toISOString();

            try {
              const leadRef = adminFirestore
                .collection("agents")
                .doc(targetAgentUid)
                .collection("leads")
                .doc(leadDocId);
              const existingLeadSnap = await leadRef.get();

              if (!existingLeadSnap.exists) {
                await leadRef.set(
                  {
                    id: leadDocId,
                    assignedAgentId: targetAgentUid,
                    firstName: "Messenger",
                    lastName: `Lead (${event.sender.id.slice(-4)})`,
                    email: "",
                    phone: "Pending via Messenger",
                    messengerPsid: event.sender.id,
                    stage: "NEW_LEAD",
                    source: "FACEBOOK_MESSENGER",
                    priority: intent.priority,
                    budgetMin: intent.budgetMin,
                    budgetMax: intent.budgetMax,
                    preferredLocations: intent.preferredLocations,
                    preferredPropertyTypes: intent.preferredPropertyTypes,
                    financingPreference: intent.financingPreference,
                    notes: `Auto-captured via Facebook Messenger Webhook: "${text}"`,
                    tags: intent.detectedTags,
                    documents: [],
                    lastContactedAt: null,
                    nextFollowUpAt: new Date(event.timestamp + 86_400_000).toISOString(),
                    createdAt: eventIso,
                    updatedAt: eventIso,
                  },
                  { merge: true }
                );
                leadCreated = true;
                leadsCreatedCount += 1;
              }
            } catch (leadErr) {
              console.warn("Firestore inbound lead auto-create error via admin SDK:", leadErr);
            }

            try {
              const msgId = crypto.randomUUID();
              const msgRef = adminFirestore
                .collection("agents")
                .doc(targetAgentUid)
                .collection("messages")
                .doc(msgId);
              await msgRef.set(
                {
                  id: msgId,
                  leadId: leadDocId,
                  senderType: "LEAD",
                  senderId: event.sender.id,
                  channel: "FACEBOOK_MESSENGER",
                  metaMid: event.message?.mid || `mid_${Date.now()}`,
                  content: text,
                  deliveryStatus: "DELIVERED",
                  createdAt: eventIso,
                },
                { merge: true }
              );
            } catch (persistErr) {
              console.warn("Firestore inbound webhook persist error via admin SDK:", persistErr);
            }

            // Instant Auto-Responder when a new lead arrives & autoReplyGreeting is enabled
            if (
              leadCreated &&
              agentMessengerConfig?.isConnected &&
              agentMessengerConfig?.autoReplyGreeting
            ) {
              const replyText = buildPersonalizedGreetingReply({
                firstName: "there",
                greetingTemplate: agentMessengerConfig.greetingMessage,
                intent,
              });

              const token = agentMessengerConfig.pageAccessToken?.trim();
              const isLiveMetaToken =
                Boolean(token) &&
                !token!.startsWith("demo_") &&
                !token!.startsWith("EAAdemo") &&
                token !== "test" &&
                !event.sender.id.startsWith("psid_sim_");

              if (isLiveMetaToken && token) {
                try {
                  const metaRes = await fetch(
                    `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(
                      token
                    )}`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({
                        recipient: { id: event.sender.id },
                        message: { text: replyText },
                        messaging_type: "RESPONSE",
                      }),
                    }
                  );
                  if (metaRes.ok) {
                    autoReplied = true;
                  }
                } catch (sendErr) {
                  console.warn("Auto-responder Meta Send API error:", sendErr);
                }
              } else {
                autoReplied = true;
              }

              if (autoReplied) {
                autoRepliedCount += 1;
                try {
                  const autoMsgId = crypto.randomUUID();
                  const autoMsgRef = adminFirestore
                    .collection("agents")
                    .doc(targetAgentUid)
                    .collection("messages")
                    .doc(autoMsgId);
                  await autoMsgRef.set(
                    {
                      id: autoMsgId,
                      leadId: leadDocId,
                      senderType: "AGENT",
                      senderId: targetAgentUid,
                      channel: "FACEBOOK_MESSENGER",
                      metaMid: `mid_auto_${Date.now()}`,
                      content: replyText,
                      deliveryStatus: "SENT",
                      createdAt: new Date(event.timestamp + 500).toISOString(),
                    },
                    { merge: true }
                  );

                  const leadUpdateRef = adminFirestore
                    .collection("agents")
                    .doc(targetAgentUid)
                    .collection("leads")
                    .doc(leadDocId);
                  await leadUpdateRef.set(
                    {
                      lastContactedAt: new Date(event.timestamp + 500).toISOString(),
                      updatedAt: new Date(event.timestamp + 500).toISOString(),
                    },
                    { merge: true }
                  );
                } catch (autoPersistErr) {
                  console.warn("Firestore auto-reply persist error via admin SDK:", autoPersistErr);
                }
              }
            }
          }

          processedEvents.push({
            pageId: entry.id,
            senderPsid: event.sender.id,
            mid: event.message?.mid,
            text,
            timestamp: event.timestamp,
            leadCreated,
            autoReplied,
          });
        }
      }
    }

    return NextResponse.json(
      {
        status: "EVENT_RECEIVED",
        processedCount: processedEvents.length,
        leadsCreatedCount,
        autoRepliedCount,
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

