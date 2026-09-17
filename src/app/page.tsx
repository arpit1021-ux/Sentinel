"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { CircuitBreak, type AlertStatus } from "@/components/CircuitBreak";
import { RiskMeter } from "@/components/RiskMeter";
import { TacticChips } from "@/components/TacticChips";
import { TryLine } from "@/components/TryLine";
import { levelWord } from "@/lib/sentinel/risk";
import { BENIGN_CALL, SCAM_CALL } from "@/lib/sentinel/scripts";
import type { CallScript } from "@/lib/sentinel/types";
import { useDirector } from "@/lib/sentinel/useDirector";

const MODE_TEXT: Record<string, string> = {
  local: "detection: local",
  live: "detection: live (bedrock)",
  fallback: "detection: local (bedrock unavailable)",
};

export default function Home() {
  const director = useDirector();
  const [alertStatus, setAlertStatus] = useState<AlertStatus>("idle");

  async function sendAlert() {
    setAlertStatus("sending");
    try {
      const res = await fetch("/api/alert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tactics: director.ledger.map((e) => e.tactic) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlertStatus(data.status === "failed" ? "failed" : "sent");
    } catch {
      setAlertStatus("failed");
    }
  }

  function playAndResetAlert(script: CallScript) {
    setAlertStatus("idle");
    director.play(script);
  }

  const isPlaying = director.phase === "playing";

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <h1 className="wordmark">
            SENTINEL <em>console</em>
          </h1>
          <p className="tagline">The last thirty seconds before a scam succeeds.</p>
        </div>
        <div className="status-readout" data-mode={director.mode ?? undefined}>
          <span className="dot" aria-hidden="true" />
          {director.mode ? MODE_TEXT[director.mode] : "detection: idle"}
        </div>
      </div>

      <div className="controls">
        <Button variant="accent" onClick={() => playAndResetAlert(SCAM_CALL)} disabled={isPlaying}>
          Play scam call
        </Button>
        <Button onClick={() => playAndResetAlert(BENIGN_CALL)} disabled={isPlaying}>
          Play benign call
        </Button>
        <Button onClick={director.reset} disabled={director.phase === "idle"}>
          Reset
        </Button>
      </div>

      <div className="workspace">
        <div className="panel">
          <div className="panel-head">
            <span className="label">Live transcript</span>
          </div>
          <div className="transcript">
            {director.lines.length === 0 ? (
              <p className="empty-state">Press “Play scam call” or “Play benign call” above to start.</p>
            ) : (
              director.lines.map((line, i) => (
                <div className={`line ${line.speaker}`} key={i}>
                  <span className="who">{line.speaker === "caller" ? "Caller" : "You"}</span>
                  <span>{line.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rail">
          <div className="rail-section">
            <div className="panel-head">
              <span className="label">Risk</span>
            </div>
            <div className="rail-body">
              <RiskMeter risk={director.risk} level={director.level} word={levelWord(director.level)} />
            </div>
          </div>

          <div className="rail-section">
            <div className="panel-head">
              <span className="label">Tactics detected</span>
            </div>
            <div className="rail-body">
              <TacticChips ledger={director.ledger} />
            </div>
          </div>

          <div className="rail-section">
            <div className="panel-head">
              <span className="label">Test a line</span>
            </div>
            <div className="rail-body">
              <TryLine />
            </div>
          </div>
        </div>
      </div>

      {director.phase === "intervened" && (
        <CircuitBreak
          ledger={director.ledger}
          onDismiss={director.reset}
          onAlert={sendAlert}
          alertStatus={alertStatus}
        />
      )}
    </div>
  );
}
