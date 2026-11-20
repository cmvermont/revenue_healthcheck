import type { ReactNode } from "react";
import { HEALTH_LABEL, healthOfScore, type Health } from "@/lib/engine";

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-rule bg-sheet p-5 ${className}`}>{children}</div>;
}

/** The heading block at the top of each check, in the Workbench's step style. */
export function Step({ n, of = 4, title, aside, children }: { n: number; of?: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="num text-sm text-ink-3">
          {String(n).padStart(2, "0")} / {String(of).padStart(2, "0")}
        </span>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      <div className="max-w-3xl text-[0.9375rem] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export const TONE_TEXT: Record<Health, string> = { good: "text-good", warn: "text-warn", critical: "text-critical" };
export const TONE_FILL: Record<Health, string> = { good: "var(--good)", warn: "var(--warn)", critical: "var(--critical)" };
const TONE_CHIP: Record<Health, string> = {
  good: "border-good/40 bg-good-soft text-good",
  warn: "border-warn/40 bg-warn-soft text-warn",
  critical: "border-critical/40 bg-critical-soft text-critical",
};

export function HealthChip({ health, children }: { health: Health; children?: ReactNode }) {
  return (
    <span className={`num inline-flex items-baseline gap-1.5 rounded-sm border px-1.5 py-0.5 text-xs font-semibold ${TONE_CHIP[health]}`}>
      {children}
      <span className="text-[0.625rem] uppercase tracking-wider">{HEALTH_LABEL[health]}</span>
    </span>
  );
}

export function ScoreChip({ score }: { score: number }) {
  return <HealthChip health={healthOfScore(score)}>{score}</HealthChip>;
}

/** A labeled figure with a rule on its left, as in the Workbench's running results. */
export function Metric({ label, value, note, health }: { label: ReactNode; value: string; note?: ReactNode; health?: Health }) {
  return (
    <div className="border-l-2 border-ink pl-3">
      <div className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">{label}</div>
      <div className={`num mt-1 text-2xl font-medium ${health ? TONE_TEXT[health] : "text-ink"}`}>{value}</div>
      {note && <div className="mt-1 text-xs leading-snug text-ink-2">{note}</div>}
    </div>
  );
}

export function Meter({ pct, health, marker, label }: { pct: number; health: Health; marker?: number; label: string }) {
  const clamp = (n: number) => Math.max(0, Math.min(n, 100));
  return (
    <div className="relative h-2 rounded-full bg-rule-soft" role="img" aria-label={label}>
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${clamp(pct)}%`, background: TONE_FILL[health] }} />
      {marker !== undefined && <div className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-ink" style={{ left: `${clamp(marker)}%` }} />}
    </div>
  );
}

export function CardTitle({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold">{children}</h3>
      {note && <p className="mt-1 text-sm leading-relaxed text-ink-2">{note}</p>}
    </div>
  );
}

export function ScoreRing({ score, size = 168, stroke = 12 }: { score: number; size?: number; stroke?: number }) {
  const h = healthOfScore(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule-soft)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TONE_FILL[h]} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num font-bold leading-none" style={{ fontSize: Math.round(size * 0.28) }}>
          {score}
        </span>
        <span className={`mt-1 text-[0.6875rem] font-semibold uppercase tracking-widest ${TONE_TEXT[h]}`}>{HEALTH_LABEL[h]}</span>
      </div>
    </div>
  );
}
