export type Speaker = "caller" | "you";

export type TacticId =
  | "urgency"
  | "authority"
  | "secrecy"
  | "isolation"
  | "credential_request"
  | "payment_demand";

export type RiskLevel = "calm" | "watch" | "warning" | "critical";

export interface TranscriptLine {
  atMs: number;
  speaker: Speaker;
  text: string;
}

export interface TacticHit {
  tactic: TacticId;
  phrase: string;
  weight: number;
}

export interface EvidenceEntry {
  tactic: TacticId;
  maxWeight: number;
  sightings: number;
  phrase: string;
}

export interface CallScript {
  id: string;
  label: string;
  groundTruth: "scam" | "benign";
  lines: TranscriptLine[];
}
