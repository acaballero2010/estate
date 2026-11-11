import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestoreDb } from "./config";
import type {
  AgentMessengerSettings,
  Deal,
  Lead,
  Message,
  Property,
  Quotation,
  TrippingScheduleItem,
} from "@/lib/schemas";

/**
 * Recursively converts Date instances to ISO strings and strips undefined values
 * so payloads serialize cleanly into Cloud Firestore documents.
 */
function toFirestorePayload<T>(obj: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
}

/**
 * Restores Date fields on Lead documents loaded from Firestore.
 */
function hydrateLeadDates(raw: Record<string, unknown>): Lead {
  return {
    ...(raw as unknown as Lead),
    lastContactedAt: raw.lastContactedAt
      ? new Date(raw.lastContactedAt as string)
      : null,
    nextFollowUpAt: raw.nextFollowUpAt
      ? new Date(raw.nextFollowUpAt as string)
      : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string) : new Date(),
    documents: Array.isArray(raw.documents)
      ? raw.documents.map((d: Record<string, unknown>) => ({
          ...(d as unknown as Lead["documents"][number]),
          uploadedAt: d.uploadedAt
            ? new Date(d.uploadedAt as string)
            : new Date(),
        }))
      : [],
  };
}

function hydratePropertyDates(raw: Record<string, unknown>): Property {
  return {
    ...(raw as unknown as Property),
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
  };
}

function hydrateMessageDates(raw: Record<string, unknown>): Message {
  return {
    ...(raw as unknown as Message),
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
  };
}

function hydrateQuotationDates(raw: Record<string, unknown>): Quotation {
  return {
    ...(raw as unknown as Quotation),
    validUntil: raw.validUntil
      ? new Date(raw.validUntil as string)
      : new Date(),
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string) : new Date(),
  };
}

function hydrateDealDates(raw: Record<string, unknown>): Deal {
  return {
    ...(raw as unknown as Deal),
    reservationDate: raw.reservationDate
      ? new Date(raw.reservationDate as string)
      : new Date(),
    targetLoanTakeoutDate: raw.targetLoanTakeoutDate
      ? new Date(raw.targetLoanTakeoutDate as string)
      : null,
    actualClosedDate: raw.actualClosedDate
      ? new Date(raw.actualClosedDate as string)
      : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string) : new Date(),
    requirementsChecklist: Array.isArray(raw.requirementsChecklist)
      ? raw.requirementsChecklist.map((r: Record<string, unknown>) => ({
          ...(r as unknown as Deal["requirementsChecklist"][number]),
          verifiedAt: r.verifiedAt
            ? new Date(r.verifiedAt as string)
            : null,
        }))
      : [],
    paymentProofs: Array.isArray(raw.paymentProofs)
      ? raw.paymentProofs.map((p: Record<string, unknown>) => ({
          ...(p as unknown as Deal["paymentProofs"][number]),
          paidAt: p.paidAt ? new Date(p.paidAt as string) : new Date(),
        }))
      : [],
    commissionSplits: Array.isArray(raw.commissionSplits)
      ? raw.commissionSplits.map((s: Record<string, unknown>) => ({
          ...(s as unknown as Deal["commissionSplits"][number]),
          releasedAt: s.releasedAt
            ? new Date(s.releasedAt as string)
            : null,
        }))
      : [],
  };
}

export interface AgentWorkspaceData {
  leads: Lead[];
  properties: Property[];
  messages: Message[];
  quotations: Quotation[];
  deals: Deal[];
  trippings?: TrippingScheduleItem[];
}

/**
 * Loads all CRM collections under `/agents/{agentUid}/*` from Cloud Firestore.
 * If the agent is newly registered and has no leads yet, seeds their Firestore
 * subcollections with the starter real estate dataset so they have a ready workspace.
 */
