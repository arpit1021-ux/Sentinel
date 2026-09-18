import { TACTICS, tacticById } from "./taxonomy.ts";
import type { EvidenceEntry, RiskLevel, TacticId } from "./types.ts";

export const THRESHOLDS = { watch: 0.3, warning: 0.6, critical: 0.85 } as const;

/** Control tactics alone are capped below "critical" — no amount of fear or
 *  authority pressure, on its own, should trip the circuit breaker. Only an
 *  actual demand for money or codes can. */
const CONTROL_CEILING = 0.75;

const ESCALATE_ALPHA = 0.8;
const DECAY_PER_SEC = 0.12;

function isExtraction(id: TacticId): boolean {
  return tacticById(id).axis === "extraction";
}

/**
 * Fold the accumulated evidence ledger into one call-level score.
 *
 * Control tactics combine as a noisy-OR (so repeated fear tactics don't just
 * add up past 1) and are capped below the critical line. The extraction axis
 * (a real demand for money or codes) is combined on top the same way, which
 * is what lets a single clear demand cut straight to "critical" regardless of
 * how much control pressure came before it.
 */
export function scoreEvidence(ledger: Map<TacticId, EvidenceEntry>): number {
  let controlKeep = 1;
  let extractionKeep = 1;

  for (const e of ledger.values()) {
    const w = clamp01(e.maxWeight);
    if (isExtraction(e.tactic)) {
      extractionKeep *= 1 - w;
    } else {
      controlKeep *= 1 - w;
    }
  }

  const control = Math.min(CONTROL_CEILING, 1 - controlKeep);
  const extraction = 1 - extractionKeep;

  // Noisy-OR combine: extraction can push the score past the control ceiling.
  return clamp01(control + extraction * (1 - control));
}

export function mergeHit(
  ledger: Map<TacticId, EvidenceEntry>,
  tactic: TacticId,
  phrase: string,
  weight: number,
): void {
  const existing = ledger.get(tactic);
  if (!existing) {
    ledger.set(tactic, { tactic, maxWeight: weight, sightings: 1, phrase });
    return;
  }
  ledger.set(tactic, {
    tactic,
    sightings: existing.sightings + 1,
    maxWeight: Math.max(existing.maxWeight, weight),
    phrase: weight > existing.maxWeight ? phrase : existing.phrase,
  });
}

/** Escalate fast, forget slowly — a warning that arrives late is worthless,
 *  but a meter that collapses the instant a caller pauses would never be
 *  trusted during a demo. */
export function advance(prev: number, raw: number, dtMs: number): number {
  const target = clamp01(raw);
  if (target >= prev) return prev + (target - prev) * ESCALATE_ALPHA;
  const decayed = prev - DECAY_PER_SEC * (dtMs / 1000);
  return clamp01(Math.max(target, decayed));
}

export function levelFor(risk: number): RiskLevel {
  if (risk >= THRESHOLDS.critical) return "critical";
  if (risk >= THRESHOLDS.warning) return "warning";
  if (risk >= THRESHOLDS.watch) return "watch";
  return "calm";
}

export function levelWord(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "Stop — likely scam";
    case "warning":
      return "Likely scam";
    case "watch":
      return "Something is off";
    default:
      return "Nothing suspicious";
  }
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Exhaustive check of the central safety claim: no subset of control tactics,
 * at full severity, can reach "critical" on its own. Run over all 2^n subsets
 * rather than asserted in prose.
 */
export function checkControlCeilingInvariant(): { holds: boolean; worst: number } {
  const controlTactics = TACTICS.filter((t) => t.axis === "control");
  let worst = 0;
  for (let mask = 0; mask < 1 << controlTactics.length; mask++) {
    let keep = 1;
    for (let i = 0; i < controlTactics.length; i++) {
      if (mask & (1 << i)) keep *= 1 - controlTactics[i].severity;
    }
    worst = Math.max(worst, Math.min(CONTROL_CEILING, 1 - keep));
  }
  return { holds: worst < THRESHOLDS.critical, worst };
}
