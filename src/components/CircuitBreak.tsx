import { Button } from "./Button";
import { tacticById } from "@/lib/sentinel/taxonomy";
import type { EvidenceEntry } from "@/lib/sentinel/types";

export type AlertStatus = "idle" | "sending" | "sent" | "failed";

export function CircuitBreak({
  ledger,
  onDismiss,
  onAlert,
  alertStatus,
}: {
  ledger: EvidenceEntry[];
  onDismiss: () => void;
  onAlert: () => void;
  alertStatus: AlertStatus;
}) {
  const strongest = [...ledger].sort((a, b) => b.maxWeight - a.maxWeight)[0];
  const reason = strongest ? tacticById(strongest.tactic).meaning : "Multiple manipulation tactics detected.";

  return (
    <div className="breaker-overlay" role="alertdialog" aria-live="assertive" aria-label="Scam intervention">
      <div className="breaker-card">
        <span className="label">Circuit breaker</span>
        <h2>Stop. Do not send money or share codes.</h2>
        <p>This call matches the pattern of a scam in progress.</p>
        <p className="reason">{reason}</p>

        <div className="breaker-actions">
          <Button
            variant="danger"
            onClick={onAlert}
            loading={alertStatus === "sending"}
            disabled={alertStatus === "sent"}
          >
            {alertStatus === "sent" ? "Trusted contact notified" : "Alert my trusted contact"}
          </Button>
          <Button onClick={onDismiss}>Dismiss</Button>
        </div>

        {alertStatus === "failed" && (
          <p className="alert-error">Alert didn't go through. Try again, or call them directly.</p>
        )}
      </div>
    </div>
  );
}