export async function loadOrSeedAgentFirestoreWorkspace(
  agentUid: string,
  defaults: AgentWorkspaceData
): Promise<AgentWorkspaceData> {
  const leadsCol = collection(firestoreDb, "agents", agentUid, "leads");
  const propsCol = collection(firestoreDb, "agents", agentUid, "properties");
  const msgsCol = collection(firestoreDb, "agents", agentUid, "messages");
  const quotesCol = collection(firestoreDb, "agents", agentUid, "quotations");
  const dealsCol = collection(firestoreDb, "agents", agentUid, "deals");
  const trippingsCol = collection(firestoreDb, "agents", agentUid, "trippings");

  // Query collections concurrently with bounds to prevent unbounded read amplification
  const [leadsSnap, propsSnap, msgsSnap, quotesSnap, dealsSnap, trippingsSnap] =
    await Promise.all([
      getDocs(query(leadsCol, limit(150))),
      getDocs(query(propsCol, limit(150))),
      getDocs(query(msgsCol, limit(300))),
      getDocs(query(quotesCol, limit(100))),
      getDocs(query(dealsCol, limit(100))),
      getDocs(query(trippingsCol, limit(100))),
    ]);

  const isDemoAgent =
    agentUid === "demo-agent-marco" || agentUid.startsWith("demo-");

  // Seed demo records ONLY if running in a demo account AND all collections are empty
  if (isDemoAgent && leadsSnap.empty && propsSnap.empty) {
    const batch = writeBatch(firestoreDb);

    for (const prop of defaults.properties) {
      batch.set(
        doc(propsCol, prop.id),
        toFirestorePayload({
          ...prop,
          listedByAgentId: agentUid,
        })
      );
    }
    for (const lead of defaults.leads) {
      batch.set(doc(leadsCol, lead.id), toFirestorePayload(lead));
    }
    for (const msg of defaults.messages) {
      batch.set(doc(msgsCol, msg.id), toFirestorePayload(msg));
    }
    for (const deal of defaults.deals) {
      batch.set(doc(dealsCol, deal.id), toFirestorePayload(deal));
    }
    for (const quote of defaults.quotations) {
      batch.set(doc(quotesCol, quote.id), toFirestorePayload(quote));
    }
    if (defaults.trippings) {
      for (const trip of defaults.trippings) {
        batch.set(doc(trippingsCol, trip.id), toFirestorePayload(trip));
      }
    }

    await batch.commit();

    return {
      leads: defaults.leads,
      properties: defaults.properties,
      messages: defaults.messages,
      deals: defaults.deals,
      quotations: defaults.quotations,
      trippings: defaults.trippings,
    };
  }

  // Load all existing saved documents for this agent from Cloud Firestore
  const leads = leadsSnap.docs.map((d) =>
    hydrateLeadDates(d.data() as Record<string, unknown>)
  );
  const properties = propsSnap.docs.map((d) =>
    hydratePropertyDates(d.data() as Record<string, unknown>)
  );
  const messages = msgsSnap.docs.map((d) =>
    hydrateMessageDates(d.data() as Record<string, unknown>)
  );
  const quotations = quotesSnap.docs.map((d) =>
    hydrateQuotationDates(d.data() as Record<string, unknown>)
  );
  const deals = dealsSnap.docs.map((d) =>
    hydrateDealDates(d.data() as Record<string, unknown>)
  );
  const trippings = trippingsSnap.docs.map(
    (d) => d.data() as TrippingScheduleItem
  );

  return {
    leads: leads.length > 0 ? leads : isDemoAgent ? defaults.leads : [],
    properties,
    messages: messages.length > 0 ? messages : isDemoAgent ? defaults.messages : [],
    quotations: quotations.length > 0 ? quotations : isDemoAgent ? defaults.quotations : [],
    deals: deals.length > 0 ? deals : isDemoAgent ? defaults.deals : [],
    trippings:
      trippings.length > 0
        ? trippings
        : isDemoAgent
        ? defaults.trippings || []
        : [],
  };
}

/**
 * Persists a single document inside `/agents/{agentUid}/{collectionName}/{docId}`
 */
export async function persistAgentDocument<T extends { id: string }>(
  agentUid: string | null,
  collectionName:
    | "leads"
    | "properties"
    | "messages"
    | "quotations"
    | "deals"
    | "trippings",
  item: T
): Promise<void> {
  if (!agentUid) return;
  try {
    const ref = doc(firestoreDb, "agents", agentUid, collectionName, item.id);
    await setDoc(ref, toFirestorePayload(item), { merge: true });
  } catch (err) {
    console.warn(`Firestore sync warning (${collectionName}):`, err);
  }
}

