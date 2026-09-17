"use client";

import { useState } from "react";
import { CircuitBreak } from "@/components/CircuitBreak";
import { RiskMeter } from "@/components/RiskMeter";
import { TacticChips } from "@/components/TacticChips";
import { levelWord } from "@/lib/sentinel/risk";
import { BENIGN_CALL, SCAM_CALL } from "@/lib/sentinel/scripts";
import { useDirector } from "@/lib/sentinel/useDirector";

export default function Home() {
  const director = useDirector();
  const [alertStatus, setAlertStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function sendAlert() {
    setAlertStatus("sending");
    try {
      await fetch("/api/alert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tactics: director.ledger.map((e) => e.tactic) }),
      });
    } finally {
      setAlertStatus("sent");
    }
  }

  function playAndResetAlert(script: typeof SCAM_CALL) {
    setAlertStatus("idle");
    director.play(script);
  }

  return (
    <div className="shell">
      <div className="header">
        <div>
          <h1>SENTINEL</h1>
          <div className="tagline">The last thirty seconds before a scam succeeds.</div>
        </div>
        <div className="controls">
          <button onClick={() => playAndResetAlert(SCAM_CALL)} disabled={director.phase === "playing"}>
            Play scam call
          </button>
          <button onClick={() => playAndResetAlert(BENIGN_CALL)} disabled={director.phase === "playing"}>
            Play benign call
          </button>
          <button onClick={director.reset}>Reset</button>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Live transcript</h2>
          <div className="transcript">
            {director.lines.length === 0 && (
              <p className="empty">Press "Play scam call" or "Play benign call" to start.</p>
            )}
            {director.lines.map((line, i) => (
              <div className={`line ${line.speaker}`} key={i}>
                <span className="who">{line.speaker === "caller" ? "Caller" : "You"}</span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="panel">
            <h2>Risk</h2>
            <RiskMeter risk={director.risk} level={director.level} word={levelWord(director.level)} />
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <h2>Tactics detected</h2>
            <TacticChips ledger={director.ledger} />
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
