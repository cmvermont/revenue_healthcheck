import { BENCHMARKS } from './data.js';

// ─── Utility: Score a metric on 0–100 scale ───────────────────────────────────
// higherIsBetter = true: higher value → higher score
// higherIsBetter = false: lower value → higher score (e.g. churn, cycle days)
function scoreMetric(value, benchmark, higherIsBetter = true) {
  const { poor, good, excellent } = benchmark;
  if (higherIsBetter) {
    if (value >= excellent) return 100;
    if (value >= good) return 60 + ((value - good) / (excellent - good)) * 40;
    if (value >= poor) return 20 + ((value - poor) / (good - poor)) * 40;
    return Math.max(0, (value / poor) * 20);
  } else {
    // Lower is better — invert
    if (value <= excellent) return 100;
    if (value <= good) return 60 + ((good - value) / (good - excellent)) * 40;
    if (value <= poor) return 20 + ((poor - value) / (poor - good)) * 40;
    return Math.max(0, 20 - ((value - poor) / poor) * 20);
  }
}

// ─── Pipeline Health Score ─────────────────────────────────────────────────────
export function scorePipeline(data) {
  const b = BENCHMARKS.pipeline;
  const conv = data.pipeline.stageConversion;
  const vel = data.pipeline.velocityDays;

  const totalVelocity =
    vel.leadToMql + vel.mqlToSql + vel.sqlToOpportunity + vel.opportunityToClosedWon;

  const scores = {
    leadToMql:              scoreMetric(conv.leadToMql, b.leadToMql),
    mqlToSql:               scoreMetric(conv.mqlToSql, b.mqlToSql),
    sqlToOpportunity:       scoreMetric(conv.sqlToOpportunity, b.sqlToOpportunity),
    opportunityToClosedWon: scoreMetric(conv.opportunityToClosedWon, b.opportunityToClosedWon),
    pipelineCoverage:       scoreMetric(data.pipeline.pipelineCoverageRatio, b.pipelineCoverage),
    velocity:               scoreMetric(totalVelocity, b.totalVelocityDays, false),
  };

  // Weighted average
  const weights = [0.20, 0.20, 0.15, 0.20, 0.15, 0.10];
  const vals = Object.values(scores);
  const total = vals.reduce((sum, s, i) => sum + s * weights[i], 0);

  return { score: Math.round(total), breakdown: scores, totalVelocity };
}

// ─── Forecasting Accuracy Score ───────────────────────────────────────────────
export function scoreForecasting(data) {
  const b = BENCHMARKS.forecasting;
  const quarters = data.forecasting.quarters.filter(q => q.actual !== null);

  // Per-quarter accuracy: 1 - |variance|
  const accuracies = quarters.map(q => {
    const acc = 1 - Math.abs((q.forecast - q.actual) / q.actual);
    return Math.max(0, acc);
  });
  const avgAccuracy = accuracies.length
    ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    : data.forecasting.weightedPipelineAccuracy;

  // Bias: systematic over/under forecasting
  const biases = quarters.map(q => (q.forecast - q.actual) / q.actual);
  const avgBias = biases.length
    ? biases.reduce((a, b) => a + b, 0) / biases.length
    : 0;
  const absAvgBias = Math.abs(avgBias);
  const biasScore = absAvgBias <= b.biasThreshold ? 100
    : absAvgBias <= 0.20 ? 60
    : absAvgBias <= 0.30 ? 30
    : 10;

  const accuracyScore = scoreMetric(avgAccuracy, b.accuracy);
  const pipelineScore = scoreMetric(data.forecasting.weightedPipelineAccuracy, b.accuracy);

  const total = accuracyScore * 0.50 + biasScore * 0.25 + pipelineScore * 0.25;

  return {
    score: Math.round(total),
    breakdown: { accuracyScore, biasScore, pipelineScore },
    avgAccuracy,
    avgBias,
    quarterAccuracies: quarters.map((q, i) => ({
      ...q,
      accuracy: accuracies[i],
      bias: biases[i],
    })),
  };
}

