"use client";

import { useState } from "react";
import { Button } from "./Button";
import { tacticById } from "@/lib/sentinel/taxonomy";
import type { TacticHit } from "@/lib/sentinel/types";

type Status = "idle" | "loading" | "error" | "done";

/**
 * A real feature, not a decoration: lets a judge (or you, mid-rehearsal)
 * type any sentence and see exactly which tactics the detector fires on —
 * the same endpoint the live console uses. Exercises every input state the
 * brief asks for: empty/disabled submit, focus, loading, error, and a
 * result that can legitimately be empty ("no tactics detected").
 */
export function TryLine() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [hits, setHits] = useState<TacticHit[]>([]);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ atMs: 0, speaker: "caller", text: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHits(data.hits ?? []);
      setStatus("done");
    } catch {
      setError("Couldn't reach the detector. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <form className="field" data-error={status === "error"} onSubmit={submit}>
      <div className="field-row">
        <input
          type="text"
          value={text}
          disabled={status === "loading"}
          placeholder='e.g. "share the OTP sent to your phone right now"'
          onChange={(e) => {
            setText(e.target.value);
            if (status !== "loading") setStatus("idle");
          }}
          aria-label="A phone line to test against the detector"
        />
        <Button type="submit" loading={status === "loading"} disabled={!text.trim()}>
          Test
        </Button>
      </div>

      {status === "error" && <p className="field-error">{error}</p>}

      {status === "done" && (
        <div className="field-result">
          {hits.length === 0 ? (
            <p className="field-hint">No tactics detected in that line.</p>
          ) : (
            <div className="chips">
              {hits.map((h, i) => {
                const t = tacticById(h.tactic);
                const color = t.axis === "extraction" ? "var(--risk-critical)" : "var(--risk-watch)";
                return (
                  <span className="chip" key={i} title={t.meaning}>
                    <span className="dot" style={{ background: color }} />
                    {t.short}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
