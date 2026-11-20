import React, { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts';
import { DEMO_DATA, DEFAULT_INPUT, BENCHMARKS } from './data.js';
import {
  computeAllScores, healthLabel, generateNarratives, inputToData,
} from './scoring.js';

// ─── Palette for charts (mirrors the CSS tokens) ──────────────────────────────
const C = {
  ink: '#1a1d1e',
  ink2: '#55595c',
  ink3: '#6e7275',
  rule: '#d0d0cd',
  ruleSoft: '#e4e4e2',
  accent: '#0c7d72',
  accentStrong: '#0a665d',
  series1: '#2a78d6',
  series2: '#eb6834',
  good: '#1f6b3a',
  warn: '#7a5600',
  critical: '#b3261e',
};
const TICK = { fill: C.ink3, fontSize: 12, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' };
const LABEL_TICK = { fill: C.ink2, fontSize: 13, fontFamily: '"Figtree Variable", system-ui, sans-serif' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) =>
  n == null ? 'n/a' : Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtPct = (n, decimals = 1) => n == null ? 'n/a' : `${(n * 100).toFixed(decimals)}%`;
const fmtM = (n) => {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  return a >= 1e6 ? `${sign}$${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${sign}$${(a / 1e3).toFixed(0)}K` : `${sign}$${a}`;
};

// Tone of a value against a poor / good / excellent benchmark.
function toneFor(value, b, higherBetter = true) {
  const v = parseFloat(value);
  if (higherBetter) {
    if (v < b.poor) return 'critical';
    if (v < b.good) return 'warn';
    return 'good';
  }
  if (v > b.poor) return 'critical';
  if (v > b.good) return 'warn';
  return 'good';
}
const TONE = {
  good: { label: 'Healthy', color: C.good, cls: 'bg-good-soft text-good' },
  warn: { label: 'Moderate', color: C.warn, cls: 'bg-warn-soft text-warn' },
  critical: { label: 'At risk', color: C.critical, cls: 'bg-critical-soft text-critical' },
};

// ─── Building blocks (same shapes as the Pricing Workbench) ──────────────────
function Sheet({ children, className = '' }) {
  return <div className={`rounded-md border border-rule bg-sheet p-5 ${className}`}>{children}</div>;
}

function Badge({ tone, children }) {
  return (
    <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider ${TONE[tone].cls}`}>
      {children}
    </span>
  );
}

function ScoreBadge({ score }) {
  const h = healthLabel(score);
  return (
    <span className={`num inline-flex items-baseline gap-1.5 rounded-sm border px-1.5 py-0.5 text-xs font-semibold ${h.bg} ${h.text} ${h.border}`}>
      {score}
      <span className="text-[0.625rem] uppercase tracking-wider">{h.label}</span>
    </span>
  );
}

function CardTitle({ children, note }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold">{children}</h3>
      {note && <p className="mt-1 text-sm leading-relaxed text-ink-2">{note}</p>}
    </div>
  );
}

function ScoreRing({ score, size = 168, strokeWidth = 12 }) {
  const h = healthLabel(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke={C.ruleSoft} strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke={h.color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} className="score-arc" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num font-bold leading-none" style={{ fontSize: `${Math.round(size * 0.28)}px` }}>{score}</span>
        <span className={`mt-1 text-[0.6875rem] font-semibold uppercase tracking-widest ${h.text}`}>{h.label}</span>
      </div>
    </div>
  );
}

function MeterBar({ pct, color, marker }) {
  return (
    <div className="relative h-2 rounded-full bg-rule-soft">
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(0, Math.min(pct, 100))}%`, background: color }} />
      {marker != null && (
        <div className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-ink" style={{ left: `${Math.min(marker, 99)}%` }} />
      )}
    </div>
  );
}

function MetricCard({ label, value, raw, benchmark, unit = '', higherBetter = true, description, benchFmt }) {
  const tone = benchmark ? toneFor(raw ?? value, benchmark, higherBetter) : null;
  const bf = benchFmt ?? ((v) => `${v}${unit}`);
  return (
    <Sheet>
      <div className="flex items-start justify-between gap-2">
        <div className="border-l-2 border-ink pl-3">
          <div className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">{label}</div>
          <div className="num mt-1 text-2xl font-medium" style={tone ? { color: TONE[tone].color } : undefined}>
            {value}{unit}
          </div>
        </div>
        {tone && <Badge tone={tone}>{TONE[tone].label}</Badge>}
      </div>
      {description && <p className="mt-2 text-xs leading-snug text-ink-2">{description}</p>}
      {benchmark && (
        <div className="num mt-3 flex flex-wrap gap-x-4 border-t border-rule-soft pt-2 text-xs text-ink-3">
          <span>Poor <span className="text-ink-2">{bf(benchmark.poor)}</span></span>
          <span>Good <span className="text-ink-2">{bf(benchmark.good)}</span></span>
          <span>Best <span className="text-ink-2">{bf(benchmark.excellent)}</span></span>
        </div>
      )}
    </Sheet>
  );
}

