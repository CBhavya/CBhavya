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

// Gemini 3.1 Pro first (for "Best use of Gemini 3.1" hackathon prize), fallbacks for quota
const MODELS = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"] as const;

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand")
  );
}

/**
 * Generate text content from a prompt using Gemini
 * Falls back to gemini-2.5-flash-lite or gemini-2.0-flash if quota hit
 */
export async function generateContent(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text ?? "";
    } catch (err) {
      lastError = err;
      if (isRetryableError(err)) continue;
      throw err;
    }
  }
  throw lastError;
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
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
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
    } catch (err) {
      lastErr = err;
      if (isRetryableError(err)) continue;
      throw err;
    }
  }
  throw lastErr;
}

/** AI-recommended production details for content creators */
export interface ShootRecommendations {
  tone: string;
  style: string;
  lighting: string;
  pacing: string;
  equipment: string;
  locationTips: string;
  otherNotes: string;
}

/** Production scene for shoot planning */
export interface StoryboardScene {
  sceneNumber: number;
  shotType: string;
  cameraAngle: string;
  action: string;
  dialogue: string;
  notes: string;
  description?: string;
  imageBase64?: string;
  mimeType?: string;
}

/**
 * Generate a single image using Gemini 2.5 Flash Image
 */
export async function generateImage(
  prompt: string,
  aspectRatio: string = "16:9"
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["Image"],
      imageConfig: { aspectRatio },
    },
  });

  // Extract image from response - check candidates[0].content.parts for inlineData
  const candidates = response.candidates;
  if (!candidates?.[0]?.content?.parts) return null;

  for (const part of candidates[0].content.parts) {
    const inlineData = (part as { inlineData?: { data?: string; mimeType?: string } })
      .inlineData;
    if (inlineData?.data) {
      return {
        imageBase64: inlineData.data,
        mimeType: inlineData.mimeType ?? "image/png",
      };
    }
  }

  return null;
}

/**
 * Generate shoot-plan scenes from content idea
 * Production-focused: shot type, camera, action, dialogue, notes
 */
export async function generateStoryboardScenes(
  prompt: string
): Promise<
  Array<{
    sceneNumber: number;
    shotType: string;
    cameraAngle: string;
    action: string;
    dialogue: string;
    notes: string;
    description?: string;
  }>
> {
  const ai = getGeminiClient();

  const scenePrompt = `${prompt}

You are helping a content creator plan a shoot. Based on the above idea, generate exactly 4 production-ready scenes they can film.
Return ONLY a valid JSON array (no other text):
[
  {
    "sceneNumber": 1,
    "shotType": "Wide / Medium / Close-up / etc.",
    "cameraAngle": "Eye level / Low / High / Dutch angle / etc.",
    "action": "What happens in the shot - specific, filmable actions",
    "dialogue": "Spoken lines if any, or empty string",
    "notes": "Lighting, equipment, location, or practical shoot notes",
    "description": "Brief visual for reference - setting, mood, composition"
  },
  ...repeat for scenes 2, 3, 4
]

Make it practical for shoot day: clear shot types, actionable descriptions, useful production notes.`;

  let text = "";
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: scenePrompt,
        config: { responseMimeType: "application/json" },
      });
      text = response.text ?? "";
      break;
    } catch (err) {
      lastErr = err;
      if (isRetryableError(err)) continue;
      throw err;
    }
  }
  if (!text) throw lastErr;

  const parseScene = (s: Record<string, unknown>) => ({
    sceneNumber: (s.sceneNumber as number) ?? 0,
    shotType: (s.shotType as string) ?? "",
    cameraAngle: (s.cameraAngle as string) ?? "",
    action: (s.action as string) ?? "",
    dialogue: (s.dialogue as string) ?? "",
    notes: (s.notes as string) ?? "",
    description: (s.description as string) ?? "",
  });

  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      return parsed.map(parseScene);
    }
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.map(parseScene);
    }
  }

  return [];
}

/**
 * Generate recommended tone, style, and production details for a content idea
 */
export async function generateShootRecommendations(
  prompt: string
): Promise<ShootRecommendations> {
  const ai = getGeminiClient();

  const recPrompt = `${prompt}

You are advising a content creator who will shoot this. Based on the idea above, recommend production details they need.
Return ONLY valid JSON (no other text):
{
  "tone": "Recommended tone (e.g. warm and inviting, energetic, professional)",
  "style": "Visual/cinematic style (e.g. documentary, vlog, cinematic, minimal)",
  "lighting": "Lighting approach and mood",
  "pacing": "Pacing and rhythm (e.g. quick cuts, slow build)",
  "equipment": "Key equipment suggestions (camera, mic, lights)",
  "locationTips": "Location or set considerations",
  "otherNotes": "Any other critical production notes"
}`;

  let text = "";
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: recPrompt,
        config: { responseMimeType: "application/json" },
      });
      text = response.text ?? "";
      break;
    } catch (err) {
      lastErr = err;
      if (isRetryableError(err)) continue;
      throw err;
    }
  }
  if (!text) throw lastErr;

  try {
    const parsed = JSON.parse(text.trim());
    return {
      tone: parsed.tone ?? "",
      style: parsed.style ?? "",
      lighting: parsed.lighting ?? "",
      pacing: parsed.pacing ?? "",
      equipment: parsed.equipment ?? "",
      locationTips: parsed.locationTips ?? "",
      otherNotes: parsed.otherNotes ?? "",
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        tone: parsed.tone ?? "",
        style: parsed.style ?? "",
        lighting: parsed.lighting ?? "",
        pacing: parsed.pacing ?? "",
        equipment: parsed.equipment ?? "",
        locationTips: parsed.locationTips ?? "",
        otherNotes: parsed.otherNotes ?? "",
      };
    }
  }

  return {
    tone: "",
    style: "",
    lighting: "",
    pacing: "",
    equipment: "",
    locationTips: "",
    otherNotes: "",
  };
}
