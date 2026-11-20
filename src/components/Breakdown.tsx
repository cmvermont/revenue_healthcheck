"use client";

import { fmt } from "@/lib/format";
import Link from "next/link";
import { BASIS_LABEL, healthOfValue, METRICS, RANGE_SOURCES, SOURCES, type ModuleResult } from "@/lib/engine";
import { Term } from "./Term";
import { HealthChip, Sheet } from "./ui";

/** How a check's score is built: each input against its range, its score, its weight, and the points it adds. */
export function Breakdown({ m }: { m: ModuleResult }) {
  const total = m.parts.reduce((a, p) => a + p.points, 0);
  return (
    <Sheet className="overflow-x-auto">
      <h3 className="text-xl font-bold">How the score is built</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">
        Each <Term id="inputScore" label="input score" /> places the value on its <Term id="benchmarkRange" label="benchmark range" />. The weights add to
        100%, and the points add to the <Term id="checkScore" label="check score" />.
      </p>
      <table className="num mt-4 w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-ink text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
            <th className="py-2 font-medium">Input</th>
            <th className="py-2 text-right font-medium">Value</th>
            <th className="py-2 text-right font-medium">Poor</th>
            <th className="py-2 text-right font-medium">Good</th>
            <th className="py-2 text-right font-medium">Best</th>
            <th className="py-2 text-right font-medium">Score</th>
            <th className="py-2 text-right font-medium">Weight</th>
            <th className="py-2 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {m.parts.map((p) => {
            const meta = METRICS[p.id];
            const h = healthOfValue(p.value, p.band, p.lowerIsBetter);
            return (
              <tr key={p.id} className="border-b border-rule-soft">
                <td className="py-2.5 pr-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <Term id={meta.termId} label={meta.label} />
                    <HealthChip health={h} />
                  </span>
                </td>
                <td className="py-2.5 text-right font-medium">{fmt(p.value, meta.format)}</td>
                <td className="py-2.5 text-right text-ink-3">{fmt(p.band.poor, meta.format)}</td>
                <td className="py-2.5 text-right text-ink-3">{fmt(p.band.good, meta.format)}</td>
                <td className="py-2.5 text-right text-ink-3">{fmt(p.band.excellent, meta.format)}</td>
                <td className="py-2.5 text-right">{p.score.toFixed(1)}</td>
                <td className="py-2.5 text-right text-ink-2">{fmt(p.weight, "pct0")}</td>
                <td className="py-2.5 text-right">{p.points.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-ink font-semibold">
            <td className="py-2.5" colSpan={6}>
              Check score
            </td>
            <td className="py-2.5 text-right text-ink-2">100%</td>
            <td className="py-2.5 text-right">
              {total.toFixed(1)} → {m.score}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        Ranges:{" "}
        {m.parts.map((p, i) => {
          const r = RANGE_SOURCES[p.id];
          return (
            <span key={p.id}>
              {i > 0 && " · "}
              {METRICS[p.id].label} from {r.sources.map((s) => SOURCES[s].publisher).join("; ")} ({BASIS_LABEL[r.basis].toLowerCase()})
            </span>
          );
        })}
        .{" "}
        <Link href={`/methodology#range-${m.parts[0].id}`} className="text-accent underline underline-offset-4">
          How each range was set
        </Link>
      </p>
    </Sheet>
  );
}