// ─── Unit Economics Score ─────────────────────────────────────────────────────
export function scoreUnitEconomics(data) {
  const b = BENCHMARKS.unitEconomics;
  const ue = data.unitEconomics;

  const ltvCac = ue.ltvCacRatio ?? (ue.ltv / ue.cac);

  const scores = {
    ltvCacRatio:         scoreMetric(ltvCac, b.ltvCacRatio),
    cacPayback:          scoreMetric(ue.cacPaybackMonths, b.cacPaybackMonths, false),
    grossChurn:          scoreMetric(ue.grossChurnRate, b.grossChurn, false),
    netRevenueRetention: scoreMetric(ue.netRevenueRetention, b.netRevenueRetention),
  };

  const weights = [0.30, 0.25, 0.25, 0.20];
  const vals = Object.values(scores);
  const total = vals.reduce((sum, s, i) => sum + s * weights[i], 0);

  return { score: Math.round(total), breakdown: scores, ltvCac };
}

// ─── Funnel Efficiency Score ──────────────────────────────────────────────────
export function scoreFunnelEfficiency(data) {
  const b = BENCHMARKS.funnelEfficiency;
  const fe = data.funnelEfficiency;

  const scores = {
    leadToClose:  scoreMetric(fe.leadToCloseRate, b.leadToClose),
    winRate:      scoreMetric(fe.winRate, b.winRate),
    salesCycle:   scoreMetric(fe.avgSalesCycleDays, b.salesCycleDays, false),
    leadsPerRep:  scoreMetric(fe.leadsPerRep, b.leadsPerRep),
  };

  const weights = [0.25, 0.30, 0.25, 0.20];
  const vals = Object.values(scores);
  const total = vals.reduce((sum, s, i) => sum + s * weights[i], 0);

  return { score: Math.round(total), breakdown: scores };
}

// ─── Composite Score ──────────────────────────────────────────────────────────
export function computeAllScores(data) {
  const pipeline    = scorePipeline(data);
  const forecasting = scoreForecasting(data);
  const unitEcon    = scoreUnitEconomics(data);
  const funnel      = scoreFunnelEfficiency(data);

  const overall = Math.round(
    pipeline.score    * 0.30 +
    forecasting.score * 0.25 +
    unitEcon.score    * 0.25 +
    funnel.score      * 0.20
  );

  return { pipeline, forecasting, unitEcon, funnel, overall };
}

