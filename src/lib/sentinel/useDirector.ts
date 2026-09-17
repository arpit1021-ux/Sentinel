"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advance, levelFor, mergeHit, scoreEvidence } from "./risk";
import type { CallScript, EvidenceEntry, RiskLevel, TacticHit, TacticId, TranscriptLine } from "./types";

export type AnalyzerMode = "local" | "live" | "fallback" | null;

/** Always goes through the server route, so SENTINEL_MODE=live (Bedrock)
 *  vs. local rule-based detection is a server-side switch the client never
 *  needs to know about. The reported mode reflects what the server actually
 *  did — including a live call that failed and fell back — not a static flag. */
async function analyze(line: TranscriptLine): Promise<{ hits: TacticHit[]; mode: AnalyzerMode }> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(line),
    });
    if (!res.ok) return { hits: [], mode: null };
    const data = await res.json();
    return { hits: data.hits ?? [], mode: data.mode ?? null };
  } catch {
    return { hits: [], mode: null };
  }
}

/** Demo lines arrive this many times faster than their authored timestamps,
 *  so a ~40s script plays out in ~10s. */
const PACE = 4;
const TICK_MS = 150;

export type Phase = "idle" | "playing" | "intervened" | "finished";

export interface DirectorState {
  phase: Phase;
  lines: TranscriptLine[];
  ledger: EvidenceEntry[];
  risk: number;
  level: RiskLevel;
  mode: AnalyzerMode;
  play: (script: CallScript) => void;
  reset: () => void;
}

export function useDirector(): DirectorState {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [risk, setRisk] = useState(0);
  const [mode, setMode] = useState<AnalyzerMode>(null);

  const ledgerRef = useRef(new Map<TacticId, EvidenceEntry>());
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTick = useRef(0);
  /** Bumped on every play/reset so an in-flight analyze() from a previous
   *  run can't merge stale evidence into the current one. */
  const generation = useRef(0);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    if (tickInterval.current) clearInterval(tickInterval.current);
    tickInterval.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    generation.current += 1;
    ledgerRef.current = new Map();
    setLedgerVersion((v) => v + 1);
    setLines([]);
    setRisk(0);
    setPhase("idle");
  }, [clearTimers]);

  const play = useCallback(
    (script: CallScript) => {
      reset();
      setPhase("playing");
      lastTick.current = performance.now();
      const myGeneration = generation.current;

      for (const line of script.lines) {
        const t = setTimeout(() => {
          setLines((prev) => [...prev, line]);
          analyze(line).then(({ hits, mode: reportedMode }) => {
            if (generation.current !== myGeneration) return; // stale, a reset happened
            for (const hit of hits) mergeHit(ledgerRef.current, hit.tactic, hit.phrase, hit.weight);
            setMode(reportedMode);
            setLedgerVersion((v) => v + 1);
          });
        }, line.atMs / PACE);
        timeouts.current.push(t);
      }

      const lastAt = script.lines[script.lines.length - 1]?.atMs ?? 0;
      const doneTimer = setTimeout(() => {
        setPhase((p) => (p === "intervened" ? p : "finished"));
      }, lastAt / PACE + 800);
      timeouts.current.push(doneTimer);

      tickInterval.current = setInterval(() => {
        const now = performance.now();
        const dt = now - lastTick.current;
        lastTick.current = now;
        const raw = scoreEvidence(ledgerRef.current);
        setRisk((prev) => {
          const next = advance(prev, raw, dt);
          if (levelFor(next) === "critical" && levelFor(prev) !== "critical") {
            setPhase("intervened");
            clearTimers();
          }
          return next;
        });
      }, TICK_MS);
    },
    [clearTimers, reset],
  );

  useEffect(() => clearTimers, [clearTimers]);

  // ledgerVersion's only job is to force this render so the array below
  // reflects the mutable ref; it is never read directly.
  void ledgerVersion;

  return {
    phase,
    lines,
    ledger: Array.from(ledgerRef.current.values()),
    risk,
    level: levelFor(risk),
    mode,
    play,
    reset,
  };
}
