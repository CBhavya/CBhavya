/**
 * API route for transcribing audio to text via Gemini
 * POST /api/transcribe
 * Body: FormData with 'audio' file (blob) and optional 'mimeType'
 */

import { NextResponse } from "next/server";
import { normalizeApiError } from "@/lib/error-utils";
import { transcribeAudio } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const mimeType = (formData.get("mimeType") as string) || "audio/webm";

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Convert blob to base64 for Gemini API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const transcript = await transcribeAudio(base64, mimeType);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcribe API error:", error);
    const message = normalizeApiError(error, "Failed to transcribe audio");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
