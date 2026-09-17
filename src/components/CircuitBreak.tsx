import { tacticById } from "@/lib/sentinel/taxonomy";
import type { EvidenceEntry } from "@/lib/sentinel/types";

export function CircuitBreak({
  ledger,
  onDismiss,
  onAlert,
  alertStatus,
}: {
  ledger: EvidenceEntry[];
  onDismiss: () => void;
  onAlert: () => void;
  alertStatus: "idle" | "sending" | "sent";
}) {
  const strongest = [...ledger].sort((a, b) => b.maxWeight - a.maxWeight)[0];
  const reason = strongest ? tacticById(strongest.tactic).meaning : "Multiple manipulation tactics detected.";

  return (
    <div className="breaker-overlay" role="alertdialog" aria-live="assertive">
      <div className="breaker-card">
        <h2>Stop. Do not send money or share codes.</h2>
        <p>This call matches the pattern of a scam in progress.</p>
        <p className="reason">{reason}</p>
        <div className="controls" style={{ justifyContent: "center", marginTop: 20 }}>
          <button onClick={onAlert} disabled={alertStatus !== "idle"}>
            {alertStatus === "idle" && "Alert my trusted contact"}
            {alertStatus === "sending" && "Sending…"}
            {alertStatus === "sent" && "Trusted contact notified"}
          </button>
          <button onClick={onDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
