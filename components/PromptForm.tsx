"use client";

/**
 * PromptForm - Combines voice transcript, reference text, and tone into a structured prompt
 * Handles Generate Script and Improve Prompt actions
 */

import { useState } from "react";

const PROMPT_TEMPLATE = `You are helping a content creator plan a shoot.

Idea:
{voiceTranscript}

Reference / mood board:
{referenceText}

Tone / style:
{toneInput}

Generate a shoot plan with 4 production-ready scenes.`;

export type AIProvider = "gemini" | "openai" | "anthropic";

const PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: "Gemini 3.1 Pro",
  openai: "GPT (OpenAI)",
  anthropic: "Claude (Anthropic)",
};

interface PromptFormProps {
  voiceTranscript: string;
  providers: AIProvider[];
  onGenerate: (
    prompt: string,
    improve: boolean,
    skipImages?: boolean,
    provider?: AIProvider
  ) => Promise<void>;
}

export default function PromptForm({
  voiceTranscript,
  providers,
  onGenerate,
}: PromptFormProps) {
  const [referenceText, setReferenceText] = useState("");
  const [toneInput, setToneInput] = useState("");
  const [provider, setProvider] = useState<AIProvider>(providers[0] ?? "gemini");
  const [skipImages, setSkipImages] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPrompt = () => {
    return PROMPT_TEMPLATE.replace("{voiceTranscript}", voiceTranscript || "(none)")
      .replace("{referenceText}", referenceText.trim() || "(none)")
      .replace("{toneInput}", toneInput.trim() || "(none)");
  };

  const handleGenerate = async (improve: boolean) => {
    const prompt = buildPrompt();
    if (!prompt.trim()) {
      setError("Please add at least an idea (record voice) or reference/tone.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await onGenerate(prompt, improve, skipImages, provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="reference"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Reference / mood board (optional)
        </label>
        <textarea
          id="reference"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="Paste reference material, similar videos, or inspiration..."
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="tone"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Tone / style (optional)
        </label>
        <input
          id="tone"
          type="text"
          value={toneInput}
          onChange={(e) => setToneInput(e.target.value)}
          placeholder="e.g. Cinematic, vlog-style, documentary, upbeat..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      {providers.length > 1 && (
        <div>
          <label
            htmlFor="provider"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            AI provider — switch if one hits quota
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {providers.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={skipImages}
          onChange={(e) => setSkipImages(e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Skip AI images (faster, works without image quota)
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleGenerate(false)}
          disabled={isGenerating || (!voiceTranscript.trim() && !referenceText.trim() && !toneInput.trim())}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating shoot plan..." : "Generate Shoot Plan"}
        </button>
        <button
          type="button"
          onClick={() => handleGenerate(true)}
          disabled={isGenerating || (!voiceTranscript.trim() && !referenceText.trim() && !toneInput.trim())}
          title="Refine vague ideas, add production detail, then regenerate"
          className="rounded-lg border border-indigo-600 bg-white px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-indigo-500 dark:bg-transparent dark:hover:bg-indigo-950"
        >
          Improve & Regenerate
        </button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Use <strong>Improve & Regenerate</strong> when your idea is vague, the
        first plan feels generic, or you want a stronger prompt — we&apos;ll
        refine it and show you what changed.
      </p>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
