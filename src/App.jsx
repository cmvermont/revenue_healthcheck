import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, ReferenceLine, Legend, Cell,
} from 'recharts';
import { DEMO_DATA, DEFAULT_INPUT, BENCHMARKS } from './data.js';
import {
  computeAllScores, healthLabel, generateNarratives, inputToData,
} from './scoring.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) =>
  n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtPct = (n, decimals = 1) => n == null ? '—' : `${(n * 100).toFixed(decimals)}%`;
const fmtM = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 900, className = '', style = {}, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const to = value;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(to * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className} style={style}>{prefix}{display}{suffix}</span>;
}

// ─── Radial Score Ring ─────────────────────────────────────────────────────────
function ScoreRing({ score, size = 180, strokeWidth = 14 }) {
  const h = healthLabel(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={cx} cy={cx} r={radius} fill="none"
          stroke="#1E293B" strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cx} r={radius} fill="none"
          stroke={h.color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <AnimatedNumber value={score} className="font-mono font-bold text-white" style={{ fontSize: `${Math.round(size * 0.22)}px` }} />
        <span className={`text-xs font-semibold uppercase tracking-widest mt-0.5 ${h.text}`}>{h.label}</span>
      </div>
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = 'md' }) {
  const h = healthLabel(score);
  const sizes = { sm: 'text-sm px-2 py-0.5', md: 'text-base px-3 py-1', lg: 'text-xl px-4 py-1.5' };
  return (
    <span className={`font-mono font-bold rounded-lg border ${h.bg} ${h.text} ${h.border} ${sizes[size]}`}>
      {score}
    </span>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleScoreCard({ title, score, icon, narrative, onClick, active }) {
  const h = healthLabel(score);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.01] ${
        active
          ? `${h.border} bg-slate-800/80 shadow-lg shadow-black/20`
          : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-slate-200 text-sm">{title}</span>
        </div>
        <ScoreBadge score={score} size="sm" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-700">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${score}%`, background: h.color }}
          />
        </div>
        <span className={`text-xs font-semibold ${h.text}`}>{h.label}</span>
      </div>
      {narrative && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mt-2">{narrative}</p>
      )}
    </button>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, benchmark, unit = '', higherBetter = true, description }) {
  const b = benchmark;
  let color = '#10B981';
  let status = 'Healthy';
  if (b) {
    const v = parseFloat(value);
    if (higherBetter) {
      if (v < b.poor) { color = '#F43F5E'; status = 'At Risk'; }
      else if (v < b.good) { color = '#F59E0B'; status = 'Moderate'; }
    } else {
      if (v > b.poor) { color = '#F43F5E'; status = 'At Risk'; }
      else if (v > b.good) { color = '#F59E0B'; status = 'Moderate'; }
    }
  }

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
        {b && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color }}>
            {status}
          </span>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-white mt-2 mb-1">
        {value}{unit}
      </div>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      {b && (
        <div className="mt-3 text-xs text-slate-500 flex gap-3">
          <span>Poor <span className="text-slate-400">{b.poor}{unit}</span></span>
          <span>Good <span className="text-slate-400">{b.good}{unit}</span></span>
          <span>Best <span className="text-slate-400">{b.excellent}{unit}</span></span>
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, score, narrative }) {
  const h = healthLabel(score);
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <ScoreBadge score={score} />
        <span className={`text-sm font-semibold ${h.text}`}>{h.label}</span>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{narrative}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-mono font-bold ml-1">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────
function SummaryTab({ scores, narratives, data, onTabChange }) {
  const modules = [
    { key: 'pipeline',    tab: 'pipeline',    title: 'Pipeline Health',        icon: '🔀', score: scores.pipeline.score },
    { key: 'forecasting', tab: 'forecasting', title: 'Forecasting Accuracy',   icon: '🎯', score: scores.forecasting.score },
    { key: 'unitEcon',    tab: 'unitEcon',    title: 'Unit Economics',          icon: '💰', score: scores.unitEcon.score },
    { key: 'funnel',      tab: 'funnel',      title: 'Funnel Efficiency',       icon: '⚡', score: scores.funnel.score },
  ];

  const sorted = [...modules].sort((a, b) => a.score - b.score);
  const recommendations = sorted.slice(0, 3).map(m => ({
    ...m,
    rec: narratives[m.key],
  }));

  return (
    <div className="tab-content space-y-8">
      {/* Overall score */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreRing score={scores.overall} size={200} strokeWidth={16} />
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Overall RevOps Health</p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-5xl font-bold text-white">{scores.overall}</span>
              <span className="font-mono text-xl text-slate-500">/100</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              {data.company} is scoring <strong className={`${healthLabel(scores.overall).text}`}>{healthLabel(scores.overall).label}</strong> overall.
              {scores.overall >= 80
                ? ' Revenue operations are performing at best-in-class levels across most dimensions.'
                : scores.overall >= 60
                ? ' There are clear opportunities to improve revenue predictability and efficiency.'
                : ' Immediate action is recommended to address critical gaps in revenue operations.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Module Scores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(m => (
            <ModuleScoreCard
              key={m.key}
              title={m.title}
              score={m.score}
              icon={m.icon}
              narrative={narratives[m.key]}
              onClick={() => onTabChange(m.tab)}
            />
          ))}
        </div>
      </div>

      {/* Top recommendations */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Top Priorities</h3>
        <div className="space-y-3">
          {recommendations.map((r, i) => {
            const h = healthLabel(r.score);
            return (
              <div key={r.key}
                className={`rounded-xl p-4 border ${h.border} ${h.bg} flex gap-4 items-start`}>
                <span className="text-lg font-mono font-bold" style={{ color: h.color }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-200">{r.title}</span>
                    <ScoreBadge score={r.score} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.rec}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────────
function PipelineTab({ scores, narratives, data }) {
  const conv = data.pipeline.stageConversion;
  const vel = data.pipeline.velocityDays;
  const b = BENCHMARKS.pipeline;

  const funnelData = [
    { stage: 'Leads', value: 1000, next: Math.round(1000 * conv.leadToMql) },
    { stage: 'MQL',   value: Math.round(1000 * conv.leadToMql), next: Math.round(1000 * conv.leadToMql * conv.mqlToSql) },
    { stage: 'SQL',   value: Math.round(1000 * conv.leadToMql * conv.mqlToSql), next: Math.round(1000 * conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity) },
    { stage: 'Opps',  value: Math.round(1000 * conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity), next: Math.round(1000 * conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity * conv.opportunityToClosedWon) },
    { stage: 'Won',   value: Math.round(1000 * conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity * conv.opportunityToClosedWon), next: 0 },
  ];

  const convRates = [
    { name: 'Lead → MQL', rate: conv.leadToMql, benchmark: b.leadToMql },
    { name: 'MQL → SQL', rate: conv.mqlToSql, benchmark: b.mqlToSql },
    { name: 'SQL → Opp', rate: conv.sqlToOpportunity, benchmark: b.sqlToOpportunity },
    { name: 'Opp → Won', rate: conv.opportunityToClosedWon, benchmark: b.opportunityToClosedWon },
  ];

  const velocityData = [
    { stage: 'Lead → MQL',  days: vel.leadToMql,              benchmark: 5 },
    { stage: 'MQL → SQL',   days: vel.mqlToSql,               benchmark: 8 },
    { stage: 'SQL → Opp',   days: vel.sqlToOpportunity,       benchmark: 15 },
    { stage: 'Opp → Won',   days: vel.opportunityToClosedWon, benchmark: 30 },
  ];

  const maxVal = funnelData[0].value;

  return (
    <div className="tab-content space-y-6">
      <SectionHeader title="Pipeline Health" score={scores.pipeline.score} narrative={narratives.pipeline} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Pipeline Coverage" value={data.pipeline.pipelineCoverageRatio.toFixed(1)}
          unit="x" benchmark={b.pipelineCoverage} higherBetter={true}
          description="Pipeline value vs. quota target" />
        <MetricCard label="Avg Deal Velocity" value={scores.pipeline.totalVelocity}
          unit=" days" benchmark={b.totalVelocityDays} higherBetter={false}
          description="Total average sales cycle" />
        <MetricCard label="End-to-End Conversion"
          value={fmtPct(conv.leadToMql * conv.mqlToSql * conv.sqlToOpportunity * conv.opportunityToClosedWon)}
          description="Lead to Closed Won rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel visualization */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Conversion Funnel</h3>
          <div className="space-y-2">
            {funnelData.map((d, i) => {
              const pct = (d.value / maxVal) * 100;
              const convRate = i > 0 ? d.value / funnelData[i - 1].value : 1;
              const stageColors = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#10B981'];
              return (
                <div key={d.stage}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 my-1 pl-2">
                      <div className="w-px h-3 bg-slate-600 ml-2" />
                      <span className="text-xs text-slate-500 font-mono">{fmtPct(convRate)} conversion</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-12 text-right font-medium">{d.stage}</span>
                    <div className="flex-1 h-9 bg-slate-900/60 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 8)}%`, background: stageColors[i] }}
                      >
                        <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                          {fmt(d.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion rates vs benchmark */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Stage Conversions vs. Benchmark</h3>
          <div className="space-y-4">
            {convRates.map(cr => {
              const pct = cr.rate * 100;
              const goodPct = cr.benchmark.good * 100;
              const excPct = cr.benchmark.excellent * 100;
              const h = cr.rate >= cr.benchmark.good ? '#10B981' : cr.rate >= cr.benchmark.poor ? '#F59E0B' : '#F43F5E';
              return (
                <div key={cr.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{cr.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: h }}>{fmtPct(cr.rate)}</span>
                  </div>
                  <div className="relative h-2 bg-slate-700 rounded-full">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct / excPct * 80, 100)}%`, background: h }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-amber-400/70 rounded"
                      style={{ left: `${Math.min(goodPct / excPct * 80, 99)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-600">Poor: {fmtPct(cr.benchmark.poor)}</span>
                    <span className="text-xs text-amber-600/70">Good: {fmtPct(cr.benchmark.good)}</span>
                    <span className="text-xs text-emerald-600/70">Best: {fmtPct(cr.benchmark.excellent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Velocity chart */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-5">Stage Velocity (Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={velocityData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="stage" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip formatter={(v) => `${v} days`} />} />
            <Bar dataKey="days" fill="#6366F1" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {velocityData.map((entry, i) => (
                <Cell key={i} fill={entry.days <= entry.benchmark * 1.2 ? '#10B981' : entry.days <= entry.benchmark * 1.8 ? '#F59E0B' : '#F43F5E'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Forecasting Tab ──────────────────────────────────────────────────────────
function ForecastingTab({ scores, narratives, data }) {
  const quarters = data.forecasting.quarters;
  const { avgAccuracy, avgBias } = scores.forecasting;
  const b = BENCHMARKS.forecasting;

  const chartData = quarters.map(q => ({
    quarter: q.quarter,
    forecast: q.forecast,
    actual: q.actual,
    variance: q.actual != null ? q.actual - q.forecast : null,
    accuracy: q.actual != null ? Math.max(0, 1 - Math.abs((q.forecast - q.actual) / q.actual)) : null,
  }));

  const biasAngle = Math.max(-90, Math.min(90, avgBias * 450));
  const biasColor = Math.abs(avgBias) <= b.biasThreshold ? '#10B981' : Math.abs(avgBias) <= 0.20 ? '#F59E0B' : '#F43F5E';

  return (
    <div className="tab-content space-y-6">
      <SectionHeader title="Forecasting Accuracy" score={scores.forecasting.score} narrative={narratives.forecasting} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Avg Forecast Accuracy" value={fmtPct(avgAccuracy)}
          benchmark={{ poor: 0.60, good: 0.80, excellent: 0.95 }}
          higherBetter={true} description="1 - |forecast vs actual|" />
        <MetricCard label="Forecast Bias"
          value={`${avgBias >= 0 ? '+' : ''}${(avgBias * 100).toFixed(1)}%`}
          description={`Systematic ${avgBias > 0 ? 'over' : 'under'}-forecasting`} />
        <MetricCard label="Weighted Pipeline Acc." value={fmtPct(data.forecasting.weightedPipelineAccuracy)}
          benchmark={b.accuracy} higherBetter={true}
          description="Pipeline-weighted forecast quality" />
      </div>

      {/* Forecast vs Actual chart */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-5">Forecast vs. Actual Revenue</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
            <defs>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="quarter" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtM(v)} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip formatter={(v) => v ? fmtM(v) : '—'} />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
            <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#6366F1" strokeWidth={2}
              fill="url(#forecastGrad)" dot={{ fill: '#6366F1', r: 4 }} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#10B981" strokeWidth={2}
              fill="url(#actualGrad)" dot={{ fill: '#10B981', r: 4 }} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-quarter accuracy */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-5">Quarter-by-Quarter Accuracy</h3>
        <div className="space-y-3">
          {scores.forecasting.quarterAccuracies.map(q => {
            const acc = q.accuracy;
            const color = acc >= 0.90 ? '#10B981' : acc >= 0.75 ? '#F59E0B' : '#F43F5E';
            const variance = q.actual - q.forecast;
            return (
              <div key={q.quarter} className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-400 w-20">{q.quarter}</span>
                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${acc * 100}%`, background: color }} />
                </div>
                <span className="font-mono text-sm font-bold w-14 text-right" style={{ color }}>
                  {fmtPct(acc)}
                </span>
                <span className={`text-xs font-mono w-20 text-right ${variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {variance >= 0 ? '+' : ''}{fmtM(variance)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bias gauge */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Forecast Bias Indicator</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative" style={{ width: 160, height: 80 }}>
            <svg width={160} height={90} viewBox="0 0 160 90">
              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#F43F5E" strokeWidth={8} strokeLinecap="round" opacity={0.3} />
              <path d="M 80 80 A 0 0 0 0 1 80 80" fill="none" />
              <circle cx={80} cy={80} r={6} fill={biasColor} />
              <line
                x1={80} y1={80}
                x2={80 + 55 * Math.sin((biasAngle * Math.PI) / 180)}
                y2={80 - 55 * Math.cos((biasAngle * Math.PI) / 180)}
                stroke={biasColor} strokeWidth={3} strokeLinecap="round"
              />
              <text x={10} y={74} fill="#F43F5E" fontSize={10}>Over</text>
              <text x={118} y={74} fill="#6366F1" fontSize={10}>Under</text>
              <text x={68} y={24} fill="#10B981" fontSize={10}>Neutral</text>
            </svg>
          </div>
          <div>
            <div className="font-mono text-3xl font-bold mb-1" style={{ color: biasColor }}>
              {avgBias >= 0 ? '+' : ''}{(avgBias * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-slate-400">
              {Math.abs(avgBias) <= b.biasThreshold
                ? 'Forecasts are well-calibrated with minimal systematic bias.'
                : `Systematic ${avgBias > 0 ? 'over-forecasting' : 'under-forecasting'} detected. Review ${avgBias > 0 ? 'rep optimism and stage weighting' : 'qualification criteria and deal scoring'}.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Unit Economics Tab ───────────────────────────────────────────────────────
function UnitEconomicsTab({ scores, narratives, data }) {
  const ue = data.unitEconomics;
  const b = BENCHMARKS.unitEconomics;
  const ltvCac = ue.ltvCacRatio ?? (ue.ltv / ue.cac);

  const ratioData = [
    { name: 'CAC', value: ue.cac, color: '#F59E0B' },
    { name: 'LTV', value: ue.ltv, color: '#10B981' },
  ];

  return (
    <div className="tab-content space-y-6">
      <SectionHeader title="Unit Economics" score={scores.unitEcon.score} narrative={narratives.unitEcon} />

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="LTV:CAC Ratio" value={ltvCac.toFixed(2)} unit="x"
          benchmark={b.ltvCacRatio} higherBetter={true}
          description="Lifetime value to acquisition cost" />
        <MetricCard label="CAC Payback Period" value={ue.cacPaybackMonths} unit=" mo"
          benchmark={b.cacPaybackMonths} higherBetter={false}
          description="Months to recover acquisition cost" />
        <MetricCard label="Gross Churn Rate" value={fmtPct(ue.grossChurnRate)}
          benchmark={{ poor: 0.15, good: 0.08, excellent: 0.03 }}
          higherBetter={false} description="Annual customer/revenue churn" />
        <MetricCard label="Net Revenue Retention" value={fmtPct(ue.netRevenueRetention)}
          benchmark={b.netRevenueRetention} higherBetter={true}
          description="NRR including expansion & churn" />
        <MetricCard label="Customer Acq. Cost" value={`$${fmt(ue.cac)}`}
          description="Fully-loaded sales & marketing cost per new customer" />
        <MetricCard label="Lifetime Value" value={`$${fmt(ue.ltv)}`}
          description="Estimated revenue over customer lifetime" />
      </div>

      {/* LTV vs CAC visual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">LTV vs. CAC</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratioData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip formatter={(v) => `$${fmt(v)}`} />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                {ratioData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className="font-mono text-2xl font-bold text-white">{ltvCac.toFixed(2)}x</span>
            <span className="text-slate-400 text-sm ml-2">LTV:CAC ratio</span>
          </div>
        </div>

        {/* Benchmark comparison */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Benchmark Comparison</h3>
          <div className="space-y-5">
            {[
              { label: 'LTV:CAC', value: ltvCac, bench: b.ltvCacRatio, fmt: v => `${v.toFixed(2)}x`, higher: true },
              { label: 'CAC Payback', value: ue.cacPaybackMonths, bench: b.cacPaybackMonths, fmt: v => `${v} mo`, higher: false },
              { label: 'Gross Churn', value: ue.grossChurnRate, bench: b.grossChurn, fmt: v => fmtPct(v), higher: false },
              { label: 'NRR', value: ue.netRevenueRetention, bench: b.netRevenueRetention, fmt: v => fmtPct(v), higher: true },
            ].map(item => {
              const color = item.higher
                ? (item.value >= item.bench.excellent ? '#10B981' : item.value >= item.bench.good ? '#F59E0B' : '#F43F5E')
                : (item.value <= item.bench.excellent ? '#10B981' : item.value <= item.bench.good ? '#F59E0B' : '#F43F5E');
              const pct = item.higher
                ? Math.min((item.value / item.bench.excellent) * 100, 100)
                : Math.min((item.bench.poor / Math.max(item.value, 0.001)) * 100, 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="font-mono text-sm font-bold" style={{ color }}>{item.fmt(item.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Efficiency Tab ────────────────────────────────────────────────────
function FunnelTab({ scores, narratives, data }) {
  const fe = data.funnelEfficiency;
  const b = BENCHMARKS.funnelEfficiency;

  const funnelStages = [
    { label: 'Leads', value: fe.leadsPerRep, unit: 'per rep' },
    { label: 'Opportunities', value: Math.round(fe.leadsPerRep * fe.leadToCloseRate / fe.winRate * fe.leadsPerRep / fe.leadsPerRep), unit: `(${fmtPct(fe.winRate)} win rate)` },
    { label: 'Closed Won', value: Math.round(fe.leadsPerRep * fe.leadToCloseRate), unit: `(${fmtPct(fe.leadToCloseRate)} close rate)` },
  ];

  const cycleData = [
    { stage: 'Discovery', days: Math.round(fe.avgSalesCycleDays * 0.15) },
    { stage: 'Demo', days: Math.round(fe.avgSalesCycleDays * 0.18) },
    { stage: 'Evaluation', days: Math.round(fe.avgSalesCycleDays * 0.27) },
    { stage: 'Negotiation', days: Math.round(fe.avgSalesCycleDays * 0.22) },
    { stage: 'Close', days: Math.round(fe.avgSalesCycleDays * 0.18) },
  ];

  return (
    <div className="tab-content space-y-6">
      <SectionHeader title="Funnel Efficiency" score={scores.funnel.score} narrative={narratives.funnel} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Win Rate" value={fmtPct(fe.winRate)}
          benchmark={b.winRate} higherBetter={true} description="Opportunities to Closed Won" />
        <MetricCard label="Lead-to-Close Rate" value={fmtPct(fe.leadToCloseRate)}
          benchmark={b.leadToClose} higherBetter={true} description="All leads to Closed Won" />
        <MetricCard label="Avg Sales Cycle" value={fe.avgSalesCycleDays} unit=" days"
          benchmark={b.salesCycleDays} higherBetter={false} description="Days from lead to close" />
        <MetricCard label="Average Deal Size" value={`$${fmt(fe.avgDealSize)}`}
          description="Average contract value" />
        <MetricCard label="Leads per Rep" value={fe.leadsPerRep}
          benchmark={b.leadsPerRep} higherBetter={true} description="Monthly lead volume per AE" />
        <MetricCard label="Revenue per Rep"
          value={fmtM(fe.avgDealSize * fe.leadsPerRep * fe.leadToCloseRate * 12)}
          description="Estimated annual revenue per rep" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency funnel */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Per-Rep Funnel</h3>
          <div className="space-y-3">
            {funnelStages.map((s, i) => {
              const maxV = funnelStages[0].value;
              const pct = (s.value / maxV) * 100;
              const colors = ['#6366F1', '#A78BFA', '#10B981'];
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24">{s.label}</span>
                  <div className="flex-1 h-10 bg-slate-900/60 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center px-3"
                      style={{ width: `${Math.max(pct, 10)}%`, background: colors[i] }}>
                      <span className="font-mono text-sm font-bold text-white">{s.value}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-28 hidden sm:block">{s.unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales cycle breakdown */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5">Sales Cycle Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cycleData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: 'days', position: 'insideRight', fill: '#64748B', fontSize: 10 }} />
              <YAxis type="category" dataKey="stage" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip content={<CustomTooltip formatter={v => `${v} days`} />} />
              <Bar dataKey="days" fill="#6366F1" radius={[0, 6, 6, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-1">
            <span className="font-mono text-lg font-bold text-white">{fe.avgSalesCycleDays} days</span>
            <span className="text-slate-400 text-sm ml-2">total avg cycle</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Input Form Tab ───────────────────────────────────────────────────────────
function InputFormTab({ inputs, onChange, onReset }) {
  const field = (key, label, placeholder, type = 'number', step = 'any') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <input
        type={type}
        step={step}
        value={inputs[key] ?? ''}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
    </div>
  );

  const section = (title, icon, children) => (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="tab-content space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Enter Your Metrics</h2>
          <p className="text-sm text-slate-400">Scores update in real-time as you type.</p>
        </div>
        <button onClick={onReset}
          className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:border-slate-500 transition-all">
          Reset to Demo
        </button>
      </div>

      {section('Company Info', '🏢',
        <>
          {field('company', 'Company Name', 'Acme SaaS', 'text')}
          {field('stage', 'Stage (e.g. Series B)', 'Series B', 'text')}
          {field('arr', 'ARR ($)', '15000000')}
          {field('salesTeamSize', 'Sales Team Size', '80')}
        </>
      )}

      {section('Pipeline Health', '🔀',
        <>
          {field('leadToMql', 'Lead → MQL Rate (0–1)', '0.35')}
          {field('mqlToSql', 'MQL → SQL Rate (0–1)', '0.42')}
          {field('sqlToOpportunity', 'SQL → Opp Rate (0–1)', '0.55')}
          {field('opportunityToClosedWon', 'Opp → Won Rate (0–1)', '0.22')}
          {field('velocityLeadToMql', 'Lead→MQL Days', '8')}
          {field('velocityMqlToSql', 'MQL→SQL Days', '12')}
          {field('velocitySqlToOpp', 'SQL→Opp Days', '18')}
          {field('velocityOppToWon', 'Opp→Won Days', '35')}
          {field('pipelineCoverage', 'Pipeline Coverage Ratio', '2.8')}
        </>
      )}

      {section('Forecasting Accuracy', '🎯',
        <>
          {field('forecastQ1', 'Q1 Forecast ($)', '3200000')}
          {field('actualQ1', 'Q1 Actual ($)', '2850000')}
          {field('forecastQ2', 'Q2 Forecast ($)', '3500000')}
          {field('actualQ2', 'Q2 Actual ($)', '3100000')}
          {field('forecastQ3', 'Q3 Forecast ($)', '3800000')}
          {field('actualQ3', 'Q3 Actual ($)', '3950000')}
          {field('forecastQ4', 'Q4 Forecast ($)', '4200000')}
          {field('actualQ4', 'Q4 Actual ($)', '3700000')}
          {field('forecastQ5', 'Q5 Forecast ($)', '4500000')}
          {field('actualQ5', 'Q5 Actual ($)', '4100000')}
          {field('forecastQ6', 'Q6 Forecast ($)', '4800000')}
          {field('weightedPipelineAccuracy', 'Weighted Pipeline Accuracy (0–1)', '0.72')}
        </>
      )}

      {section('Unit Economics', '💰',
        <>
          {field('cac', 'CAC ($)', '18500')}
          {field('ltv', 'LTV ($)', '67000')}
          {field('cacPaybackMonths', 'CAC Payback (months)', '14')}
          {field('grossChurnRate', 'Gross Churn Rate (0–1)', '0.08')}
          {field('netRevenueRetention', 'Net Revenue Retention (0–2)', '1.12')}
        </>
      )}

      {section('Funnel Efficiency', '⚡',
        <>
          {field('leadToCloseRate', 'Lead-to-Close Rate (0–1)', '0.032')}
          {field('winRate', 'Win Rate (0–1)', '0.22')}
          {field('avgSalesCycleDays', 'Avg Sales Cycle (days)', '73')}
          {field('avgDealSize', 'Avg Deal Size ($)', '42000')}
          {field('leadsPerRep', 'Leads per Rep / month', '45')}
        </>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'demo' | 'input'
  const [activeTab, setActiveTab] = useState('summary');
  const [inputs, setInputs] = useState(DEFAULT_INPUT);
  const [scoreKey, setScoreKey] = useState(0); // force re-render for animations

  const activeData = mode === 'input' ? inputToData(inputs) : DEMO_DATA;
  const scores = computeAllScores(activeData);
  const narratives = generateNarratives(scores);

  const handleInput = useCallback((key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUT);
    setScoreKey(k => k + 1);
  }, []);

  const handleTryDemo = () => {
    setMode('demo');
    setActiveTab('summary');
    setScoreKey(k => k + 1);
  };

  const handleRunOwn = () => {
    setMode('input');
    setActiveTab('summary');
    setInputs(DEFAULT_INPUT);
    setScoreKey(k => k + 1);
  };

  const tabs = [
    { id: 'summary',     label: 'Summary',     icon: '◎' },
    { id: 'pipeline',    label: 'Pipeline',    icon: '🔀' },
    { id: 'forecasting', label: 'Forecasting', icon: '🎯' },
    { id: 'unitEcon',    label: 'Unit Econ',   icon: '💰' },
    { id: 'funnel',      label: 'Funnel',      icon: '⚡' },
    ...(mode === 'input' ? [{ id: 'inputs', label: 'Your Data', icon: '✏️' }] : []),
  ];

  // ── Landing ──────────────────────────────────────────────────────────────────
  if (mode === 'landing') {
    return (
      <div className="min-h-screen" style={{ background: '#0F172A', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
        {/* Nav */}
        <nav className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">RH</span>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">RevOps Healthcheck</span>
          </div>
          <button onClick={handleTryDemo}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
            Try Demo →
          </button>
        </nav>

        {/* Hero */}
        <main className="max-w-5xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Revenue Operations Diagnostic Tool
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-none mb-6">
              RevOps<br />
              <span style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Healthcheck
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
              Diagnose your SaaS revenue operations in minutes. Score pipeline health, forecasting accuracy, unit economics, and funnel efficiency — all benchmarked against SaaS industry data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleTryDemo}
                className="px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                Try the Demo
              </button>
              <button onClick={handleRunOwn}
                className="px-8 py-4 rounded-2xl text-base font-bold text-slate-300 border border-slate-600 hover:border-slate-400 hover:text-white transition-all duration-200 hover:scale-105">
                Run Your Own Diagnostic
              </button>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { icon: '🔀', title: 'Pipeline Health',      desc: 'Stage conversions, velocity, and coverage ratio scored against benchmarks.' },
              { icon: '🎯', title: 'Forecasting Accuracy', desc: 'Forecast vs. actuals across 6 quarters with systematic bias detection.' },
              { icon: '💰', title: 'Unit Economics',        desc: 'LTV:CAC, payback period, churn, and NRR with trend analysis.' },
              { icon: '⚡', title: 'Funnel Efficiency',     desc: 'Win rates, sales cycle, and per-rep productivity benchmarked to peers.' },
            ].map(f => (
              <div key={f.title}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-8 px-6 mt-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Built by <span className="text-slate-300 font-semibold">Chris Mongeon</span></span>
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com/in/cmongeon" target="_blank" rel="noopener noreferrer"
                className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                linkedin.com/in/cmongeon
              </a>
              <a href="mailto:mongeon.chris@gmail.com"
                className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                mongeon.chris@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  const h = healthLabel(scores.overall);

  return (
    <div className="min-h-screen" style={{ background: '#0F172A', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      {/* Dashboard Nav */}
      <nav className="border-b border-slate-800/60 sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(15,23,42,0.92)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => setMode('landing')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">RH</span>
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">RevOps Healthcheck</span>
          </button>

          {/* Company + score */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">{activeData.company}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${h.bg} ${h.text} ${h.border} font-mono`}>
              {scores.overall}/100
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700">
            <button onClick={() => { setMode('demo'); setActiveTab('summary'); setScoreKey(k => k+1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'demo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>Demo</button>
            <button onClick={() => { setMode('input'); setActiveTab(activeTab === 'summary' ? 'inputs' : activeTab); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'input' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>Your Data</button>
          </div>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-slate-800/60 sticky top-14 z-40 backdrop-blur-xl overflow-x-auto"
        style={{ background: 'rgba(15,23,42,0.92)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                activeTab === t.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
              {t.id !== 'summary' && t.id !== 'inputs' && scores[t.id] && (
                <span className={`ml-1 font-mono text-xs px-1.5 py-0.5 rounded ${
                  activeTab === t.id ? 'bg-indigo-600/30' : 'bg-slate-700/50'
                }`} style={{ color: healthLabel(scores[t.id].score).color }}>
                  {scores[t.id].score}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div key={`${activeTab}-${scoreKey}`}>
          {activeTab === 'summary' && (
            <SummaryTab scores={scores} narratives={narratives} data={activeData} onTabChange={setActiveTab} />
          )}
          {activeTab === 'pipeline' && (
            <PipelineTab scores={scores} narratives={narratives} data={activeData} />
          )}
          {activeTab === 'forecasting' && (
            <ForecastingTab scores={scores} narratives={narratives} data={activeData} />
          )}
          {activeTab === 'unitEcon' && (
            <UnitEconomicsTab scores={scores} narratives={narratives} data={activeData} />
          )}
          {activeTab === 'funnel' && (
            <FunnelTab scores={scores} narratives={narratives} data={activeData} />
          )}
          {activeTab === 'inputs' && (
            <InputFormTab inputs={inputs} onChange={handleInput} onReset={handleReset} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Built by <span className="text-slate-300 font-semibold">Chris Mongeon</span></span>
          <div className="flex items-center gap-4">
            <a href="https://linkedin.com/in/cmongeon" target="_blank" rel="noopener noreferrer"
              className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              linkedin.com/in/cmongeon
            </a>
            <a href="mailto:mongeon.chris@gmail.com"
              className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              mongeon.chris@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
