"use client";

/**
 * VoicePrompt Studio - Multimodal prompt playground
 * Record voice → Add reference/tone → Generate structured content script via Gemini
 */

import { useState } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import PromptForm from "@/components/PromptForm";

export default function VoicePromptStudioPage() {
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, improve: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, improve }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedOutput(data.text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            VoicePrompt Studio
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Record your idea, add context, and generate a structured content script
          </p>
        </header>

        {/* Top section: Voice recorder, reference, tone */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
            Input
          </h2>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Voice idea
            </label>
            <VoiceRecorder onTranscript={setVoiceTranscript} disabled={isLoading} />
            {voiceTranscript && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                <span className="font-medium">Transcript: </span>
                {voiceTranscript}
              </div>
            )}
          </div>

          <PromptForm voiceTranscript={voiceTranscript} onGenerate={handleGenerate} />
        </section>

        {/* Middle: Loading indicator */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
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
            <span>Generating script...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Bottom section: Generated output */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
            Generated script
          </h2>
          <div className="min-h-[200px] rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200">
            {generatedOutput ? (
              <pre className="whitespace-pre-wrap break-words">
                {generatedOutput}
              </pre>
            ) : (
              <p className="text-slate-500 dark:text-slate-500">
                Your generated script will appear here. Record a voice idea and
                click Generate Script.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
