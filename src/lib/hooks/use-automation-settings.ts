"use client";

import * as React from "react";
import { DEFAULT_STALE_LEAD_HOURS } from "@/lib/lead-scoring";

export interface AutomationSettingsState {
  staleLeadHours: number;
  enableAiCopilot: boolean;
  enableEmailAlerts: boolean;
  nowMs: number;
  hydrated: boolean;
}

const STORAGE_KEY = "propflow_general_settings";

function readStoredAutomationSettings(): {
  staleLeadHours: number;
  enableAiCopilot: boolean;
  enableEmailAlerts: boolean;
} {
  if (typeof window === "undefined") {
    return {
      staleLeadHours: DEFAULT_STALE_LEAD_HOURS,
      enableAiCopilot: true,
      enableEmailAlerts: true,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        staleLeadHours: DEFAULT_STALE_LEAD_HOURS,
        enableAiCopilot: true,
        enableEmailAlerts: true,
      };
    }
    const parsed = JSON.parse(raw) as {
      staleLeadHours?: number | string;
      enableAiCopilot?: boolean;
      enableEmailAlerts?: boolean;
    };
    const parsedHours = Number(parsed.staleLeadHours);
    return {
      staleLeadHours:
        Number.isFinite(parsedHours) && parsedHours > 0
          ? parsedHours
          : DEFAULT_STALE_LEAD_HOURS,
      enableAiCopilot:
        parsed.enableAiCopilot !== undefined
          ? Boolean(parsed.enableAiCopilot)
          : true,
      enableEmailAlerts:
        parsed.enableEmailAlerts !== undefined
          ? Boolean(parsed.enableEmailAlerts)
          : true,
    };
  } catch {
    return {
      staleLeadHours: DEFAULT_STALE_LEAD_HOURS,
      enableAiCopilot: true,
      enableEmailAlerts: true,
    };
  }
}

/**
 * Hydration-safe hook that subscribes to saved automation settings in localStorage
 * and tracks current wall-clock time for overdue lead SLA calculations.
 */
export function useAutomationSettings(): AutomationSettingsState {
  const [state, setState] = React.useState<AutomationSettingsState>({
    staleLeadHours: DEFAULT_STALE_LEAD_HOURS,
    enableAiCopilot: true,
    enableEmailAlerts: true,
    nowMs: 0,
    hydrated: false,
  });

  React.useEffect(() => {
    const sync = () => {
      const settings = readStoredAutomationSettings();
      setState({
        ...settings,
        nowMs: Date.now(),
        hydrated: true,
      });
    };

    sync();
    const interval = window.setInterval(sync, 60_000);
    window.addEventListener("storage", sync);
    window.addEventListener("propflow-settings-updated", sync);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", sync);
      window.removeEventListener("propflow-settings-updated", sync);
    };
  }, []);

  return state;
}

