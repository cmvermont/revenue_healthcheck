/**
 * The scoring engine. Every number on screen comes from these functions, and the tests hold the
 * formulas shown on screen to the same results.
 *
 * Inputs are stored once. Anything that can be worked out from other inputs is derived here and
 * never typed in a second time: win rate is the opportunity-to-won stage rate, the sales cycle is
 * the opportunity-to-won stage days, and lead-to-close is the product of the four stage rates.
 */

export type Band = { poor: number; good: number; excellent: number };

export type Quarter = { label: string; forecast: number; actual: number | null };

export type Inputs = {
  company: string;
  stage: string;
  arr: number;
  salesTeamSize: number;
  conversion: { leadToMql: number; mqlToSql: number; sqlToOpp: number; oppToWon: number };
  stageDays: { leadToMql: number; mqlToSql: number; sqlToOpp: number; oppToWon: number };
  coverage: number;
  quarters: Quarter[];
  weightedPipelineAccuracy: number;
  cac: number;
  ltv: number;
  paybackMonths: number;
  grossChurn: number;
  nrr: number;
  avgDealSize: number;
  leadsPerRep: number;
};

export type StageKey = keyof Inputs["conversion"];
export const STAGES: { key: StageKey; label: string; from: string; to: string }[] = [
  { key: "leadToMql", label: "Lead → MQL", from: "Leads", to: "MQLs" },
  { key: "mqlToSql", label: "MQL → SQL", from: "MQLs", to: "SQLs" },
  { key: "sqlToOpp", label: "SQL → Opp", from: "SQLs", to: "Opportunities" },
  { key: "oppToWon", label: "Opp → Won", from: "Opportunities", to: "Won" },
];

/**
 * Benchmark ranges. Each scored input's range comes from a published source, recorded in
 * sources.ts with how each end was set. Good is the published median or average. Poor and best are
 * the published quartiles where a source gives them; where it does not, sources.ts says how they
 * were set, and the methodology page shows it.
 */
export const BENCHMARKS = {
  // First Page Sage averages for $10M to $100M ARR companies; ends set at half and one and a half times the average.
  leadToMql: { poor: 0.205, good: 0.41, excellent: 0.615 },
  mqlToSql: { poor: 0.195, good: 0.39, excellent: 0.585 },
  sqlToOpp: { poor: 0.21, good: 0.42, excellent: 0.63 },
  // No survey distribution found; 3x is the long-standing rule of thumb.
  coverage: { poor: 1.5, good: 3, excellent: 4.5 },
  // Gartner: median accuracy 70% to 79%, 7% of organizations reach 90% or higher.
  forecastAccuracy: { poor: 0.6, good: 0.75, excellent: 0.9 },
  weightedPipelineAccuracy: { poor: 0.6, good: 0.75, excellent: 0.9 },
  // Benchmarkit and Aleph, 2026 edition, full-year 2025: 25th percentile, median, 75th percentile.
  ltvCac: { poor: 1.1, good: 4.1, excellent: 7.8 },
  paybackMonths: { poor: 24, good: 16, excellent: 10 },
  grossChurn: { poor: 0.24, good: 0.16, excellent: 0.09 },
  nrr: { poor: 0.92, good: 1.02, excellent: 1.1 },
  // Bridge Group 2024 and Ebsta with Pavilion 2025: median 19%, top performers 43% higher.
  winRate: { poor: 0.11, good: 0.19, excellent: 0.27 },
  // Ebsta with Pavilion 2025: new business closes in 91 days, top performers 42% faster.
  salesCycle: { poor: 129, good: 91, excellent: 53 },
} satisfies Record<string, Band>;

/** SiriusDecisions counts a forecast as missed when it lands more than 10% from the actual. Bias is shown against this line, not scored. */
export const FORECAST_MISS_LINE = 0.1;

export type MetricId = keyof typeof BENCHMARKS;
export type ModuleId = "pipeline" | "forecast" | "unitEconomics" | "funnel";

/** Which direction is better for each scored metric. */
export const LOWER_IS_BETTER: Record<MetricId, boolean> = {
  leadToMql: false,
  mqlToSql: false,
  sqlToOpp: false,
  coverage: false,
  forecastAccuracy: false,
  weightedPipelineAccuracy: false,
  ltvCac: false,
  paybackMonths: true,
  grossChurn: true,
  nrr: false,
  winRate: false,
  salesCycle: true,
};

