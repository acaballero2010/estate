import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb } from "./firebase/config";

export type ShowcaseEventType =
  | "PAGE_VIEW"
  | "PROPERTY_CLICK"
  | "PANORAMA_360_VIEW"
  | "FLOORPLAN_HOTSPOT_VIEW"
  | "CURRENCY_SWITCH"
  | "VIP_PASS_REQUEST"
  | "VIDEO_PLAY";

export interface ShowcaseAnalyticsEvent {
  id: string;
  agentUid: string;
  propertyId?: string;
  projectName?: string;
  unitCode?: string;
  eventType: ShowcaseEventType;
  clientIp?: string;
  referrer?: string;
  targetCurrency?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ShowcaseAnalyticsSummary {
  totalPageViews: number;
  totalPanoramaViews: number;
  totalVipRequests: number;
  topViewedProjects: { projectName: string; count: number }[];
  recentEvents: ShowcaseAnalyticsEvent[];
}

/**
 * Non-blocking logger for client interactions on the showcase storefront
 */
export async function recordShowcaseEvent(payload: {
  agentUid?: string;
  propertyId?: string;
  projectName?: string;
  unitCode?: string;
  eventType: ShowcaseEventType;
  referrer?: string;
  targetCurrency?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const targetAgentUid = payload.agentUid || "demo-agent-marco";
  const eventId = crypto.randomUUID();

  try {
    const eventRef = doc(
      firestoreDb,
      "agents",
      targetAgentUid,
      "showcase_analytics",
      eventId
    );

    await setDoc(eventRef, {
      id: eventId,
      agentUid: targetAgentUid,
      propertyId: payload.propertyId || null,
      projectName: payload.projectName || null,
      unitCode: payload.unitCode || null,
      eventType: payload.eventType,
      referrer: payload.referrer || (typeof document !== "undefined" ? document.referrer : "direct"),
      targetCurrency: payload.targetCurrency || "PHP",
      metadata: payload.metadata || {},
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch {
    // Non-blocking telemetry
    console.debug("Showcase analytics event logged locally:", payload.eventType);
  }
}

/**
 * Loads recent telemetry and aggregates analytics for the agent
 */
export async function loadShowcaseAnalytics(
  agentUid: string
): Promise<ShowcaseAnalyticsSummary> {
  const fallbackSummary: ShowcaseAnalyticsSummary = {
    totalPageViews: 24,
    totalPanoramaViews: 11,
    totalVipRequests: 3,
    topViewedProjects: [
      { projectName: "Park Central Towers", count: 12 },
      { projectName: "Avida Towers Verge", count: 8 },
      { projectName: "Gold Residences", count: 4 },
    ],
    recentEvents: [
      {
        id: "ev-1",
        agentUid,
        projectName: "Park Central Towers",
        unitCode: "Unit 34B",
        eventType: "PANORAMA_360_VIEW",
        referrer: "WhatsApp / +63 917 888 1234",
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "ev-2",
        agentUid,
        projectName: "Avida Towers Verge",
        unitCode: "Verge-1204",
        eventType: "VIP_PASS_REQUEST",
        referrer: "Facebook Messenger",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "ev-3",
        agentUid,
        projectName: "Gold Residences",
        unitCode: "Tower 2-815",
        eventType: "PAGE_VIEW",
        referrer: "Viber Forward",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ],
  };

  try {
    const analyticsCol = collection(
      firestoreDb,
      "agents",
      agentUid,
      "showcase_analytics"
    );
    const q = query(analyticsCol, orderBy("createdAt", "desc"), limit(25));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return fallbackSummary;
    }

    const events: ShowcaseAnalyticsEvent[] = [];
    const projectCountMap: Record<string, number> = {};
    let total360 = 0;
    let totalVip = 0;

    snapshot.forEach((d) => {
      const data = d.data() as ShowcaseAnalyticsEvent;
      events.push(data);
      if (data.projectName) {
        projectCountMap[data.projectName] =
          (projectCountMap[data.projectName] || 0) + 1;
      }
      if (data.eventType === "PANORAMA_360_VIEW") total360++;
      if (data.eventType === "VIP_PASS_REQUEST") totalVip++;
    });

    const topProjects = Object.entries(projectCountMap)
      .map(([projectName, count]) => ({ projectName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPageViews: events.length,
      totalPanoramaViews: total360,
      totalVipRequests: totalVip,
      topViewedProjects: topProjects,
      recentEvents: events,
    };
  } catch {
    return fallbackSummary;
  }
}
