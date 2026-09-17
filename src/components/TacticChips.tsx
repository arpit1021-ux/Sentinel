import { tacticById } from "@/lib/sentinel/taxonomy";
import type { EvidenceEntry } from "@/lib/sentinel/types";

export function TacticChips({ ledger }: { ledger: EvidenceEntry[] }) {
  if (ledger.length === 0) {
    return <p className="empty">No tactics detected yet.</p>;
  }
  return (
    <div className="chips">
      {ledger.map((e) => {
        const t = tacticById(e.tactic);
        const color = t.axis === "extraction" ? "var(--critical)" : "var(--watch)";
        return (
          <span className="chip" key={e.tactic} title={t.meaning}>
            <span className="dot" style={{ background: color }} />
            {t.short}
            {e.sightings > 1 ? ` ×${e.sightings}` : ""}
          </span>
        );
      })}
    </div>
  );
}
