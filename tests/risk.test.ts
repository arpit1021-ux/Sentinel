import { test } from "node:test";
import assert from "node:assert/strict";
import { checkControlCeilingInvariant, mergeHit, scoreEvidence, THRESHOLDS } from "../src/lib/sentinel/risk.ts";
import { TACTICS } from "../src/lib/sentinel/taxonomy.ts";
import type { EvidenceEntry, TacticId } from "../src/lib/sentinel/types.ts";

test("the central safety claim actually holds: no control-only combination reaches critical", () => {
  const result = checkControlCeilingInvariant();
  assert.equal(result.holds, true, `worst control-only score was ${result.worst}, expected below ${THRESHOLDS.critical}`);
});

test("an empty evidence ledger scores exactly zero", () => {
  assert.equal(scoreEvidence(new Map()), 0);
});

test("every control tactic at full severity, combined, still stays below critical", () => {
  const ledger = new Map<TacticId, EvidenceEntry>();
  for (const t of TACTICS.filter((t) => t.axis === "control")) {
    mergeHit(ledger, t.id, "test phrase", t.severity);
  }
  const score = scoreEvidence(ledger);
  assert.ok(score < THRESHOLDS.critical, `control-only score ${score} crossed critical`);
});

test("a payment demand, on top of control pressure, reaches critical", () => {
  const ledger = new Map<TacticId, EvidenceEntry>();
  mergeHit(ledger, "authority", "cbi", 0.55);
  mergeHit(ledger, "secrecy", "don't tell anyone", 0.6);
  mergeHit(ledger, "payment_demand", "transfer the amount", 0.92);
  const score = scoreEvidence(ledger);
  assert.ok(score >= THRESHOLDS.critical, `expected critical, got ${score}`);
});
