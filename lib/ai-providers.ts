/**
 * Unified AI provider abstraction
 * Switch between Gemini, OpenAI (GPT), and Anthropic (Claude) to avoid quota limits
 */

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProvider = "gemini" | "openai" | "anthropic";

// Gemini 3.1 Pro first (for "Best use of Gemini 3.1" hackathon prize), fallbacks for quota
const GEMINI_MODELS = ["gemini-3.1-pro-preview", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"] as const;

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate_limit") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand")
  );
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

/** Check if a provider is configured */
export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

/** Get list of available providers */
export function getAvailableProviders(): AIProvider[] {
  return (["gemini", "openai", "anthropic"] as const).filter(isProviderAvailable);
}

/**
 * Generate text content - routes to selected provider
 */
export async function generateContent(
  provider: AIProvider,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "gemini": {
      const ai = getGeminiClient();
      let lastErr: unknown;
      for (const model of GEMINI_MODELS) {
        try {
          const res = await ai.models.generateContent({ model, contents: prompt });
          return res.text ?? "";
        } catch (err) {
          lastErr = err;
          if (isRetryableError(err)) continue;
          throw err;
        }
      }
      throw lastErr;
    }
    case "openai": {
      const openai = getOpenAIClient();
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0]?.message?.content ?? "";
    }
    case "anthropic": {
      const anthropic = getAnthropicClient();
      const res = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = res.content.find((b) => b.type === "text");
      return textBlock && "text" in textBlock ? textBlock.text : "";
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Generate JSON-formatted content - routes to selected provider
 */
export async function generateJSON(
  provider: AIProvider,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "gemini": {
      const ai = getGeminiClient();
      let lastErr: unknown;
      for (const model of GEMINI_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });
          return res.text ?? "";
        } catch (err) {
          lastErr = err;
          if (isRetryableError(err)) continue;
          throw err;
        }
      }
      throw lastErr;
    }
    case "openai": {
      const openai = getOpenAIClient();
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      return res.choices[0]?.message?.content ?? "{}";
    }
    case "anthropic": {
      const anthropic = getAnthropicClient();
      const res = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nRespond with valid JSON only, no other text.`,
          },
        ],
      });
      const textBlock = res.content.find((b) => b.type === "text");
      const text = textBlock && "text" in textBlock ? textBlock.text : "";
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return match ? match[0] : "{}";
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/** Shoot recommendations structure */
export interface ShootRecommendations {
  tone: string;
  style: string;
  lighting: string;
  pacing: string;
  equipment: string;
  locationTips: string;
  otherNotes: string;
}

/** Reference inspiration - trending examples and breakdown for better planning */
export interface ReferenceInspiration {
  references: Array<{
    name: string;
    type: string;
    whyItWorks: string;
    keyElements: string[];
    searchHint?: string;
  }>;
  trendSummary: string;
  breakdown: string;
}

/** Production checklist - props, people, permissions, safety, etc. */
export interface ProductionChecklist {
  props: string[];
  peopleRequired: string[];
  permissions: string[];
  safety: string[];
  scheduleNotes?: string;
  weatherNotes?: string;
  budgetNotes?: string;
}

/** Scene structure for shoot plan */
export interface SceneInput {
  sceneNumber: number;
  shotType: string;
  cameraAngle: string;
  action: string;
  dialogue: string;
  notes: string;
  description?: string;
}

/**
 * Generate shoot recommendations - uses selected provider
 */
export async function generateShootRecommendations(
  provider: AIProvider,
  prompt: string
): Promise<ShootRecommendations> {
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

  const text = await generateJSON(provider, recPrompt);
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

/**
 * Generate shoot-plan scenes - uses selected provider
 */
export async function generateStoryboardScenes(
  provider: AIProvider,
  prompt: string
): Promise<SceneInput[]> {
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

  const text = await generateJSON(provider, scenePrompt);
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
    if (Array.isArray(parsed)) return parsed.map(parseScene);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]).map(parseScene);
  }
  return [];
}

/**
 * Generate production checklist - props, people, permissions, safety, etc.
 */
export async function generateProductionChecklist(
  provider: AIProvider,
  prompt: string,
  scenes: SceneInput[]
): Promise<ProductionChecklist> {
  const sceneSummary = scenes
    .map(
      (s) =>
        `Scene ${s.sceneNumber}: ${s.shotType}, ${s.cameraAngle}. ${s.action}. ${s.notes || ""}`
    )
    .join("\n");

  const checklistPrompt = `You are a production coordinator. Based on this shoot idea and shot plan, create a comprehensive production checklist.

SHOOT IDEA:
${prompt}

SHOT PLAN:
${sceneSummary}

Return ONLY valid JSON (no other text):
{
  "props": ["list of physical props/items needed on set - products, furniture, wardrobe, etc."],
  "peopleRequired": ["cast roles", "crew roles", "talent", "extras - be specific"],
  "permissions": ["filming permits", "location permits", "talent release forms", "music rights", "property releases", "any legal/administrative requirements"],
  "safety": ["trip hazards", "electrical safety", "first aid", "stunt/action precautions", "weather hazards", "COVID/protocol if relevant"],
  "scheduleNotes": "Call time suggestions, setup time, wrap time - brief note",
  "weatherNotes": "If outdoor or weather-dependent, note backup plans or considerations",
  "budgetNotes": "Key cost considerations - rentals, permits, talent, etc."
}

Be practical and thorough. Include everything a producer would need to prep for shoot day.`;

  const text = await generateJSON(provider, checklistPrompt);
  const ensureArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : typeof v === "string" && v ? [v] : [];

  try {
    const parsed = JSON.parse(text.trim());
    return {
      props: ensureArray(parsed.props),
      peopleRequired: ensureArray(parsed.peopleRequired),
      permissions: ensureArray(parsed.permissions),
      safety: ensureArray(parsed.safety),
      scheduleNotes: typeof parsed.scheduleNotes === "string" ? parsed.scheduleNotes : undefined,
      weatherNotes: typeof parsed.weatherNotes === "string" ? parsed.weatherNotes : undefined,
      budgetNotes: typeof parsed.budgetNotes === "string" ? parsed.budgetNotes : undefined,
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        props: ensureArray(parsed.props),
        peopleRequired: ensureArray(parsed.peopleRequired),
        permissions: ensureArray(parsed.permissions),
        safety: ensureArray(parsed.safety),
        scheduleNotes: typeof parsed.scheduleNotes === "string" ? parsed.scheduleNotes : undefined,
        weatherNotes: typeof parsed.weatherNotes === "string" ? parsed.weatherNotes : undefined,
        budgetNotes: typeof parsed.budgetNotes === "string" ? parsed.budgetNotes : undefined,
      };
    }
  }
  return {
    props: [],
    peopleRequired: [],
    permissions: [],
    safety: [],
  };
}

/**
 * Generate reference inspiration - trending examples and breakdown
 * Agentic: researches what's working in the space to inform planning
 */
export async function generateReferenceInspiration(
  provider: AIProvider,
  prompt: string
): Promise<ReferenceInspiration> {
  const refPrompt = `You are a creative strategist helping a content creator plan a shoot. Research and suggest trending references that match this idea.

SHOOT IDEA:
${prompt}

Act as if you've researched the space. Suggest 3-4 real or representative examples (ads, videos, campaigns) that are similar and currently effective. For each, explain why they work and what to borrow.

Return ONLY valid JSON (no other text):
{
  "references": [
    {
      "name": "Example name (e.g. Nike Training Club 60s spot)",
      "type": "Format and category (e.g. Fitness app ad, 60s, vertical)",
      "whyItWorks": "1-2 sentences on what makes it effective",
      "keyElements": ["hook in first 3s", "before/after transformation", "app UI reveal", "etc."],
      "searchHint": "Search query to find similar (e.g. Nike fitness app ad 2024)"
    }
  ],
  "trendSummary": "2-3 sentences on what's trending in this category right now — pacing, visuals, hooks, platforms",
  "breakdown": "Detailed breakdown: shot-by-shot patterns, pacing notes, emotional arc, CTA placement. Actionable for someone planning their own shoot."
}

Be specific and actionable. Help them plan like the best in the space.`;

  const text = await generateJSON(provider, refPrompt);
  const parseRef = (r: Record<string, unknown>) => ({
    name: (r.name as string) ?? "",
    type: (r.type as string) ?? "",
    whyItWorks: (r.whyItWorks as string) ?? "",
    keyElements: Array.isArray(r.keyElements) ? r.keyElements.filter((x): x is string => typeof x === "string") : [],
    searchHint: typeof r.searchHint === "string" ? r.searchHint : undefined,
  });

  try {
    const parsed = JSON.parse(text.trim());
    const refs = Array.isArray(parsed.references) ? parsed.references.map(parseRef) : [];
    return {
      references: refs,
      trendSummary: typeof parsed.trendSummary === "string" ? parsed.trendSummary : "",
      breakdown: typeof parsed.breakdown === "string" ? parsed.breakdown : "",
    };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const refs = Array.isArray(parsed.references) ? parsed.references.map(parseRef) : [];
      return {
        references: refs,
        trendSummary: typeof parsed.trendSummary === "string" ? parsed.trendSummary : "",
        breakdown: typeof parsed.breakdown === "string" ? parsed.breakdown : "",
      };
    }
  }
  return { references: [], trendSummary: "", breakdown: "" };
}
