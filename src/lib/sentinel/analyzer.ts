import { scanForTactics } from "./taxonomy.ts";
import type { TacticHit, TranscriptLine } from "./types.ts";

/**
 * Rule-based local analyzer. This is the seam: `/api/analyze` wraps this
 * today and can call Amazon Bedrock instead tomorrow without touching
 * anything upstream (the risk engine and UI only know about `TacticHit[]`).
 *
 * Only the caller's lines are scanned — the person being called describing
 * what they were asked ("he wanted my OTP") is a report, not an attack.
 */
export function analyzeLine(line: TranscriptLine): TacticHit[] {
  if (line.speaker !== "caller") return [];
  return scanForTactics(line.text).map((h) => ({
    tactic: h.tacticId,
    phrase: h.phrase,
    weight: h.weight,
  }));
}
