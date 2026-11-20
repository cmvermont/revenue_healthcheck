"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { fmt } from "@/lib/format";
import { healthOfScore, type ModuleId } from "@/lib/engine";
import { useData, type Mode } from "./DataProvider";
import { ScoreChip, TONE_TEXT } from "./ui";

export const CHECK_ROUTES: { href: string; label: string; module?: ModuleId }[] = [
  { href: "/summary", label: "Summary" },
  { href: "/pipeline", label: "Pipeline", module: "pipeline" },
  { href: "/forecast", label: "Forecast", module: "forecast" },
  { href: "/unit-economics", label: "Unit economics", module: "unitEconomics" },
  { href: "/funnel", label: "Funnel", module: "funnel" },
  { href: "/inputs", label: "Your numbers" },
];

const MODES: { id: Mode; label: string }[] = [
  { id: "example", label: "Example company" },
  { id: "yours", label: "Your numbers" },
];

/** The head of every results page: which numbers are showing, the overall score, and a tab for each check. */
export function CheckHeader() {
  const { mode, setMode, data, result } = useData();
  const pathname = usePathname();
  const facts = [data.stage, data.arr > 0 ? `${fmt(data.arr, "usdShort")} ARR` : null, data.salesTeamSize > 0 ? `${fmt(data.salesTeamSize, "int")} in sales` : null].filter(Boolean);

  return (
    <header className="page-head">
      <p className="num text-xs uppercase tracking-widest text-ink-3">{mode === "example" ? "Example company · illustrative figures" : "Your numbers · kept in this browser"}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Which numbers to score">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              mode === m.id ? "border-accent-strong bg-accent-strong text-white" : "border-rule bg-sheet hover:border-accent hover:text-accent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
        {data.company.trim() || "Your company"} scores <span className={TONE_TEXT[healthOfScore(result.overall)]}>{result.overall}</span> out of 100.
      </h1>
      <p className="num mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
        {facts.length > 0 && <span>{facts.join(" · ")}</span>}
        <ScoreChip score={result.overall} />
      </p>
      <nav className="mt-6 flex flex-wrap gap-x-1 gap-y-2 border-b border-rule" aria-label="Checks">
        {CHECK_ROUTES.map((t) => {
          const on = pathname === t.href;
          const s = t.module ? result.modules[t.module].score : undefined;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`-mb-px flex items-baseline gap-2 border-b-2 px-3 py-2 text-sm font-medium ${on ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-accent"}`}
            >
              {t.label}
              {s !== undefined && <span className={`num font-mono text-xs ${TONE_TEXT[healthOfScore(s)]}`}>{s}</span>}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
