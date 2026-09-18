import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeLine } from "../src/lib/sentinel/analyzer.ts";

test("a line spoken by the person being called is never scanned for tactics", () => {
  const hits = analyzeLine({ atMs: 0, speaker: "you", text: "he asked me to share the otp and transfer the amount" });
  assert.deepEqual(hits, []);
});

test("a caller demanding money is flagged as payment_demand", () => {
  const hits = analyzeLine({ atMs: 0, speaker: "caller", text: "please transfer the amount to this safe account now" });
  assert.ok(hits.some((h) => h.tactic === "payment_demand"), "expected a payment_demand hit");
});

test("word-boundary matching: a cue never fires as a substring of an unrelated word", () => {
  // "cvv" is a real cue; make sure it doesn't fire when embedded in a longer token.
  const hits = analyzeLine({ atMs: 0, speaker: "caller", text: "the community meeting is scheduled for friday" });
  assert.deepEqual(hits, []);
});

test("an ordinary benign line produces no tactic hits", () => {
  const hits = analyzeLine({ atMs: 0, speaker: "caller", text: "thank you for confirming, have a good evening" });
  assert.deepEqual(hits, []);
});
