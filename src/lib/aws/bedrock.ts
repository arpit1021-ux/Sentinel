import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { TACTICS } from "@/lib/sentinel/taxonomy";
import type { TacticHit, TranscriptLine } from "@/lib/sentinel/types";

/**
 * Live analyzer: classifies one caller line against the same fixed taxonomy
 * the local rule-based analyzer uses. Never invoked unless SENTINEL_MODE=live
 * — see route.ts, which falls back to the local analyzer on any error so a
 * Bedrock outage or an unverified account never breaks the console.
 *
 * The model is never allowed to invent a tactic or a phrase: its output is
 * validated against the closed taxonomy and the original text before it is
 * trusted.
 */

let client: BedrockRuntimeClient | null = null;
function getClient(): BedrockRuntimeClient {
  if (!client) client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "ap-south-1" });
  return client;
}

const TACTIC_IDS = new Set<string>(TACTICS.map((t) => t.id));

function buildPrompt(text: string): string {
  const catalogue = TACTICS.map((t) => `- ${t.id}: ${t.label} — ${t.meaning}`).join("\n");
  return [
    "You are a scam-call tactic classifier. Classify ONLY the following line spoken by a phone caller.",
    "Use ONLY these tactic ids, never invent a new one:",
    catalogue,
    "",
    `Line: "${text}"`,
    "",
    "Reply with strict JSON only, no prose, in this exact shape:",
    `{"tactics":[{"id":"<tactic id from the list>","phrase":"<verbatim substring of the line>"}]}`,
    "If no tactic applies, reply {\"tactics\":[]}.",
  ].join("\n");
}

interface ModelTacticOut {
  id?: string;
  phrase?: string;
}

export async function analyzeLineWithBedrock(line: TranscriptLine): Promise<TacticHit[]> {
  if (line.speaker !== "caller") return [];

  const modelId = process.env.BEDROCK_MODEL_ID ?? "amazon.nova-lite-v1:0";
  const body = {
    messages: [{ role: "user", content: [{ text: buildPrompt(line.text) }] }],
    inferenceConfig: { maxTokens: 200, temperature: 0 },
  };

  const res = await getClient().send(
    new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  );

  const payload = JSON.parse(new TextDecoder().decode(res.body));
  const raw: string = payload?.output?.message?.content?.[0]?.text ?? "{}";

  let parsed: { tactics?: ModelTacticOut[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return []; // malformed output is treated as "nothing found", never guessed at
  }

  const lowerLine = line.text.toLowerCase();
  const hits: TacticHit[] = [];

  for (const t of parsed.tactics ?? []) {
    if (!t.id || !t.phrase) continue;
    if (!TACTIC_IDS.has(t.id)) continue; // invented tactic, reject
    if (!lowerLine.includes(t.phrase.toLowerCase())) continue; // non-verbatim, reject

    const tactic = TACTICS.find((tc) => tc.id === t.id)!;
    hits.push({ tactic: tactic.id, phrase: t.phrase, weight: tactic.severity });
  }

  return hits;
}