function SectionHead({ n, title, score, narrative }) {
  return (
    <div className="rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="num text-sm text-ink-3">{String(n).padStart(2, '0')} / 04</span>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <ScoreBadge score={score} />
      </div>
      <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-ink-2">{narrative}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-ink px-3.5 py-2.5 text-[0.8125rem] leading-snug text-[#f4f4f3] shadow-lg">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <span className="num font-mono">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────────
const MODULES = [
  { key: 'pipeline', title: 'Pipeline health', body: 'Conversion at each stage, days between stages, and pipeline coverage, each scored against a benchmark range.' },
  { key: 'forecasting', title: 'Forecast accuracy', body: 'Forecast compared with actual for each closed quarter, with a check for steady over- or under-forecasting.' },
  { key: 'unitEcon', title: 'Unit economics', body: 'LTV to CAC, CAC payback, gross churn, and net revenue retention.' },
  { key: 'funnel', title: 'Funnel efficiency', body: 'Win rate, lead-to-close rate, sales cycle length, and leads per rep.' },
];

// ─── Summary ──────────────────────────────────────────────────────────────────
function SummaryTab({ scores, narratives, data, onTabChange }) {
  const sorted = [...MODULES].sort((a, b) => scores[a.key].score - scores[b.key].score);
  const priorities = sorted.slice(0, 3);
  const h = healthLabel(scores.overall);

  return (
    <div className="space-y-10">
      <section className="rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-6">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <ScoreRing score={scores.overall} />
          <div className="flex-1">
            <p className="num text-xs uppercase tracking-widest text-ink-3">Overall score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-5xl font-bold">{scores.overall}</span>
              <span className="num text-xl text-ink-3">/ 100</span>
            </div>
            <p className="mt-2 max-w-xl leading-relaxed text-ink-2">
              {data.company} scores <strong className={h.text}>{h.label.toLowerCase()}</strong> overall.
              {scores.overall >= 80
                ? ' Most checks are at or above the best-practice range.'
                : scores.overall >= 60
                ? ' The weakest checks below are where predictability and efficiency can improve.'
                : ' The weakest checks below need attention before the next planning cycle.'}
            </p>
            <p className="mt-3 text-sm text-ink-3">
              Weights: pipeline 30%, forecasting 25%, unit economics 25%, funnel 20%.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Four checks</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {MODULES.map((m, i) => {
            const s = scores[m.key].score;
            const mh = healthLabel(s);
            return (
              <button key={m.key} type="button" onClick={() => onTabChange(m.key)} className="text-left">
                <Sheet className="h-full transition-colors hover:border-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="num text-xs text-ink-3">Check {i + 1} of 4</p>
                      <h3 className="mt-1 text-2xl font-bold">{m.title}</h3>
                    </div>
                    <ScoreBadge score={s} />
                  </div>
                  <div className="mt-3"><MeterBar pct={s} color={mh.color} /></div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{narratives[m.key]}</p>
                  <p className="mt-3 font-medium text-accent">Open {m.title.toLowerCase()} →</p>
                </Sheet>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Where to start</h2>
        <Sheet className="divide-y divide-rule-soft p-0!">
          {priorities.map((m, i) => (
            <div key={m.key} className="flex items-start gap-4 p-5">
              <span className="num text-lg font-semibold text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{m.title}</span>
                  <ScoreBadge score={scores[m.key].score} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{narratives[m.key]}</p>
              </div>
            </div>
          ))}
        </Sheet>
      </section>
    </div>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────
function PipelineTab({ scores, narratives, data }) {
  const conv = data.pipeline.stageConversion;
  const vel = data.pipeline.velocityDays;
  const b = BENCHMARKS.pipeline;

  const counts = [1000];
  [conv.leadToMql, conv.mqlToSql, conv.sqlToOpportunity, conv.opportunityToClosedWon].forEach((r) => counts.push(counts[counts.length - 1] * r));
  const funnelData = ['Leads', 'MQL', 'SQL', 'Opps', 'Won'].map((stage, i) => ({ stage, value: Math.round(counts[i]) }));

  const convRates = [
    { name: 'Lead → MQL', rate: conv.leadToMql, benchmark: b.leadToMql },
    { name: 'MQL → SQL', rate: conv.mqlToSql, benchmark: b.mqlToSql },
    { name: 'SQL → Opp', rate: conv.sqlToOpportunity, benchmark: b.sqlToOpportunity },
    { name: 'Opp → Won', rate: conv.opportunityToClosedWon, benchmark: b.opportunityToClosedWon },
  ];

  const velocityData = [
    { stage: 'Lead → MQL', days: vel.leadToMql, benchmark: 5 },
    { stage: 'MQL → SQL', days: vel.mqlToSql, benchmark: 8 },
    { stage: 'SQL → Opp', days: vel.sqlToOpportunity, benchmark: 15 },
    { stage: 'Opp → Won', days: vel.opportunityToClosedWon, benchmark: 30 },
  ];
  const velColor = (d) => (d.days <= d.benchmark * 1.2 ? C.good : d.days <= d.benchmark * 1.8 ? C.warn : C.critical);
  const maxVal = funnelData[0].value;

  return (
    <div className="space-y-5">
      <SectionHead n={1} title="Pipeline health" score={scores.pipeline.score} narrative={narratives.pipeline} />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Pipeline coverage" value={data.pipeline.pipelineCoverageRatio.toFixed(1)}
          unit="x" benchmark={b.pipelineCoverage} description="Pipeline value compared with the quota target" />
        <MetricCard label="Total stage velocity" value={scores.pipeline.totalVelocity}
          unit=" days" benchmark={b.totalVelocityDays} higherBetter={false} description="Days from lead to closed won, summed across stages" />
        <MetricCard label="End-to-end conversion"
          value={fmtPct(conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity * conv.opportunityToClosedWon)}
          description="Share of leads that become closed won deals" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet>
          <CardTitle note="What 1,000 leads become at these conversion rates.">Conversion funnel</CardTitle>
          <div className="space-y-1">
            {funnelData.map((d, i) => {
              const pct = (d.value / maxVal) * 100;
              const rate = i > 0 ? d.value / funnelData[i - 1].value : null;
              return (
                <div key={d.stage}>
                  {rate != null && (
                    <p className="num py-0.5 pl-16 font-mono text-xs text-ink-3">↓ {fmtPct(rate)}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-sm text-ink-2">{d.stage}</span>
                    <div className="h-8 flex-1 rounded-sm bg-rule-soft/60">
                      <div className="flex h-full items-center rounded-sm px-2.5"
                        style={{ width: `${Math.max(pct, 9)}%`, background: i === funnelData.length - 1 ? C.accentStrong : C.series1 }}>
                        <span className="num font-mono text-xs font-medium text-white">{fmt(d.value)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Sheet>

        <Sheet>
          <CardTitle note="The black tick marks the good threshold. The bar fills toward the best value.">Stage conversion against benchmark</CardTitle>
          <div className="space-y-5">
            {convRates.map((cr) => {
              const tone = toneFor(cr.rate, cr.benchmark);
              const scale = cr.benchmark.excellent / 0.8;
              return (
                <div key={cr.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-ink-2">{cr.name}</span>
                    <span className="num font-mono text-sm font-medium" style={{ color: TONE[tone].color }}>{fmtPct(cr.rate)}</span>
                  </div>
                  <MeterBar pct={(cr.rate / scale) * 100} color={TONE[tone].color} marker={(cr.benchmark.good / scale) * 100} />
                  <div className="num mt-1 flex justify-between text-xs text-ink-3">
                    <span>Poor {fmtPct(cr.benchmark.poor, 0)}</span>
                    <span>Good {fmtPct(cr.benchmark.good, 0)}</span>
                    <span>Best {fmtPct(cr.benchmark.excellent, 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Sheet>
      </div>

      <Sheet>
        <CardTitle note="Green is within 20% of the stage benchmark, amber within 80%, red beyond that.">Days in each stage</CardTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={velocityData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid stroke={C.ruleSoft} horizontal={false} />
            <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="stage" tick={LABEL_TICK} axisLine={false} tickLine={false} width={110} />
            <Tooltip cursor={{ fill: 'rgba(26,29,30,0.04)' }} content={<ChartTooltip formatter={(v) => `${v} days`} />} />
            <Bar isAnimationActive={false} dataKey="days" name="Days" radius={[0, 3, 3, 0]} maxBarSize={26}>
              {velocityData.map((d, i) => <Cell key={i} fill={velColor(d)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Sheet>
    </div>
  );
}

// ─── Forecasting ──────────────────────────────────────────────────────────────
function ForecastingTab({ scores, narratives, data }) {
  const quarters = data.forecasting.quarters;
  const { avgAccuracy, avgBias } = scores.forecasting;
  const b = BENCHMARKS.forecasting;

  const chartData = quarters.map((q) => ({ quarter: q.quarter, forecast: q.forecast, actual: q.actual }));
  const closed = quarters.filter((q) => q.actual != null);
  const biasTone = Math.abs(avgBias) <= b.biasThreshold ? 'good' : Math.abs(avgBias) <= 0.2 ? 'warn' : 'critical';
  const RANGE = 0.3;
  const biasPos = ((Math.max(-RANGE, Math.min(RANGE, avgBias)) + RANGE) / (2 * RANGE)) * 100;
  const bandLeft = ((RANGE - b.biasThreshold) / (2 * RANGE)) * 100;
  const bandWidth = (b.biasThreshold / RANGE) * 100;

  return (
    <div className="space-y-5">
      <SectionHead n={2} title="Forecast accuracy" score={scores.forecasting.score} narrative={narratives.forecasting} />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Average forecast accuracy" value={fmtPct(avgAccuracy)} raw={avgAccuracy}
          benchmark={b.accuracy} benchFmt={(v) => fmtPct(v, 0)} description="1 minus the absolute miss as a share of actual, averaged across closed quarters" />
        <MetricCard label="Forecast bias"
          value={`${avgBias >= 0 ? '+' : ''}${(avgBias * 100).toFixed(1)}%`}
          description={avgBias > 0 ? 'Forecasts run above actuals on average' : 'Forecasts run below actuals on average'} />
        <MetricCard label="Weighted pipeline accuracy" value={fmtPct(data.forecasting.weightedPipelineAccuracy)}
          raw={data.forecasting.weightedPipelineAccuracy} benchmark={b.accuracy} benchFmt={(v) => fmtPct(v, 0)} description="Accuracy of the stage-weighted pipeline forecast" />
      </div>

      <Sheet>
        <CardTitle note="The last quarter is open, so it has a forecast and no actual yet.">Forecast compared with actual revenue</CardTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid stroke={C.ruleSoft} vertical={false} />
            <XAxis dataKey="quarter" tick={TICK} axisLine={{ stroke: C.rule }} tickLine={false} padding={{ left: 16, right: 24 }} />
            <YAxis tickFormatter={(v) => fmtM(v)} tick={TICK} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<ChartTooltip formatter={(v) => (v != null ? fmtM(v) : 'n/a')} />} />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: C.ink2 }} />
            <Line isAnimationActive={false} type="monotone" dataKey="forecast" name="Forecast" stroke={C.series1} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: C.series1 }} />
            <Line isAnimationActive={false} type="monotone" dataKey="actual" name="Actual" stroke={C.series2} strokeWidth={2.5} dot={{ r: 3, fill: C.series2 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Sheet>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet>
          <CardTitle>Accuracy by quarter</CardTitle>
          <table className="num w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
                <th className="py-2 font-medium">Quarter</th>
                <th className="py-2 font-medium">Accuracy</th>
                <th className="py-2 text-right font-medium">Actual minus forecast</th>
              </tr>
            </thead>
            <tbody>
              {scores.forecasting.quarterAccuracies.map((q) => {
                const acc = q.accuracy;
                const color = acc >= 0.9 ? C.good : acc >= 0.75 ? C.warn : C.critical;
                const variance = q.actual - q.forecast;
                return (
                  <tr key={q.quarter} className="border-b border-rule-soft last:border-0">
                    <td className="py-2.5 text-ink-2">{q.quarter}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-28"><MeterBar pct={acc * 100} color={color} /></div>
                        <span className="font-mono" style={{ color }}>{fmtPct(acc)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono" style={{ color: variance >= 0 ? C.good : C.critical }}>
                      {variance >= 0 ? '+' : ''}{fmtM(variance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Sheet>

        <Sheet>
          <CardTitle note={`Bias is the average of (forecast minus actual) divided by actual. Within ±${b.biasThreshold * 100}% counts as calibrated.`}>
            Forecast bias
          </CardTitle>
          <div className="num text-3xl font-bold" style={{ color: TONE[biasTone].color }}>
            {avgBias >= 0 ? '+' : ''}{(avgBias * 100).toFixed(1)}%
          </div>
          <div className="relative mt-5 h-3 rounded-full bg-rule-soft">
            <div className="absolute inset-y-0 rounded-full bg-good-soft ring-1 ring-good/30" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
            <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-3" style={{ left: '50%' }} />
            <div className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm" style={{ left: `${biasPos}%`, background: TONE[biasTone].color }} />
          </div>
          <div className="num mt-1.5 flex justify-between text-xs text-ink-3">
            <span>Under-forecast −30%</span>
            <span>0</span>
            <span>Over-forecast +30%</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            {Math.abs(avgBias) <= b.biasThreshold
              ? (Math.abs(avgBias) > b.biasThreshold / 2
                ? `Inside the ±${b.biasThreshold * 100}% band, but the forecast ran ${avgBias > 0 ? 'high' : 'low'} in ${closed.filter((q) => (avgBias > 0 ? q.forecast > q.actual : q.forecast < q.actual)).length} of ${closed.length} closed quarters.`
                : 'Forecasts are calibrated, with little steady bias in either direction.')
              : avgBias > 0
              ? 'Forecasts run high quarter after quarter. Review rep optimism and the probability assigned to each stage.'
              : 'Forecasts run low quarter after quarter. Review qualification criteria and deal scoring.'}
          </p>
        </Sheet>
      </div>
    </div>
  );
}

// ─── Unit economics ───────────────────────────────────────────────────────────
function UnitEconomicsTab({ scores, narratives, data }) {
  const ue = data.unitEconomics;
  const b = BENCHMARKS.unitEconomics;
  const ltvCac = ue.ltvCacRatio ?? ue.ltv / ue.cac;

  const ratioData = [
    { name: 'CAC', value: ue.cac, fill: C.ink2 },
    { name: 'LTV', value: ue.ltv, fill: C.accentStrong },
  ];

  const rows = [
    { label: 'LTV to CAC', value: ltvCac, bench: b.ltvCacRatio, show: (v) => `${v.toFixed(2)}x`, higher: true },
    { label: 'CAC payback', value: ue.cacPaybackMonths, bench: b.cacPaybackMonths, show: (v) => `${v} mo`, higher: false },
    { label: 'Gross churn', value: ue.grossChurnRate, bench: b.grossChurn, show: (v) => fmtPct(v), higher: false },
    { label: 'Net revenue retention', value: ue.netRevenueRetention, bench: b.netRevenueRetention, show: (v) => fmtPct(v), higher: true },
  ];

  return (
    <div className="space-y-5">
      <SectionHead n={3} title="Unit economics" score={scores.unitEcon.score} narrative={narratives.unitEcon} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="LTV to CAC" value={ltvCac.toFixed(2)} unit="x"
          benchmark={b.ltvCacRatio} description="Lifetime value for each dollar of acquisition cost" />
        <MetricCard label="CAC payback" value={ue.cacPaybackMonths} unit=" mo"
          benchmark={b.cacPaybackMonths} higherBetter={false} description="Months of gross margin to recover acquisition cost" />
        <MetricCard label="Gross churn" value={fmtPct(ue.grossChurnRate)} raw={ue.grossChurnRate}
          benchmark={b.grossChurn} higherBetter={false} benchFmt={(v) => fmtPct(v, 0)} description="Annual revenue lost to cancellations and downgrades" />
        <MetricCard label="Net revenue retention" value={fmtPct(ue.netRevenueRetention)} raw={ue.netRevenueRetention}
          benchmark={b.netRevenueRetention} benchFmt={(v) => fmtPct(v, 0)} description="Revenue kept from existing customers after expansion and churn" />
        <MetricCard label="Customer acquisition cost" value={`$${fmt(ue.cac)}`}
          description="Fully loaded sales and marketing cost per new customer" />
        <MetricCard label="Lifetime value" value={`$${fmt(ue.ltv)}`}
          description="Expected revenue over a customer's lifetime" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet>
          <CardTitle>LTV compared with CAC</CardTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratioData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid stroke={C.ruleSoft} vertical={false} />
              <XAxis dataKey="name" tick={LABEL_TICK} axisLine={{ stroke: C.rule }} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={TICK} axisLine={false} tickLine={false} width={55} />
              <Tooltip cursor={{ fill: 'rgba(26,29,30,0.04)' }} content={<ChartTooltip formatter={(v) => `$${fmt(v)}`} />} />
              <Bar isAnimationActive={false} dataKey="value" name="Value" radius={[3, 3, 0, 0]} maxBarSize={72}>
                {ratioData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center">
            <span className="num text-2xl font-bold">{ltvCac.toFixed(2)}x</span>
            <span className="ml-2 text-sm text-ink-2">LTV to CAC</span>
          </p>
        </Sheet>

        <Sheet>
          <CardTitle note="Each bar fills toward the best value in its benchmark range. Color uses the same thresholds as the cards above.">Against benchmark</CardTitle>
          <div className="space-y-5">
            {rows.map((r) => {
              const tone = toneFor(r.value, r.bench, r.higher);
              const pct = r.higher
                ? (r.value / r.bench.excellent) * 100
                : (r.bench.poor / Math.max(r.value, 0.001)) * 100;
              return (
                <div key={r.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-ink-2">{r.label}</span>
                    <span className="num font-mono text-sm font-medium" style={{ color: TONE[tone].color }}>{r.show(r.value)}</span>
                  </div>
                  <MeterBar pct={pct} color={TONE[tone].color} />
                </div>
              );
            })}
          </div>
        </Sheet>
      </div>
    </div>
  );
}

// ─── Funnel efficiency ────────────────────────────────────────────────────────
function FunnelTab({ scores, narratives, data }) {
  const fe = data.funnelEfficiency;
  const b = BENCHMARKS.funnelEfficiency;

  const funnelStages = [
    { label: 'Leads', value: fe.leadsPerRep, note: 'per rep each month' },
    { label: 'Opportunities', value: Math.round((fe.leadsPerRep * fe.leadToCloseRate) / fe.winRate), note: `${fmtPct(fe.winRate)} win rate` },
    { label: 'Closed won', value: Math.round(fe.leadsPerRep * fe.leadToCloseRate), note: `${fmtPct(fe.leadToCloseRate)} lead to close` },
  ];

  const cycleData = [
    { stage: 'Discovery', days: Math.round(fe.avgSalesCycleDays * 0.15) },
    { stage: 'Demo', days: Math.round(fe.avgSalesCycleDays * 0.18) },
    { stage: 'Evaluation', days: Math.round(fe.avgSalesCycleDays * 0.27) },
    { stage: 'Negotiation', days: Math.round(fe.avgSalesCycleDays * 0.22) },
    { stage: 'Close', days: Math.round(fe.avgSalesCycleDays * 0.18) },
  ];

  return (
    <div className="space-y-5">
      <SectionHead n={4} title="Funnel efficiency" score={scores.funnel.score} narrative={narratives.funnel} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Win rate" value={fmtPct(fe.winRate)} raw={fe.winRate}
          benchmark={b.winRate} benchFmt={(v) => fmtPct(v, 0)} description="Share of opportunities that close" />
        <MetricCard label="Lead-to-close rate" value={fmtPct(fe.leadToCloseRate)} raw={fe.leadToCloseRate}
          benchmark={b.leadToClose} benchFmt={(v) => fmtPct(v, 1)} description="Share of all leads that close" />
        <MetricCard label="Average sales cycle" value={fe.avgSalesCycleDays} unit=" days"
          benchmark={b.salesCycleDays} higherBetter={false} description="Days from lead to close" />
        <MetricCard label="Average deal size" value={`$${fmt(fe.avgDealSize)}`}
          description="Average contract value" />
        <MetricCard label="Leads per rep" value={fe.leadsPerRep}
          benchmark={b.leadsPerRep} description="Monthly lead volume per account executive" />
        <MetricCard label="Revenue per rep"
          value={fmtM(fe.avgDealSize * fe.leadsPerRep * fe.leadToCloseRate * 12)}
          description="Deal size × leads per rep × lead-to-close × 12 months" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Sheet>
          <CardTitle note="One rep's month at these rates.">Per-rep funnel</CardTitle>
          <div className="space-y-3">
            {funnelStages.map((s, i) => {
              const pct = (s.value / funnelStages[0].value) * 100;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-ink-2">{s.label}</span>
                  <div className="h-9 flex-1 rounded-sm bg-rule-soft/60">
                    <div className="flex h-full items-center rounded-sm px-2.5"
                      style={{ width: `${Math.max(pct, 10)}%`, background: i === funnelStages.length - 1 ? C.accentStrong : C.series1 }}>
                      <span className="num font-mono text-sm font-medium text-white">{s.value}</span>
                    </div>
                  </div>
                  <span className="hidden w-32 text-xs text-ink-3 sm:block">{s.note}</span>
                </div>
              );
            })}
          </div>
        </Sheet>

        <Sheet>
          <CardTitle note="The cycle split across stages with a fixed allocation, for illustration.">Sales cycle by stage</CardTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cycleData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid stroke={C.ruleSoft} horizontal={false} />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={LABEL_TICK} axisLine={false} tickLine={false} width={85} />
              <Tooltip cursor={{ fill: 'rgba(26,29,30,0.04)' }} content={<ChartTooltip formatter={(v) => `${v} days`} />} />
              <Bar isAnimationActive={false} dataKey="days" name="Days" fill={C.series1} radius={[0, 3, 3, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-1 text-center">
            <span className="num text-lg font-bold">{fe.avgSalesCycleDays} days</span>
            <span className="ml-2 text-sm text-ink-2">total average cycle</span>
          </p>
        </Sheet>
      </div>
    </div>
  );
}

// ─── Inputs ───────────────────────────────────────────────────────────────────
function InputFormTab({ inputs, onChange, onReset }) {
  const field = (key, label, placeholder, type = 'number') => (
    <label key={key} className="flex flex-col gap-1">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">{label}</span>
      <input
        type={type}
        step="any"
        value={inputs[key] ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="field-input px-3 py-2 text-sm"
      />
    </label>
  );

  const section = (n, title, children) => (
    <Sheet>
      <div className="mb-4 flex items-baseline gap-3">
        {n && <span className="num text-sm text-ink-3">{String(n).padStart(2, '0')} / 04</span>}
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Sheet>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your numbers</h2>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
            Blue fields are inputs. Every score updates as you type. Rates are decimals, so 35% is 0.35. Nothing is sent or saved.
          </p>
        </div>
        <button type="button" onClick={onReset}
          className="rounded-md border border-rule bg-sheet px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent">
          Reset to the example
        </button>
      </div>

      {section(null, 'Company', <>
        {field('company', 'Company name', 'Acme SaaS', 'text')}
        {field('stage', 'Stage', 'Series B', 'text')}
        {field('arr', 'ARR ($)', '15000000')}
        {field('salesTeamSize', 'Sales team size', '80')}
      </>)}

      {section(1, 'Pipeline health', <>
        {field('leadToMql', 'Lead → MQL rate', '0.35')}
        {field('mqlToSql', 'MQL → SQL rate', '0.42')}
        {field('sqlToOpportunity', 'SQL → Opp rate', '0.55')}
        {field('opportunityToClosedWon', 'Opp → Won rate', '0.22')}
        {field('velocityLeadToMql', 'Lead → MQL days', '8')}
        {field('velocityMqlToSql', 'MQL → SQL days', '12')}
        {field('velocitySqlToOpp', 'SQL → Opp days', '18')}
        {field('velocityOppToWon', 'Opp → Won days', '35')}
        {field('pipelineCoverage', 'Pipeline coverage ratio', '2.8')}
      </>)}

      {section(2, 'Forecast accuracy', <>
        {field('forecastQ1', 'Q1 forecast ($)', '3200000')}
        {field('actualQ1', 'Q1 actual ($)', '2850000')}
        {field('forecastQ2', 'Q2 forecast ($)', '3500000')}
        {field('actualQ2', 'Q2 actual ($)', '3100000')}
        {field('forecastQ3', 'Q3 forecast ($)', '3800000')}
        {field('actualQ3', 'Q3 actual ($)', '3950000')}
        {field('forecastQ4', 'Q4 forecast ($)', '4200000')}
        {field('actualQ4', 'Q4 actual ($)', '3700000')}
        {field('forecastQ5', 'Q5 forecast ($)', '4500000')}
        {field('actualQ5', 'Q5 actual ($)', '4100000')}
        {field('forecastQ6', 'Q6 forecast ($)', '4800000')}
        {field('weightedPipelineAccuracy', 'Weighted pipeline accuracy', '0.72')}
      </>)}

      {section(3, 'Unit economics', <>
        {field('cac', 'CAC ($)', '18500')}
        {field('ltv', 'LTV ($)', '67000')}
        {field('cacPaybackMonths', 'CAC payback (months)', '14')}
        {field('grossChurnRate', 'Gross churn rate', '0.08')}
        {field('netRevenueRetention', 'Net revenue retention', '1.12')}
      </>)}

      {section(4, 'Funnel efficiency', <>
        {field('leadToCloseRate', 'Lead-to-close rate', '0.032')}
        {field('winRate', 'Win rate', '0.22')}
        {field('avgSalesCycleDays', 'Average sales cycle (days)', '73')}
        {field('avgDealSize', 'Average deal size ($)', '42000')}
        {field('leadsPerRep', 'Leads per rep each month', '45')}
      </>)}
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function Landing({ onOpen, onOwn }) {
  return (
    <>
      <header className="page-head pt-6">
        <p className="num text-xs uppercase tracking-widest text-ink-3">Portfolio project · Revenue operations</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
          Four scores for the health of a revenue engine.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
          I built this healthcheck to score a SaaS revenue operation on four checks: pipeline health, forecast accuracy, unit
          economics, and funnel efficiency. Each check compares the inputs with a benchmark range and points to the weakest stage.
          Start with the example company or enter your own numbers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => onOpen('summary')}
            className="rounded-md bg-accent-strong px-4 py-2 font-medium text-white hover:bg-accent">
            Open the example →
          </button>
          <button type="button" onClick={onOwn}
            className="rounded-md border border-rule bg-sheet px-4 py-2 font-medium hover:border-accent hover:text-accent">
            Enter your own numbers
          </button>
        </div>
      </header>
      <div className="ruled space-y-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, i) => (
            <button key={m.key} type="button" onClick={() => onOpen(m.key)} className="text-left">
              <Sheet className="h-full transition-colors hover:border-accent">
                <p className="num text-xs text-ink-3">Check {i + 1} of 4</p>
                <h2 className="mt-1 text-2xl font-bold">{m.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-2">{m.body}</p>
                <p className="mt-4 font-medium text-accent">See the example →</p>
              </Sheet>
            </button>
          ))}
        </div>
        <section className="grid gap-8 rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-bold">One score from four</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              The overall score weights pipeline health at 30%, forecast accuracy and unit economics at 25% each, and funnel
              efficiency at 20%.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Every range is on screen</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Scored metrics show the poor, good, and best values they are measured against, so each score traces back to its inputs.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Your numbers stay on the page</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Entries are scored in the browser as you type. Nothing is sent or saved.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'forecasting', label: 'Forecasting' },
  { id: 'unitEcon', label: 'Unit economics' },
  { id: 'funnel', label: 'Funnel' },
];

export default function App() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'demo' | 'input'
  const [activeTab, setActiveTab] = useState('summary');
  const [inputs, setInputs] = useState(DEFAULT_INPUT);

  const activeData = mode === 'input' ? inputToData(inputs) : DEMO_DATA;
  const scores = computeAllScores(activeData);
  const narratives = generateNarratives(scores);

  const handleInput = useCallback((key, val) => setInputs((prev) => ({ ...prev, [key]: val })), []);
  const handleReset = useCallback(() => setInputs(DEFAULT_INPUT), []);

  const go = (nextMode, tab) => {
    setMode(nextMode);
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };
  const openTab = (tab) => go(mode === 'input' ? 'input' : 'demo', tab);

  const navItems = [...TABS.slice(1), { id: 'inputs', label: 'Your numbers' }];
  const h = healthLabel(scores.overall);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rule bg-sheet">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-1 px-4 py-3">
          <button type="button" onClick={() => go('landing', 'summary')} className="text-xl font-bold tracking-tight">
            RevOps Healthcheck
          </button>
          <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
            {navItems.map((n) => {
              const active = mode !== 'landing' && activeTab === n.id;
              return (
                <button key={n.id} type="button"
                  onClick={() => (n.id === 'inputs' ? go('input', 'inputs') : openTab(n.id))}
                  className={`underline-offset-4 hover:text-accent hover:underline ${active ? 'font-medium text-ink underline decoration-accent decoration-2' : ''}`}>
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8">
        {mode === 'landing' ? (
          <Landing onOpen={(tab) => go('demo', tab)} onOwn={() => go('input', 'inputs')} />
        ) : (
          <>
            <header className="page-head">
              <p className="num text-xs uppercase tracking-widest text-ink-3">
                {mode === 'demo' ? 'Example company · illustrative figures' : 'Your numbers'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { id: 'demo', label: 'Example company' },
                  { id: 'input', label: 'Your numbers' },
                ].map((m) => (
                  <button key={m.id} type="button"
                    onClick={() => go(m.id, m.id === 'input' ? (activeTab === 'summary' ? 'inputs' : activeTab) : (activeTab === 'inputs' ? 'summary' : activeTab))}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                      mode === m.id ? 'border-accent-strong bg-accent-strong text-white' : 'border-rule bg-sheet hover:border-accent hover:text-accent'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
                {activeData.company || 'Your company'} scores {scores.overall} out of 100.
              </h1>
              <p className="num mt-3 text-ink-2">
                {[activeData.stage, activeData.arr ? `${fmtM(activeData.arr)} ARR` : null, activeData.salesTeamSize ? `${activeData.salesTeamSize} in sales` : null]
                  .filter(Boolean).join(' · ')}
                <span className="ml-3 align-middle"><ScoreBadge score={scores.overall} /></span>
              </p>
              <nav className="mt-6 flex flex-wrap gap-x-1 gap-y-2 border-b border-rule" aria-label="Checks">
                {[...TABS, ...(mode === 'input' ? [{ id: 'inputs', label: 'Your numbers' }] : [])].map((t) => {
                  const active = activeTab === t.id;
                  const s = scores[t.id]?.score;
                  return (
                    <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                      className={`-mb-px flex items-baseline gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
                        active ? 'border-accent text-ink' : 'border-transparent text-ink-2 hover:text-accent'
                      }`}>
                      {t.label}
                      {s != null && <span className="num font-mono text-xs" style={{ color: healthLabel(s).color }}>{s}</span>}
                    </button>
                  );
                })}
              </nav>
            </header>
            <div className="ruled">
              {activeTab === 'summary' && <SummaryTab scores={scores} narratives={narratives} data={activeData} onTabChange={setActiveTab} />}
              {activeTab === 'pipeline' && <PipelineTab scores={scores} narratives={narratives} data={activeData} />}
              {activeTab === 'forecasting' && <ForecastingTab scores={scores} narratives={narratives} data={activeData} />}
              {activeTab === 'unitEcon' && <UnitEconomicsTab scores={scores} narratives={narratives} data={activeData} />}
              {activeTab === 'funnel' && <FunnelTab scores={scores} narratives={narratives} data={activeData} />}
              {activeTab === 'inputs' && <InputFormTab inputs={inputs} onChange={handleInput} onReset={handleReset} />}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-rule bg-paper px-4 py-5 text-center text-xs text-ink-2">
        Portfolio project by{' '}
        <a href="https://mongeon.co" className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
          Chris Mongeon
        </a>
        . The example company and its figures are illustrative.
      </footer>
    </>
  );
}
