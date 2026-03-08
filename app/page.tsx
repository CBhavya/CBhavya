"use client";

/**
 * VoicePrompt Studio - Multimodal prompt playground
 * Record voice → Add reference/tone → Generate visual storyboard via Gemini
 */

import { useCallback, useEffect, useState } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PromptForm, { type AIProvider } from "@/components/PromptForm";
import StoryboardViewer from "@/components/StoryboardViewer";
import type { ProductionChecklist } from "@/lib/ai-providers";
import type { ReferenceInspiration } from "@/components/StoryboardViewer";
import type {
  ShootRecommendations,
  StoryboardScene,
} from "@/components/StoryboardViewer";
import {
  deleteSavedPlan,
  getLatestVersion,
  getPlanById,
  getSavedPlans,
  saveNewVersion,
  savePlan,
  type SavedPlan,
} from "@/lib/saved-plans";
import {
  DEMO_CHECKLIST,
  DEMO_FULL_SCRIPT,
  DEMO_PROMPT,
  DEMO_RECOMMENDATIONS,
  DEMO_REFERENCE_INSPIRATION,
  DEMO_SCENES,
  DEMO_SCRIPT,
} from "@/lib/demo-plan";
import { parseApiErrorBody } from "@/lib/error-utils";

export default function VoicePromptStudioPage() {
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [providers, setProviders] = useState<AIProvider[]>(["gemini"]);
  const [recommendations, setRecommendations] =
    useState<ShootRecommendations | null>(null);
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>(
    []
  );
  const [scriptSummary, setScriptSummary] = useState("");
  const [fullScript, setFullScript] = useState("");
  const [productionChecklist, setProductionChecklist] =
    useState<ProductionChecklist | null>(null);
  const [referenceInspiration, setReferenceInspiration] =
    useState<ReferenceInspiration | null>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [savedPlansOpen, setSavedPlansOpen] = useState(false);
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const refreshSavedPlans = useCallback(() => {
    setSavedPlans(getSavedPlans());
  }, []);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((d) => d.providers?.length && setProviders(d.providers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSavedPlans();
  }, [refreshSavedPlans]);

  const handleLoadSavedPlan = (plan: SavedPlan, version?: { versionNumber: number }) => {
    const v = version
      ? plan.versions.find((x) => x.versionNumber === version.versionNumber)
      : getLatestVersion(plan);
    if (!v) return;
    setVoiceTranscript(plan.prompt);
    setRecommendations(v.plan.recommendations);
    setStoryboardScenes(v.plan.scenes);
    setScriptSummary(v.plan.script);
    setFullScript(v.plan.fullScript);
    setProductionChecklist(v.plan.productionChecklist);
    setReferenceInspiration(v.plan.referenceInspiration ?? null);
    setImprovedPrompt(null);
    setLoadedPlanId(plan.id);
    setLoadedVersionNumber(v.versionNumber);
    setSavedPlansOpen(false);
  };

  const handleLoadDemoPlan = () => {
    setVoiceTranscript(DEMO_PROMPT);
    setRecommendations(DEMO_RECOMMENDATIONS);
    setStoryboardScenes(DEMO_SCENES);
    setScriptSummary(DEMO_SCRIPT);
    setFullScript(DEMO_FULL_SCRIPT);
    setProductionChecklist(DEMO_CHECKLIST);
    setReferenceInspiration(DEMO_REFERENCE_INSPIRATION);
    setImprovedPrompt(null);
    setError(null);
    setFromCache(false);
    setLoadedPlanId(null);
    setLoadedVersionNumber(null);
  };

  const handleSavePlan = () => {
    if (!storyboardScenes.length || !voiceTranscript.trim()) return;

    const planSnapshot = {
      recommendations,
      scenes: storyboardScenes,
      script: scriptSummary,
      fullScript,
      productionChecklist,
      referenceInspiration,
    };

    if (loadedPlanId) {
      const note =
        window.prompt(
          "What changed? (e.g. Shooting outside - weather good, Prop X replaced)"
        )?.trim() ?? "";
      const v = saveNewVersion(loadedPlanId, planSnapshot, note);
      if (v) {
        setLoadedVersionNumber(v.versionNumber);
        refreshSavedPlans();
      }
    } else {
      const name =
        window.prompt("Name this plan (e.g. Fitness teaser, Product demo)")?.trim();
      if (!name) return;
      const saved = savePlan(name, voiceTranscript.trim(), planSnapshot);
      setLoadedPlanId(saved.id);
      setLoadedVersionNumber(1);
      refreshSavedPlans();
    }
  };

  const handleLoadVersion = (plan: SavedPlan, versionNumber: number) => {
    handleLoadSavedPlan(plan, { versionNumber });
  };

  const handleGenerate = async (
    prompt: string,
    improve: boolean,
    skipImages?: boolean,
    provider?: AIProvider,
    isRetry = false
  ) => {
    setIsLoading(true);
    setError(null);
    setRetryIn(null);

    const doFetch = async () => {
      const res = await fetch("/api/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          improve,
          skipImages: skipImages ?? false,
          provider: provider ?? "gemini",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiErrorBody(data) || "Generation failed");
      }
      return data;
    };

    try {
      let data;
      try {
        data = await doFetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        const isRetryable =
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand");
        const retryMatch = msg.match(/retry in (\d+)/i) ?? msg.match(/(\d+)s/);
        const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1], 10) + 2, 60) : msg.includes("503") ? 10 : 22;

        if (isRetryable && !isRetry) {
          for (let i = waitSec; i > 0; i--) {
            setRetryIn(i);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setRetryIn(null);
          data = await doFetch();
        } else {
          throw err;
        }
      }

      setRecommendations(data.recommendations ?? null);
      setStoryboardScenes(data.scenes || []);
      setScriptSummary(data.script || "");
      setFullScript(data.fullScript || "");
      setProductionChecklist(data.productionChecklist ?? null);
      setReferenceInspiration(data.referenceInspiration ?? null);
      setImprovedPrompt(data.improvedPrompt ?? null);
      setFromCache(!!data.fromCache);
      setLoadedPlanId(null);
      setLoadedVersionNumber(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      const isQuota = msg.includes("quota") || msg.includes("429");
      const is503 = msg.includes("503") || msg.includes("busy");
      setError(
        isQuota
          ? "API quota exceeded. Switch to GPT or Claude in the provider dropdown — add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local if needed."
          : is503
            ? "Service temporarily busy. Try again in a moment or switch providers."
            : msg.length > 300
              ? "Generation failed. Try switching providers or use Load demo plan."
              : msg
      );
      throw err;
    } finally {
      setIsLoading(false);
      setRetryIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header - hidden when printing */}
        <header className="mb-10 text-center print:hidden">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            VoicePrompt Studio
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Record your idea, add context — get a shoot plan with shot lists,
            camera angles, and production notes
          </p>
          <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
            Powered by Gemini 3.1 Pro
          </p>
        </header>

        {/* Top section: Voice recorder, reference, tone - hidden when printing */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 print:hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Input
            </h2>
            {savedPlans.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSavedPlansOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span>📋</span>
                  Saved plans ({savedPlans.length})
                </button>
                {savedPlansOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSavedPlansOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      {savedPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between gap-2 border-b border-slate-100 last:border-0 dark:border-slate-700"
                        >
                          <button
                            type="button"
                            onClick={() => handleLoadSavedPlan(plan)}
                            className="flex-1 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <span className="font-medium">{plan.name}</span>
                            <p className="truncate text-xs text-slate-500">
                              {plan.prompt.length > 50
                                ? `${plan.prompt.slice(0, 50)}…`
                                : plan.prompt}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedPlan(plan.id);
                              refreshSavedPlans();
                            }}
                            className="p-2 text-slate-400 hover:text-red-600"
                            aria-label="Delete"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Voice idea
            </label>
            <VoiceRecorder onTranscript={setVoiceTranscript} disabled={isLoading} />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="transcript-edit"
                  className="block text-xs font-medium text-slate-500 dark:text-slate-500"
                >
                  Transcript — edit if transcription is wrong
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVoiceTranscript(DEMO_PROMPT)}
                    className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                  >
                    Load demo idea
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoPlan}
                    className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                  >
                    Load demo plan (no API)
                  </button>
                </div>
              </div>
              <textarea
                id="transcript-edit"
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Record to transcribe, or type your idea here..."
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <PromptForm
            voiceTranscript={voiceTranscript}
            providers={providers}
            onGenerate={handleGenerate}
          />
        </section>

        {/* Middle: Loading indicator - hidden when printing */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-slate-600 print:hidden dark:text-slate-400">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>
              {retryIn
                ? `Rate limit reached. Retrying in ${retryIn}s...`
                : "Generating shoot plan..."}
            </span>
          </div>
        )}

        {/* Error display - hidden when printing */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 print:hidden dark:border-red-800 dark:bg-red-950/30">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={handleLoadDemoPlan}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Load demo plan (no API needed)
            </button>
          </div>
        )}

        {/* Bottom section: Visual storyboard */}
        <section
          id="shoot-plan-print"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Shoot plan
              </h2>
              {fromCache && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  From cache
                </span>
              )}
            </div>
            {storyboardScenes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {loadedPlanId && (() => {
                  const plan = getPlanById(loadedPlanId);
                  return plan && plan.versions.length > 1 ? (
                    <select
                      value={loadedVersionNumber ?? ""}
                      onChange={(e) =>
                        plan &&
                        handleLoadVersion(plan, parseInt(e.target.value, 10))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {[...plan.versions]
                        .sort((a, b) => b.versionNumber - a.versionNumber)
                        .map((v) => (
                          <option key={v.id} value={v.versionNumber}>
                            v{v.versionNumber}: {v.note}
                          </option>
                        ))}
                    </select>
                  ) : null;
                })()}
                <button
                  type="button"
                  onClick={handleSavePlan}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <span>💾</span>
                  {loadedPlanId ? "Save as new version" : "Save plan"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print shoot plan
              </button>
              </div>
            )}
          </div>
          <div className="min-h-[200px] print:min-h-0">
            {storyboardScenes.length > 0 ? (
              <>
                {improvedPrompt && (
                  <details className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      ✨ What we improved — refined prompt used for this plan
                    </summary>
                    <div className="border-t border-emerald-200 px-4 py-3 dark:border-emerald-800/50">
                      <p className="whitespace-pre-wrap text-sm text-emerald-900 dark:text-emerald-100">
                        {improvedPrompt}
                      </p>
                    </div>
                  </details>
                )}
                <StoryboardViewer
                  recommendations={recommendations}
                  scenes={storyboardScenes}
                  script={scriptSummary}
                  fullScript={fullScript}
                  productionChecklist={productionChecklist}
                  referenceInspiration={referenceInspiration}
                  editable={!!loadedPlanId}
                  onProductionChecklistChange={
                    loadedPlanId ? setProductionChecklist : undefined
                  }
                  onSceneNotesChange={
                    loadedPlanId
                      ? (sceneNumber, notes) =>
                          setStoryboardScenes((prev) =>
                            prev.map((s) =>
                              s.sceneNumber === sceneNumber
                                ? { ...s, notes }
                                : s
                            )
                          )
                      : undefined
                  }
                />
              </>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-500">
                Your shoot plan will appear here. Record a voice idea and click
                Generate Shoot Plan.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
