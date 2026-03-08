"use client";

/**
 * VoiceRecorder - Records audio in browser using MediaRecorder API
 * Sends recorded audio to /api/transcribe for speech-to-text via Gemini
 */

import { useState, useRef, useCallback } from "react";
import { parseApiErrorBody } from "@/lib/error-utils";

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onTranscript,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to access microphone"
      );
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    // Wait for ondataavailable to fire
    await new Promise((resolve) => setTimeout(resolve, 100));

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (audioBlob.size === 0) {
      setError("No audio recorded");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("mimeType", "audio/webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(parseApiErrorBody(data) || "Transcription failed");
      }

      onTranscript(data.transcript || "");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to transcribe audio";
      setError(msg.length > 300 ? "Transcription failed. Try again or type your idea." : msg);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscript]);

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || isTranscribing}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
            isRecording
              ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isTranscribing ? (
            <span className="text-lg">⏳</span>
        ) : isRecording ? (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {isRecording
            ? "Recording... Click to stop"
            : isTranscribing
              ? "Transcribing..."
              : "Record your idea"}
        </span>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
