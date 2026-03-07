/**
 * Gemini API client utilities for VoicePrompt Studio
 * Handles text generation and audio transcription via Google Gemini
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Get configured Gemini client
 * Requires GEMINI_API_KEY in environment variables
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate text content from a prompt using Gemini 1.5 Pro
 */
export async function generateContent(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: prompt,
  });
  return response.text ?? "";
}

/**
 * Transcribe audio to text using Gemini's audio understanding
 * Accepts base64-encoded audio data (MediaRecorder typically outputs webm)
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<string> {
  const ai = getGeminiClient();

  // Use inline data for audio - Gemini supports base64 inline audio
  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Transcribe this audio accurately. Return only the transcribed text, nothing else.",
          },
        ],
      },
    ],
  });

  return (response.text ?? "").trim();
}
