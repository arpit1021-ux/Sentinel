import type { RiskLevel } from "@/lib/sentinel/types";

const COLORS: Record<RiskLevel, string> = {
  calm: "var(--calm)",
  watch: "var(--watch)",
  warning: "var(--warning)",
  critical: "var(--critical)",
};

export function RiskMeter({ risk, level, word }: { risk: number; level: RiskLevel; word: string }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - risk);
  const color = COLORS[level];

  return (
    <div className="meter">
      <div className="ring">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 150ms linear, stroke 200ms linear" }}
          />
        </svg>
        <div className="value">{Math.round(risk * 100)}</div>
      </div>
      <div className="label" style={{ color }}>{word}</div>
    </div>
  );
}
