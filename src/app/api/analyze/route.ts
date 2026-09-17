import { NextRequest, NextResponse } from "next/server";
import { analyzeLine } from "@/lib/sentinel/analyzer";
import type { TranscriptLine } from "@/lib/sentinel/types";

/**
 * Today this just wraps the local rule-based analyzer so the console has one
 * network seam to swap tomorrow: point this route at Amazon Bedrock (Nova
 * Lite) and validate its output against the same closed tactic taxonomy
 * before returning it, so the client never has to change.
 */
export async function POST(req: NextRequest) {
  const line = (await req.json()) as TranscriptLine;
  const hits = analyzeLine(line);
  return NextResponse.json({ hits, mode: "local" });
}
