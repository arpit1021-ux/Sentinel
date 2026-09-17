import type { TacticId } from "./types";

/**
 * The tactic vocabulary is fixed and human-authored on purpose: the console
 * names a tactic in plain language instead of showing a bare confidence
 * number, and a fixed list is what lets that sentence stay the same every
 * time the same trick is used.
 */
export interface Tactic {
  id: TacticId;
  label: string;
  short: string;
  meaning: string;
  cues: string[];
  /** 0..1, how much this tactic can weigh on its own. */
  severity: number;
  /** Extraction tactics are the only path to a "critical" verdict. */
  axis: "control" | "extraction";
}

export const TACTICS: Tactic[] = [
  {
    id: "urgency",
    label: "Manufactured urgency",
    short: "Urgency",
    meaning: "You're being rushed. Real institutions don't demand action in minutes.",
    cues: ["immediately", "right now", "within the next", "last chance", "final notice", "urgent", "hurry", "act now", "before it's too late", "jaldi", "abhi", "turant"],
    severity: 0.35,
    axis: "control",
  },
  {
    id: "authority",
    label: "Claimed authority",
    short: "Authority",
    meaning: "Someone is claiming police, tax, or government authority over the phone. Agencies don't open cases by call.",
    cues: ["cbi", "income tax department", "police station", "cyber cell", "inspector", "case number", "fir", "warrant", "rbi", "government account", "crime branch"],
    severity: 0.55,
    axis: "control",
  },
  {
    id: "secrecy",
    label: "Enforced secrecy",
    short: "Secrecy",
    meaning: "You're being told to hide this from family. That instruction only benefits whoever gave it.",
    cues: ["don't tell anyone", "do not tell anyone", "keep this confidential", "don't tell your family", "not even your family", "kisi ko mat batao", "ghar walon ko mat"],
    severity: 0.6,
    axis: "control",
  },
  {
    id: "isolation",
    label: "Kept on the line",
    short: "Isolation",
    meaning: "You're being kept on the call so you can't check with anyone else. Hanging up to verify is always allowed.",
    cues: ["stay on the line", "do not hang up", "don't hang up", "do not disconnect", "do not call your bank", "line par rahiye", "phone mat kaatna"],
    severity: 0.5,
    axis: "control",
  },
  {
    id: "credential_request",
    label: "Asking for your codes",
    short: "Codes",
    meaning: "You're being asked for an OTP, PIN or CVV. No legitimate call ever needs these read aloud.",
    cues: ["the otp", "share the otp", "one time password", "cvv", "upi pin", "enter your pin", "otp bata", "otp batao", "card number"],
    severity: 0.8,
    axis: "extraction",
  },
  {
    id: "payment_demand",
    label: "Demand for money",
    short: "Payment",
    meaning: "You're being told to move money right now. There's no such thing as a government 'safe account'.",
    cues: ["transfer the amount", "transfer the money", "send the money", "safe account", "government account", "processing fee", "clearance fee", "paisa transfer", "paisa bhejo", "gift card", "immediate transfer"],
    severity: 0.92,
    axis: "extraction",
  },
];

const BY_ID = new Map(TACTICS.map((t) => [t.id, t]));

export function tacticById(id: TacticId): Tactic {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`unknown tactic: ${id}`);
  return t;
}

const MATCHERS = TACTICS.flatMap((t) =>
  t.cues.map((cue) => ({ tactic: t, cue, re: new RegExp(`\\b${escapeRegExp(cue)}\\b`, "gi") })),
);

export interface RawHit {
  tacticId: TacticId;
  phrase: string;
  weight: number;
  index: number;
}

/**
 * Word-boundary cue matching. A substring matcher fires on "confirm" for the
 * cue "fir" — a false positive on ordinary conversation costs more trust than
 * a missed window, so every cue matches on boundaries only.
 */
export function scanForTactics(text: string): RawHit[] {
  const hits: RawHit[] = [];
  for (const { tactic, cue, re } of MATCHERS) {
    re.lastIndex = 0;
    const m = re.exec(text);
    if (!m) continue;
    const specificity = Math.min(1, 0.6 + cue.length / 30);
    hits.push({
      tacticId: tactic.id,
      phrase: m[0],
      weight: tactic.severity * specificity,
      index: m.index,
    });
  }
  return hits;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
