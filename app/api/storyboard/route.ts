/**
 * API route for generating shoot plans
 * POST /api/storyboard
 * Body: { prompt: string, improve?: boolean, skipImages?: boolean, provider?: "gemini"|"openai"|"anthropic", skipCache?: boolean }
 */

import { NextResponse } from "next/server";
import { normalizeApiError } from "@/lib/error-utils";
import * as storyboardCache from "@/lib/storyboard-cache";
import {
  generateContent,
  generateProductionChecklist,
  generateReferenceInspiration,
  generateShootRecommendations,
  generateStoryboardScenes,
  getAvailableProviders,
  type AIProvider,
} from "@/lib/ai-providers";
import { generateImage } from "@/lib/gemini";
import type { StoryboardScene } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      improve = false,
      skipImages = false,
      provider: requestedProvider = "gemini",
      skipCache = false,
    } = body;

    const available = getAvailableProviders();
    const provider: AIProvider = available.includes(requestedProvider)
      ? requestedProvider
      : available[0] ?? "gemini";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // Check cache (unless improve or skipCache - improved prompts are unique)
    if (!skipCache && !improve) {
      const cached = storyboardCache.get(
        prompt,
        improve,
        skipImages,
        provider
      );
      if (cached && typeof cached === "object" && "scenes" in cached) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    let finalPrompt = prompt;

    if (improve) {
      const improvePrompt = `You are helping a content creator refine their shoot idea. The prompt below is vague, messy, or could be stronger.

Rewrite it to be:
- More specific and actionable for shoot planning
- Clearer about tone, style, and visual intent
- Richer in production-relevant detail (lighting, pacing, shot variety)
- Better structured for generating a shot list

Keep the same core idea. Return ONLY the improved prompt, nothing else.

Original prompt:
${prompt}`;

      finalPrompt = await generateContent(provider, improvePrompt);
      if (!finalPrompt.trim()) {
        return NextResponse.json(
          { error: "Failed to improve prompt" },
          { status: 500 }
        );
      }
    }

    // Step 1: Generate recommendations and scenes in parallel (using selected provider)
    const [recommendations, scenes] = await Promise.all([
      generateShootRecommendations(provider, finalPrompt),
      generateStoryboardScenes(provider, finalPrompt),
    ]);
    if (scenes.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate storyboard scenes" },
        { status: 500 }
      );
    }

    // Step 2: Optionally generate image for each scene (skip if skipImages or on quota error)
    const storyboardScenes: StoryboardScene[] = [];
    const imagePrompt = (s: (typeof scenes)[0]) =>
      `${s.shotType} shot, ${s.cameraAngle}. ${s.action}. ${s.description || s.notes}`.trim();

    for (const scene of scenes) {
      let imageResult: { imageBase64: string; mimeType: string } | null = null;
      if (!skipImages && (scene.description || scene.notes)) {
        try {
          imageResult = await generateImage(imagePrompt(scene), "16:9");
        } catch (imgError) {
          console.warn("Image generation skipped for scene", scene.sceneNumber, imgError);
        }
      }
      storyboardScenes.push({
        ...scene,
        imageBase64: imageResult?.imageBase64,
        mimeType: imageResult?.mimeType ?? "image/png",
      });
    }

    // Step 3: Generate production summary, full script, checklist, and reference inspiration in parallel
    const [script, fullScript, productionChecklist, referenceInspiration] = await Promise.all([
      generateContent(
        provider,
        `Based on these shoot scenes, write a 2-3 sentence production summary (hook, key moments, call to action):\n\n${scenes
          .map((s) => `Scene ${s.sceneNumber} [${s.shotType}]: ${s.action}`)
          .join("\n")}`
      ),
      generateContent(
        provider,
        `Based on these shoot scenes, write a full production script that adjoins this shot plan. Use standard script format:

${scenes
  .map(
    (s) =>
      `Scene ${s.sceneNumber} [${s.shotType}, ${s.cameraAngle}]: ${s.action}${s.dialogue ? ` Dialogue: "${s.dialogue}"` : ""}`
  )
  .join("\n\n")}

Write a complete script with:
- Scene headings (e.g. INT. LOCATION - TIME)
- Action lines (what we see)
- Dialogue (in quotes, with character names if applicable)
- Brief direction notes where helpful

Format it clearly so it can be used on set alongside the shot list.`
      ),
      generateProductionChecklist(provider, finalPrompt, scenes),
      generateReferenceInspiration(provider, finalPrompt),
    ]);

    const response = {
      recommendations,
      scenes: storyboardScenes,
      script: script.trim(),
      fullScript: fullScript.trim(),
      productionChecklist,
      referenceInspiration,
      improvedPrompt: improve ? finalPrompt : undefined,
      provider,
    };

    // Cache result for non-improved requests
    if (!improve) {
      storyboardCache.set(prompt, improve, skipImages, provider, response);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Storyboard API error:", error);
    const message = normalizeApiError(error, "Failed to generate storyboard");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
