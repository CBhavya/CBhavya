"use client";

/**
 * PromptForm - Combines voice transcript, reference text, and tone into a structured prompt
 * Handles Generate Script and Improve Prompt actions
 */

import { useState } from "react";

const PROMPT_TEMPLATE = `You are a professional content creator.

Idea:
{voiceTranscript}

Reference material:
{referenceText}

Tone/style:
{toneInput}

Generate:
1. Title
2. Hook
3. Outline
4. Full script`;

interface PromptFormProps {
  voiceTranscript: string;
  onGenerate: (prompt: string, improve: boolean) => Promise<void>;
}

export default function PromptForm({
  voiceTranscript,
  onGenerate,
}: PromptFormProps) {
  const [referenceText, setReferenceText] = useState("");
  const [toneInput, setToneInput] = useState("");
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
      await onGenerate(prompt, improve);
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
          Reference text / article (optional)
        </label>
        <textarea
          id="reference"
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder="Paste reference material, article excerpts, or research..."
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
          placeholder="e.g. Professional, conversational, witty, educational..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleGenerate(false)}
          disabled={isGenerating || (!voiceTranscript.trim() && !referenceText.trim() && !toneInput.trim())}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Generate Script"}
        </button>
        <button
          type="button"
          onClick={() => handleGenerate(true)}
          disabled={isGenerating || (!voiceTranscript.trim() && !referenceText.trim() && !toneInput.trim())}
          className="rounded-lg border border-indigo-600 bg-white px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-indigo-500 dark:bg-transparent dark:hover:bg-indigo-950"
        >
          Improve Prompt & Regenerate
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