// ─── Health Label ─────────────────────────────────────────────────────────────
export function healthLabel(score) {
  if (score >= 80) return { label: 'Healthy',  color: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (score >= 60) return { label: 'Moderate', color: '#F59E0B', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30' };
  return              { label: 'At Risk',  color: '#F43F5E', bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/30' };
}

// ─── Diagnostic Narratives ────────────────────────────────────────────────────
export function generateNarratives(scores) {
  const { pipeline, forecasting, unitEcon, funnel } = scores;

  return {
    pipeline: pipeline.score >= 80
      ? `Your pipeline is performing at or above best-in-class benchmarks with strong conversion rates and efficient velocity. Continue monitoring coverage ratio to sustain momentum.`
      : pipeline.score >= 60
      ? `Pipeline health is moderate — conversion rates show promise but there's meaningful leakage between stages. Focus on the ${
          pipeline.breakdown.opportunityToClosedWon < 55 ? 'Opportunity → Closed Won' : 'SQL → Opportunity'
        } stage, where the biggest gap versus benchmark exists.`
      : `Pipeline health requires immediate attention. Low coverage ratio (${pipeline.score < 50 ? 'below 2x' : 'approaching minimum thresholds'}) and weak stage conversions are putting revenue targets at risk this quarter.`,

    forecasting: forecasting.score >= 80
      ? `Forecasting accuracy is strong and systematic bias is minimal. Your forecast process is a competitive advantage for resource allocation and investor confidence.`
      : forecasting.score >= 60
      ? `Forecasting shows moderate reliability but systematic ${forecasting.avgBias > 0 ? 'over-forecasting' : 'under-forecasting'} bias of ~${Math.abs(Math.round(forecasting.avgBias * 100))}% suggests methodological gaps. Review pipeline stage weighting and rep self-reporting accuracy.`
      : `Forecasting accuracy is significantly below benchmark, with ${Math.abs(Math.round(forecasting.avgBias * 100))}% average ${forecasting.avgBias > 0 ? 'over-forecast' : 'under-forecast'} bias. This directly impacts board credibility and operational planning — improving forecast methodology should be an immediate priority.`,

    unitEcon: unitEcon.score >= 80
      ? `Unit economics are excellent. Your LTV:CAC ratio and payback period indicate a highly efficient, scalable go-to-market motion that supports aggressive growth investment.`
      : unitEcon.score >= 60
      ? `Unit economics are healthy but have room to improve. ${unitEcon.ltvCac < 3 ? 'LTV:CAC ratio is below the 3:1 benchmark — focus on expansion revenue and churn reduction.' : 'CAC payback period exceeds best-in-class — improving sales efficiency can accelerate path to profitability.'}`
      : `Unit economics are under pressure. ${unitEcon.breakdown.grossChurn < 40 ? 'Elevated gross churn is eroding LTV and inflating effective CAC.' : 'High CAC relative to LTV signals go-to-market inefficiency.'} Address churn and expansion motion before scaling acquisition spend.`,

    funnel: funnel.score >= 80
      ? `Funnel efficiency is best-in-class. Your win rate and sales cycle are benchmarking above peers, indicating strong product-market fit and a well-trained sales team.`
      : funnel.score >= 60
      ? `Funnel efficiency is moderate. Win rate and lead-to-close are near benchmark but ${funnel.breakdown.salesCycle < 55 ? 'sales cycle length is dragging overall efficiency — tighten your qualification criteria to reduce time spent on low-probability deals.' : 'leads-per-rep may be constraining throughput — review territory design and SDR capacity.'}`
      : `Funnel efficiency is materially below benchmark. Low lead-to-close and win rates suggest qualification gaps or competitive positioning issues. Prioritize sales process audit and ICP refinement to recover revenue velocity.`,
  };
}

// ─── Input form → structured data ─────────────────────────────────────────────
export function inputToData(inp) {
  return {
    company: inp.company,
    stage: inp.stage,
    arr: Number(inp.arr),
    salesTeamSize: Number(inp.salesTeamSize),
    pipeline: {
      stageConversion: {
        leadToMql:              Number(inp.leadToMql),
        mqlToSql:               Number(inp.mqlToSql),
        sqlToOpportunity:       Number(inp.sqlToOpportunity),
        opportunityToClosedWon: Number(inp.opportunityToClosedWon),
      },
      velocityDays: {
        leadToMql:              Number(inp.velocityLeadToMql),
        mqlToSql:               Number(inp.velocityMqlToSql),
        sqlToOpportunity:       Number(inp.velocitySqlToOpp),
        opportunityToClosedWon: Number(inp.velocityOppToWon),
      },
      pipelineCoverageRatio: Number(inp.pipelineCoverage),
    },
    forecasting: {
      quarters: [
        { quarter: 'Q1', forecast: Number(inp.forecastQ1), actual: inp.actualQ1 !== '' ? Number(inp.actualQ1) : null },
        { quarter: 'Q2', forecast: Number(inp.forecastQ2), actual: inp.actualQ2 !== '' ? Number(inp.actualQ2) : null },
        { quarter: 'Q3', forecast: Number(inp.forecastQ3), actual: inp.actualQ3 !== '' ? Number(inp.actualQ3) : null },
        { quarter: 'Q4', forecast: Number(inp.forecastQ4), actual: inp.actualQ4 !== '' ? Number(inp.actualQ4) : null },
        { quarter: 'Q5', forecast: Number(inp.forecastQ5), actual: inp.actualQ5 !== '' ? Number(inp.actualQ5) : null },
        { quarter: 'Q6', forecast: Number(inp.forecastQ6), actual: null },
      ],
      weightedPipelineAccuracy: Number(inp.weightedPipelineAccuracy),
    },
    unitEconomics: {
      cac:                Number(inp.cac),
      ltv:                Number(inp.ltv),
      ltvCacRatio:        Number(inp.ltv) / Number(inp.cac),
      cacPaybackMonths:   Number(inp.cacPaybackMonths),
      grossChurnRate:     Number(inp.grossChurnRate),
      netRevenueRetention: Number(inp.netRevenueRetention),
    },
    funnelEfficiency: {
      leadToCloseRate:  Number(inp.leadToCloseRate),
      winRate:          Number(inp.winRate),
      avgSalesCycleDays: Number(inp.avgSalesCycleDays),
      avgDealSize:      Number(inp.avgDealSize),
      leadsPerRep:      Number(inp.leadsPerRep),
    },
  };
}
