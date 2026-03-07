/**
 * API route for generating content scripts via Gemini
 * POST /api/generate
 * Body: { prompt: string, improve?: boolean }
 */

import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, improve = false } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    let finalPrompt = prompt;

    // If "Improve Prompt" was clicked, first rewrite the prompt for better quality
    if (improve) {
      const improvePrompt = `Rewrite this prompt to produce a higher quality, more engaging script. Keep the same structure and intent but make it more effective. Return only the improved prompt, nothing else.

Original prompt:
${prompt}`;

      finalPrompt = await generateContent(improvePrompt);
      if (!finalPrompt.trim()) {
        return NextResponse.json(
          { error: "Failed to improve prompt" },
          { status: 500 }
        );
      }
    }

    const generatedText = await generateContent(finalPrompt);

    return NextResponse.json({
      text: generatedText,
      improvedPrompt: improve ? finalPrompt : undefined,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
