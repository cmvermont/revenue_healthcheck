// ─── Demo Data ────────────────────────────────────────────────────────────────
export const DEMO_DATA = {
  company: 'Acme SaaS',
  stage: 'Series B',
  arr: 15000000,
  salesTeamSize: 80,
  pipeline: {
    stageConversion: {
      leadToMql: 0.35,
      mqlToSql: 0.42,
      sqlToOpportunity: 0.55,
      opportunityToClosedWon: 0.22,
    },
    velocityDays: {
      leadToMql: 8,
      mqlToSql: 12,
      sqlToOpportunity: 18,
      opportunityToClosedWon: 35,
    },
    pipelineCoverageRatio: 2.8,
  },
  forecasting: {
    quarters: [
      { quarter: 'Q1 2025', forecast: 3200000, actual: 2850000 },
      { quarter: 'Q2 2025', forecast: 3500000, actual: 3100000 },
      { quarter: 'Q3 2025', forecast: 3800000, actual: 3950000 },
      { quarter: 'Q4 2025', forecast: 4200000, actual: 3700000 },
      { quarter: 'Q1 2026', forecast: 4500000, actual: 4100000 },
      { quarter: 'Q2 2026', forecast: 4800000, actual: null },
    ],
    weightedPipelineAccuracy: 0.72,
  },
  unitEconomics: {
    cac: 18500,
    ltv: 67000,
    ltvCacRatio: 3.62,
    cacPaybackMonths: 14,
    grossChurnRate: 0.08,
    netRevenueRetention: 1.12,
  },
  funnelEfficiency: {
    leadToCloseRate: 0.032,
    winRate: 0.22,
    avgSalesCycleDays: 73,
    avgDealSize: 42000,
    leadsPerRep: 45,
  },
};

// ─── Benchmarks ───────────────────────────────────────────────────────────────
export const BENCHMARKS = {
  pipeline: {
    leadToMql:              { poor: 0.15, good: 0.30, excellent: 0.45 },
    mqlToSql:               { poor: 0.20, good: 0.40, excellent: 0.60 },
    sqlToOpportunity:       { poor: 0.30, good: 0.50, excellent: 0.70 },
    opportunityToClosedWon: { poor: 0.15, good: 0.25, excellent: 0.35 },
    pipelineCoverage:       { poor: 1.5,  good: 3.0,  excellent: 4.5 },
    totalVelocityDays:      { poor: 120,  good: 75,   excellent: 45 },
  },
  forecasting: {
    accuracy:      { poor: 0.60, good: 0.80, excellent: 0.95 },
    biasThreshold: 0.10,
  },
  unitEconomics: {
    ltvCacRatio:      { poor: 1.5,  good: 3.0,  excellent: 5.0 },
    cacPaybackMonths: { poor: 24,   good: 15,   excellent: 8 },
    grossChurn:       { poor: 0.15, good: 0.08, excellent: 0.03 },
    netRevenueRetention: { poor: 0.90, good: 1.10, excellent: 1.30 },
  },
  funnelEfficiency: {
    leadToClose:     { poor: 0.01, good: 0.03, excellent: 0.06 },
    winRate:         { poor: 0.15, good: 0.25, excellent: 0.35 },
    salesCycleDays:  { poor: 120,  good: 75,   excellent: 40 },
    leadsPerRep:     { poor: 20,   good: 40,   excellent: 60 },
  },
};

// ─── Default Input State (mirrors demo data for form fields) ──────────────────
export const DEFAULT_INPUT = {
  company: 'Acme SaaS',
  stage: 'Series B',
  arr: 15000000,
  salesTeamSize: 80,
  leadToMql: 0.35,
  mqlToSql: 0.42,
  sqlToOpportunity: 0.55,
  opportunityToClosedWon: 0.22,
  velocityLeadToMql: 8,
  velocityMqlToSql: 12,
  velocitySqlToOpp: 18,
  velocityOppToWon: 35,
  pipelineCoverage: 2.8,
  forecastQ1: 3200000, actualQ1: 2850000,
  forecastQ2: 3500000, actualQ2: 3100000,
  forecastQ3: 3800000, actualQ3: 3950000,
  forecastQ4: 4200000, actualQ4: 3700000,
  forecastQ5: 4500000, actualQ5: 4100000,
  forecastQ6: 4800000,
  weightedPipelineAccuracy: 0.72,
  cac: 18500,
  ltv: 67000,
  cacPaybackMonths: 14,
  grossChurnRate: 0.08,
  netRevenueRetention: 1.12,
  leadToCloseRate: 0.032,
  winRate: 0.22,
  avgSalesCycleDays: 73,
  avgDealSize: 42000,
  leadsPerRep: 45,
};