/**
 * The four checks and the share of each check that every input carries. No input is scored in two
 * checks. Inputs with no published benchmark (forecast bias, leads per rep) are shown, not scored.
 */
export const MODULES: { id: ModuleId; name: string; weight: number; parts: [MetricId, number][] }[] = [
  {
    id: "pipeline",
    name: "Pipeline health",
    weight: 0.3,
    parts: [
      ["leadToMql", 0.2],
      ["mqlToSql", 0.25],
      ["sqlToOpp", 0.25],
      ["coverage", 0.3],
    ],
  },
  {
    id: "forecast",
    name: "Forecast accuracy",
    weight: 0.25,
    parts: [
      ["forecastAccuracy", 0.6],
      ["weightedPipelineAccuracy", 0.4],
    ],
  },
  {
    id: "unitEconomics",
    name: "Unit economics",
    weight: 0.25,
    parts: [
      ["ltvCac", 0.3],
      ["paybackMonths", 0.25],
      ["grossChurn", 0.25],
      ["nrr", 0.2],
    ],
  },
  {
    id: "funnel",
    name: "Funnel efficiency",
    weight: 0.2,
    parts: [
      ["winRate", 0.5],
      ["salesCycle", 0.5],
    ],
  },
];

// ─── Derived values ──────────────────────────────────────────────────────────

export const leadToClose = (x: Inputs) => x.conversion.leadToMql * x.conversion.mqlToSql * x.conversion.sqlToOpp * x.conversion.oppToWon;
export const winRate = (x: Inputs) => x.conversion.oppToWon;
/** The sales cycle as published benchmarks measure it: days from opportunity to a won deal. */
export const salesCycle = (x: Inputs) => x.stageDays.oppToWon;
/** Days from a new lead to a won deal: the four stage days added. Shown, not scored. */
export const leadToCloseDays = (x: Inputs) => x.stageDays.leadToMql + x.stageDays.mqlToSql + x.stageDays.sqlToOpp + x.stageDays.oppToWon;
export const ltvCac = (x: Inputs) => (x.cac > 0 ? x.ltv / x.cac : NaN);
export const dealsPerRep = (x: Inputs) => x.leadsPerRep * leadToClose(x);
export const opportunitiesPerRep = (x: Inputs) => x.leadsPerRep * x.conversion.leadToMql * x.conversion.mqlToSql * x.conversion.sqlToOpp;
export const revenuePerRep = (x: Inputs) => dealsPerRep(x) * x.avgDealSize * 12;

/** What a number of leads becomes at each stage at these conversion rates. */
export function funnelCounts(x: Inputs, leads = 1000): number[] {
  const out = [leads];
  for (const s of STAGES) out.push(out[out.length - 1] * x.conversion[s.key]);
  return out;
}

export const quarterAccuracy = (forecast: number, actual: number) => (actual > 0 ? Math.max(0, 1 - Math.abs(forecast - actual) / actual) : NaN);
export const quarterBias = (forecast: number, actual: number) => (actual > 0 ? (forecast - actual) / actual : NaN);

export type QuarterResult = Quarter & { actual: number; accuracy: number; bias: number };

