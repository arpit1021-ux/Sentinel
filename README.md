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

- `/api/analyze` calls `analyzeLineWithBedrock` (Amazon Bedrock, Nova Lite)
  when `SENTINEL_MODE=live`; otherwise, and on any Bedrock error, it falls
  back to the local rule-based detector — a live outage never breaks the
  console mid-demo. The model classifies each caller line against the exact
  same fixed taxonomy the rules use, and its output is rejected if it
  invents a tactic id or a phrase that isn't a verbatim substring of the
  line — see `src/lib/aws/bedrock.ts`.
- `/api/alert` calls Amazon SNS (`sns:Publish` directly to a phone number,
  no topic) when `SENTINEL_MODE=live` and `ALERT_PHONE_NUMBER` is set;
  otherwise it just logs. See `src/lib/aws/sns.ts`.
- Amazon Polly (spoken warning) is not wired yet.

Nothing above runs by default — `SENTINEL_MODE` unset keeps everything
local/mock, and no AWS call happens without deliberately opting in.

### Running with real AWS credentials

No long-lived IAM access keys are used for this project. Local credentials
come from a browser-based `aws login` session, refreshed with:

```bash
eval "$(aws configure export-credentials --format env)"   # mints short-lived creds into this shell
SENTINEL_MODE=live npm run dev
```

For any real deployment, the plan is an IAM role scoped to exactly
`bedrock:InvokeModel`, `sns:Publish`, and (later) `polly:SynthesizeSpeech` —
not a user with static keys.

**Current blocker:** Bedrock `InvokeModel` on this account returns
`AccessDeniedException: Your account is currently being verified` — a
temporary AWS-side identity-verification hold, unrelated to the code. Live
mode is written and ready; it hasn't been exercised end-to-end yet because
of this.

## Status (updated as the event runs)

- [x] Sept 18 — core detection loop + console UI working locally
- [x] Sept 18 — Amazon Bedrock + SNS live paths written, gated behind `SENTINEL_MODE=live`, with local fallback
- [ ] Bedrock path exercised for real (blocked on account verification)
- [ ] SNS SMS delivery confirmed (India numbers need DLT registration — see `.env.local.example`)
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
| `src/lib/aws/bedrock.ts` | Live tactic classification via Bedrock, validated against the taxonomy |
| `src/lib/aws/sns.ts` | Trusted-contact SMS alert |
| `src/components/` | RiskMeter, TacticChips, CircuitBreak |
| `src/app/api/analyze`, `/api/alert` | Server routes — local/live switch on `SENTINEL_MODE` |
