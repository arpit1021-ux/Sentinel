import { NextRequest, NextResponse } from "next/server";
import { analyzeLine } from "@/lib/sentinel/analyzer";
import type { TranscriptLine } from "@/lib/sentinel/types";

const LIVE = process.env.SENTINEL_MODE === "live";

/**
 * SENTINEL_MODE=live routes through Amazon Bedrock; anything else (including
 * unset) uses the local rule-based analyzer. A live-mode failure — network,
 * an unverified account, a quota — always falls back to the local analyzer
 * rather than surfacing an error, so a demo never dies on a flaky connection.
 */
export async function POST(req: NextRequest) {
  const line = (await req.json()) as TranscriptLine;

  if (LIVE) {
    try {
      const { analyzeLineWithBedrock } = await import("@/lib/aws/bedrock");
      const hits = await analyzeLineWithBedrock(line);
      return NextResponse.json({ hits, mode: "live" });
    } catch (err) {
      console.error("[analyze] Bedrock call failed, falling back to local:", err);
    }
  }

  const hits = analyzeLine(line);
  return NextResponse.json({ hits, mode: "local" });
}
