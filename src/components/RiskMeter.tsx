import { THRESHOLDS } from "@/lib/sentinel/risk";
import type { RiskLevel } from "@/lib/sentinel/types";

const COLORS: Record<RiskLevel, string> = {
  calm: "var(--risk-calm)",
  watch: "var(--risk-watch)",
  warning: "var(--risk-warning)",
  critical: "var(--risk-critical)",
};

export function RiskMeter({ risk, level, word }: { risk: number; level: RiskLevel; word: string }) {
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - risk);
  const color = COLORS[level];

  return (
    <div className="meter">
      <div className="ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line-strong)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 150ms linear, stroke 200ms linear" }}
          />
        </svg>
        <div className="value mono">{Math.round(risk * 100)}</div>
      </div>
      <div className="readout">
        <p className="word" style={{ color }}>{word}</p>
        <p className="thresholds">
          watch {THRESHOLDS.watch.toFixed(2)} · warn {THRESHOLDS.warning.toFixed(2)} · critical {THRESHOLDS.critical.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
