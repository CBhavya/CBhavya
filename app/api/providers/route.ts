/**
 * GET /api/providers - Returns list of configured AI providers
 */

import { NextResponse } from "next/server";
import { getAvailableProviders } from "@/lib/ai-providers";

export async function GET() {
  const providers = getAvailableProviders();
  return NextResponse.json({ providers });
}
