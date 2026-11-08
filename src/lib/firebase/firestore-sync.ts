import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { firestoreDb } from "./config";
import type {
  Deal,
  Lead,
  Message,
  Property,
  Quotation,
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

  // Query all collections concurrently
  const [leadsSnap, propsSnap, msgsSnap, quotesSnap, dealsSnap] =
    await Promise.all([
      getDocs(leadsCol),
      getDocs(propsCol),
      getDocs(msgsCol),
      getDocs(quotesCol),
      getDocs(dealsCol),
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

    await batch.commit();

    return {
      leads: defaults.leads,
      properties: defaults.properties,
      messages: defaults.messages,
      deals: defaults.deals,
      quotations: defaults.quotations,
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

  return {
    leads: leads.length > 0 ? leads : isDemoAgent ? defaults.leads : [],
    properties,
    messages: messages.length > 0 ? messages : isDemoAgent ? defaults.messages : [],
    quotations: quotations.length > 0 ? quotations : isDemoAgent ? defaults.quotations : [],
    deals: deals.length > 0 ? deals : isDemoAgent ? defaults.deals : [],
  };
}

/**
 * Persists a single document inside `/agents/{agentUid}/{collectionName}/{docId}`
 */
export async function persistAgentDocument<T extends { id: string }>(
  agentUid: string | null,
  collectionName: "leads" | "properties" | "messages" | "quotations" | "deals",
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

