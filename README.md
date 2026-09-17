# SENTINEL

**The last thirty seconds before a scam succeeds.**

A real-time scam-call console. It watches a conversation as it happens,
recognises manipulation tactics as they're spoken (fake authority, enforced
secrecy, being kept on the line, a demand for money or an OTP), shows a
plain-language reason instead of a bare score, and — when the pattern
completes — pulls in a trusted contact before money moves.

Built for **First Commit** (Bharat Builds Tour · WeMakeDevs × AWS), Sept 17–20.

## Why the risk score is shaped the way it is

Fear and authority tactics alone are capped below the "critical" threshold —
no amount of manufactured urgency, on its own, should trip the circuit
breaker. Only an actual demand for money or a credential (OTP/PIN/CVV) can
push the score into "critical". That's not a tuning choice, it's the product
claim: being pressured is worth a warning, an actual attempt to extract money
or a code is worth stopping the call. See `checkControlCeilingInvariant()` in
`src/lib/sentinel/risk.ts`.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
```

Click **Play scam call** to watch the tactic chips accumulate and the risk
meter climb to the circuit breaker. **Play benign call** is the false-positive
check — it should stay green.

## Where AWS fits

- `/api/analyze` currently wraps a local rule-based tactic detector. It's
  the seam for Amazon Bedrock — swap the body of this route to classify each
  transcript line against the same fixed taxonomy instead of regex.
- `/api/alert` is a stub for Amazon SNS — publishing to a topic that reaches
  the trusted contact by SMS.
- Amazon Polly is the planned voice for the spoken warning.

AWS SDK clients (`@aws-sdk/client-bedrock-runtime`, `-polly`, `-sns`) are
already dependencies; credentials live only in route handlers via
environment variables, never in the browser.

## Status (updated as the event runs)

- [x] Sept 18 — core detection loop + console UI working locally
- [ ] Amazon Bedrock wired into `/api/analyze`
- [ ] Amazon SNS wired into `/api/alert`
- [ ] Amazon Polly spoken warning
- [ ] Deployed to AWS
- [ ] 3-minute demo video
- [ ] Writeup submitted

## Module map

| Path | Responsibility |
|---|---|
| `src/lib/sentinel/types.ts` | Shared types |
| `src/lib/sentinel/taxonomy.ts` | The six tactics, their cues, word-boundary matching |
| `src/lib/sentinel/risk.ts` | Evidence ledger, scoring, thresholds, the control-ceiling invariant |
| `src/lib/sentinel/scripts.ts` | Demo call scripts (one scam, one benign) |
| `src/lib/sentinel/analyzer.ts` | Local rule-based analyzer |
| `src/lib/sentinel/useDirector.ts` | Playback + risk state machine (client hook) |
| `src/components/` | RiskMeter, TacticChips, CircuitBreak |
| `src/app/api/analyze`, `/api/alert` | Server routes — the AWS seam |