/**
 * Deletes a single document inside `/agents/{agentUid}/{collectionName}/{docId}`
 */
export async function deleteAgentDocument(
  agentUid: string | null,
  collectionName:
    | "leads"
    | "properties"
    | "messages"
    | "quotations"
    | "deals"
    | "trippings",
  docId: string
): Promise<void> {
  if (!agentUid) return;
  try {
    const ref = doc(firestoreDb, "agents", agentUid, collectionName, docId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn(`Firestore delete warning (${collectionName}):`, err);
  }
}

/**
 * Loads an agent's Meta Messenger Channel Settings from Firestore,
 * with localStorage fallback for local/demo accounts.
 */
export async function loadAgentMessengerSettings(
  agentUid: string | null
): Promise<AgentMessengerSettings | null> {
  if (!agentUid) return null;

  // Try localStorage first for fast hydration / demo fallback
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`propflow_messenger_settings_${agentUid}`);
      if (stored) {
        return JSON.parse(stored) as AgentMessengerSettings;
      }
    } catch {
      // ignore localStorage errors
    }
  }

  try {
    const settingsDoc = doc(firestoreDb, "agents", agentUid, "settings", "messenger");
    const snap = await getDoc(settingsDoc);
    if (snap.exists()) {
      const data = snap.data() as AgentMessengerSettings;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`propflow_messenger_settings_${agentUid}`, JSON.stringify(data));
        } catch {}
      }
      return data;
    }
  } catch (err) {
    console.warn("Could not load messenger settings from Firestore:", err);
  }

  return null;
}

/**
 * Persists an agent's Meta Messenger Channel Settings to Firestore
 * and registers the page route in `page_routes/{pageId}` for inbound routing.
 */
export async function saveAgentMessengerSettings(
  agentUid: string,
  settings: AgentMessengerSettings
): Promise<void> {
  if (!agentUid) return;

  // Save to local storage for instant availability
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`propflow_messenger_settings_${agentUid}`, JSON.stringify(settings));
    } catch {}
  }

  try {
    // 1. Save to agent's private settings
    const settingsDoc = doc(firestoreDb, "agents", agentUid, "settings", "messenger");
    await setDoc(settingsDoc, toFirestorePayload(settings), { merge: true });

    // 2. If pageId is set, register route in page_routes index for webhook separation
    if (settings.pageId && settings.isConnected) {
      const routeDoc = doc(firestoreDb, "page_routes", settings.pageId);
      await setDoc(
        routeDoc,
        toFirestorePayload({
          pageId: settings.pageId,
          pageName: settings.pageName || "Agent Page",
          agentUid,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("Firestore saveAgentMessengerSettings warning:", err);
  }
}

/**
 * Real-time listener for incoming messages belonging to an agent or specific lead.
 */
export function subscribeToAgentMessages(
  agentUid: string,
  onUpdate: (messages: Message[]) => void,
  leadId?: string
): () => void {
  const msgsCol = collection(firestoreDb, "agents", agentUid, "messages");
  const q = leadId
    ? query(msgsCol, where("leadId", "==", leadId), limit(100))
    : query(msgsCol, limit(200));

  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) =>
        hydrateMessageDates(d.data() as Record<string, unknown>)
      );
      msgs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      onUpdate(msgs);
    },
    (err) => {
      console.warn("Real-time message subscription warning:", err);
    }
  );
}

/**
 * Real-time listener for agent leads updates.
 */
export function subscribeToAgentLeads(
  agentUid: string,
  onUpdate: (leads: Lead[]) => void
): () => void {
  const leadsCol = collection(firestoreDb, "agents", agentUid, "leads");
  const q = query(leadsCol, limit(150));

  return onSnapshot(
    q,
    (snap) => {
      const leads = snap.docs.map((d) =>
        hydrateLeadDates(d.data() as Record<string, unknown>)
      );
      onUpdate(leads);
    },
    (err) => {
      console.warn("Real-time leads subscription warning:", err);
    }
  );
}



