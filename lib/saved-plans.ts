/**
 * Client-side saved storyboard plans with versioning (localStorage)
 */

import type { ProductionChecklist } from "@/lib/ai-providers";
import type {
  ReferenceInspiration,
  ShootRecommendations,
  StoryboardScene,
} from "@/components/StoryboardViewer";

export interface PlanSnapshot {
  recommendations: ShootRecommendations | null;
  scenes: StoryboardScene[];
  script: string;
  fullScript: string;
  productionChecklist: ProductionChecklist | null;
  referenceInspiration?: ReferenceInspiration | null;
}

export interface PlanVersion {
  id: string;
  versionNumber: number;
  savedAt: number;
  note: string;
  plan: PlanSnapshot;
}

export interface SavedPlan {
  id: string;
  name: string;
  prompt: string;
  versions: PlanVersion[];
  createdAt: number;
}

const STORAGE_KEY = "voiceprompt-saved-plans";

function migrateLegacyPlan(raw: Record<string, unknown>): SavedPlan {
  if ("versions" in raw && Array.isArray(raw.versions)) {
    return raw as unknown as SavedPlan;
  }
  const plan = raw.plan as PlanSnapshot;
  return {
    id: raw.id as string,
    name: raw.name as string,
    prompt: raw.prompt as string,
    createdAt: (raw.savedAt as number) ?? Date.now(),
    versions: [
      {
        id: crypto.randomUUID(),
        versionNumber: 1,
        savedAt: (raw.savedAt as number) ?? Date.now(),
        note: "Initial",
        plan: plan ?? {},
      },
    ],
  };
}

export function getSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: Record<string, unknown>) =>
      "versions" in p ? (p as unknown as SavedPlan) : migrateLegacyPlan(p)
    );
  } catch {
    return [];
  }
}

export function getPlanById(id: string): SavedPlan | null {
  return getSavedPlans().find((p) => p.id === id) ?? null;
}

export function getLatestVersion(plan: SavedPlan): PlanVersion {
  const sorted = [...plan.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );
  return sorted[0];
}

export function savePlan(
  name: string,
  prompt: string,
  plan: PlanSnapshot
): SavedPlan {
  const version: PlanVersion = {
    id: crypto.randomUUID(),
    versionNumber: 1,
    savedAt: Date.now(),
    note: "Initial",
    plan,
  };
  const saved: SavedPlan = {
    id: crypto.randomUUID(),
    name,
    prompt,
    createdAt: Date.now(),
    versions: [version],
  };
  const plans = getSavedPlans();
  plans.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return saved;
}

export function saveNewVersion(
  planId: string,
  plan: PlanSnapshot,
  note: string
): PlanVersion | null {
  const plans = getSavedPlans();
  const idx = plans.findIndex((p) => p.id === planId);
  if (idx < 0) return null;

  const planObj = plans[idx];
  const nextNum =
    Math.max(...planObj.versions.map((v) => v.versionNumber), 0) + 1;

  const version: PlanVersion = {
    id: crypto.randomUUID(),
    versionNumber: nextNum,
    savedAt: Date.now(),
    note: note.trim() || `Version ${nextNum}`,
    plan,
  };

  planObj.versions.unshift(version);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  return version;
}

export function deleteSavedPlan(id: string): void {
  const plans = getSavedPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}