/** Closed quarters are the ones with an actual. An open quarter is charted but not scored. */
export function closedQuarters(x: Inputs): QuarterResult[] {
  return x.quarters
    .filter((q): q is Quarter & { actual: number } => q.actual !== null && q.actual > 0)
    .map((q) => ({ ...q, accuracy: quarterAccuracy(q.forecast, q.actual), bias: quarterBias(q.forecast, q.actual) }));
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const averageAccuracy = (x: Inputs) => mean(closedQuarters(x).map((q) => q.accuracy));
/** Positive means the forecast ran above the actual. */
export const averageBias = (x: Inputs) => mean(closedQuarters(x).map((q) => q.bias));

/** The value each scored metric is measured at. */
export function metricValues(x: Inputs): Record<MetricId, number> {
  return {
    leadToMql: x.conversion.leadToMql,
    mqlToSql: x.conversion.mqlToSql,
    sqlToOpp: x.conversion.sqlToOpp,
    coverage: x.coverage,
    forecastAccuracy: averageAccuracy(x),
    weightedPipelineAccuracy: x.weightedPipelineAccuracy,
    ltvCac: ltvCac(x),
    paybackMonths: x.paybackMonths,
    grossChurn: x.grossChurn,
    nrr: x.nrr,
    winRate: winRate(x),
    salesCycle: salesCycle(x),
  };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Places a value on a 0 to 100 scale against its band. Poor scores 20, good 60, excellent 100,
 * with straight lines between. Past excellent the score holds at 100. Short of poor it falls
 * toward zero: to zero at a value of zero when higher is better, and to zero at twice the poor
 * value when lower is better. A value that is not a number scores zero.
 */
export function scoreMetric(value: number, band: Band, lowerIsBetter = false): number {
  if (!Number.isFinite(value)) return 0;
  const { poor, good, excellent } = band;
  let s: number;
  if (!lowerIsBetter) {
    if (value >= excellent) s = 100;
    else if (value >= good) s = 60 + ((value - good) / (excellent - good)) * 40;
    else if (value >= poor) s = 20 + ((value - poor) / (good - poor)) * 40;
    else s = (value / poor) * 20;
  } else {
    if (value <= excellent) s = 100;
    else if (value <= good) s = 60 + ((good - value) / (good - excellent)) * 40;
    else if (value <= poor) s = 20 + ((poor - value) / (poor - good)) * 40;
    else s = 20 - ((value - poor) / poor) * 20;
  }
  return Math.min(100, Math.max(0, s));
}

export type Health = "good" | "warn" | "critical";
export const HEALTH_LABEL: Record<Health, string> = { good: "Healthy", warn: "Moderate", critical: "At risk" };

/** A check or the overall score: 80 and up is healthy, 60 to 79 moderate, under 60 at risk. */
export const healthOfScore = (score: number): Health => (score >= 80 ? "good" : score >= 60 ? "warn" : "critical");

/** A single input against its band: at or past good is healthy, between poor and good moderate, past poor at risk. */
export function healthOfValue(value: number, band: Band, lowerIsBetter = false): Health {
  if (!Number.isFinite(value)) return "critical";
  if (lowerIsBetter) return value <= band.good ? "good" : value <= band.poor ? "warn" : "critical";
  return value >= band.good ? "good" : value >= band.poor ? "warn" : "critical";
}

export type PartResult = { id: MetricId; value: number; band: Band; lowerIsBetter: boolean; weight: number; score: number; points: number };
export type ModuleResult = { id: ModuleId; name: string; weight: number; parts: PartResult[]; score: number };
export type Result = { modules: Record<ModuleId, ModuleResult>; overall: number };

/** Scores every check, then the overall score from the rounded check scores, so the arithmetic on screen adds up. */
export function score(x: Inputs): Result {
  const values = metricValues(x);
  const modules = {} as Record<ModuleId, ModuleResult>;
  for (const m of MODULES) {
    const parts = m.parts.map(([id, weight]) => {
      const s = scoreMetric(values[id], BENCHMARKS[id], LOWER_IS_BETTER[id]);
      return { id, value: values[id], band: BENCHMARKS[id], lowerIsBetter: LOWER_IS_BETTER[id], weight, score: s, points: s * weight };
    });
    modules[m.id] = { id: m.id, name: m.name, weight: m.weight, parts, score: Math.round(parts.reduce((a, p) => a + p.points, 0)) };
  }
  const overall = overallScore(modules.pipeline.score, modules.forecast.score, modules.unitEconomics.score, modules.funnel.score);
  return { modules, overall };
}

export const WEIGHT: Record<ModuleId, number> = Object.fromEntries(MODULES.map((m) => [m.id, m.weight])) as Record<ModuleId, number>;

export const overallScore = (pipeline: number, forecast: number, unitEconomics: number, funnel: number) =>
  Math.round(pipeline * WEIGHT.pipeline + forecast * WEIGHT.forecast + unitEconomics * WEIGHT.unitEconomics + funnel * WEIGHT.funnel);

/** The stage with the most days, for the funnel chart. */
export function longestStage(x: Inputs): { key: StageKey; label: string; days: number } {
  return STAGES.map((st) => ({ key: st.key, label: st.label, days: x.stageDays[st.key] })).reduce((a, b) => (b.days > a.days ? b : a));
}

/** The module ids from the lowest score to the highest. Ties keep the order of MODULES. */
export const weakestFirst = (r: Result): ModuleId[] => MODULES.map((m) => m.id).sort((a, b) => r.modules[a].score - r.modules[b].score);
