export type Term = {
  id: string;
  name: string;
  /** One or two sentences, shown in the info bubble. */
  short: string;
  /** Links to an entry in formulas.ts. */
  formulaId?: string;
  /** Worked numbers from the example company. */
  example?: string;
  /** The main way the term misleads. */
  caveat?: string;
  /** Other names a reader may know it by. */
  aliases?: string[];
  group: "Scoring" | "Pipeline" | "Forecast" | "Unit economics" | "Funnel";
};

const list: Term[] = [
  // Scoring
  {
    id: "benchmarkRange",
    group: "Scoring",
    name: "Benchmark range",
    short: "Three values for each scored input: poor, good, and best. Poor scores 20, good 60, and best 100, with straight lines between.",
    example: "Pipeline coverage runs 1.5x, 3.0x, 4.5x. Acme's 2.8x sits just short of good and scores 54.7.",
    caveat: "The ranges here are illustrative for a B2B SaaS company selling mid-market annual contracts. They are not taken from a cited dataset, and every score moves with them.",
  },
  {
    id: "inputScore",
    group: "Scoring",
    name: "Input score",
    short: "One input placed on a 0 to 100 scale against its benchmark range. Past best it holds at 100. Short of poor it falls toward zero.",
    caveat: "Where lower is better, such as churn or payback, the scale runs the other way.",
  },
  {
    id: "checkScore",
    group: "Scoring",
    name: "Check score",
    short: "Each input score in a check multiplied by its weight and added, then rounded. The weights are shown in each check's breakdown table.",
    example: "Pipeline health: 73.3 × 20% + 64.0 × 25% + 70.0 × 25% + 54.7 × 30% = 65.",
    caveat: "No input counts in two checks, so a weak input lowers one check, not two.",
  },
  {
    id: "overallScore",
    group: "Scoring",
    name: "Overall score",
    short: "The four check scores weighted and added.",
    formulaId: "overallScore",
    example: "65 × 30% + 70 × 25% + 66 × 25% + 60 × 20% = 66.",
  },
  {
    id: "health",
    group: "Scoring",
    name: "Healthy, moderate, at risk",
    short: "A check or overall score of 80 or more is healthy, 60 to 79 moderate, and under 60 at risk. A single input is healthy at or past its good value and at risk past its poor value.",
    caveat: "An input at exactly its good value scores 60, so a check whose inputs all sit at good is moderate, not healthy.",
  },

  // Pipeline
  { id: "leadToMql", group: "Pipeline", name: "Lead → MQL rate", short: "The share of new leads that marketing qualifies.", caveat: "A loose MQL definition raises this rate and lowers the next one.", aliases: ["MQL rate"] },
  {
    id: "mqlToSql",
    group: "Pipeline",
    name: "MQL → SQL rate",
    short: "The share of marketing-qualified leads that sales accepts.",
    caveat: "A low rate often means the two teams qualify on different rules, not that the leads are bad.",
    aliases: ["SAL rate", "MQL acceptance"],
  },
  { id: "sqlToOpp", group: "Pipeline", name: "SQL → Opp rate", short: "The share of sales-accepted leads that become an opportunity with a defined deal and a buyer." },
  {
    id: "coverage",
    group: "Pipeline",
    name: "Pipeline coverage",
    short: "Open pipeline for the period divided by the quota or target for the period.",
    example: "2.8x means $2.80 of open pipeline for each $1 of target.",
    caveat: "Coverage counts deals at face value. A pipeline full of early-stage deals can show 3x and still miss.",
  },
  {
    id: "stageDays",
    group: "Pipeline",
    name: "Stage days",
    short: "The average days a deal takes to move from one stage to the next.",
    caveat: "An average hides a long tail. A few stalled deals can sit inside a normal-looking number.",
  },
  {
    id: "referenceDays",
    group: "Pipeline",
    name: "Stage reference days",
    short: "A comparison point for each stage: 5 days to MQL, 8 to SQL, 15 to opportunity, and 30 to won. Used to name the slowest stage. Not scored.",
  },
  {
    id: "leadToClose",
    group: "Pipeline",
    name: "Lead-to-close rate",
    short: "The share of all leads that end as a won deal: the four stage rates multiplied together.",
    formulaId: "leadToClose",
    example: "35% × 42% × 55% × 22% = 1.78%.",
    caveat: "Not scored, because each of its four parts already is.",
    aliases: ["end-to-end conversion"],
  },

  // Forecast
  { id: "forecast", group: "Forecast", name: "Forecast", short: "The revenue committed for a quarter, recorded before the quarter closed." },
  { id: "actual", group: "Forecast", name: "Actual", short: "The revenue booked in the same quarter." },
  { id: "openQuarter", group: "Forecast", name: "Open quarter", short: "A quarter with a forecast and no actual yet. It is charted and not scored." },
  {
    id: "quarterAccuracy",
    group: "Forecast",
    name: "Quarter accuracy",
    short: "How close one quarter's forecast came, as a share of the actual.",
    formulaId: "quarterAccuracy",
    example: "Q1 2025: 1 − |$3,200,000 − $2,850,000| ÷ $2,850,000 = 87.7%.",
    caveat: "A quarter missed by more than its whole actual scores zero, not a negative number.",
  },
  {
    id: "forecastAccuracy",
    group: "Forecast",
    name: "Forecast accuracy",
    short: "The average quarter accuracy across closed quarters.",
    example: "Acme's five closed quarters average 89.5%.",
    caveat: "An average can look healthy while every quarter misses in the same direction. Bias catches that.",
  },
  {
    id: "forecastBias",
    group: "Forecast",
    name: "Forecast bias",
    short: "The average of each closed quarter's (forecast − actual) ÷ actual. Positive means the forecast ran above what closed. Scored on its size in either direction.",
    formulaId: "quarterBias",
    example: "Acme's bias is +8.9%: four of five quarters closed below forecast.",
    caveat: "Misses high and low cancel out, so a small bias can sit next to poor accuracy.",
  },
  {
    id: "weightedPipelineAccuracy",
    group: "Forecast",
    name: "Weighted pipeline accuracy",
    short: "How closely stage-weighted pipeline at the start of the quarter predicted what closed. Entered as one figure.",
    caveat: "It is only as good as the stage probabilities. Recalibrate them against the close rate each stage has delivered.",
  },

  // Unit economics
  {
    id: "cac",
    group: "Unit economics",
    name: "Customer acquisition cost",
    short: "Sales and marketing spend for a period divided by the new customers won in it.",
    caveat: "Leaving out salaries, tools, or agency fees makes CAC look cheaper than it is.",
    aliases: ["CAC"],
  },
  {
    id: "ltv",
    group: "Unit economics",
    name: "Lifetime value",
    short: "The gross margin a customer is expected to bring in over their whole time as a customer. Entered as one figure.",
    caveat: "It is usually margin per period divided by churn, which assumes churn stays constant. Revenue in place of margin overstates it.",
    aliases: ["LTV", "CLV"],
  },
  {
    id: "ltvCac",
    group: "Unit economics",
    name: "LTV to CAC",
    short: "Lifetime value for each dollar spent to win a customer.",
    formulaId: "ltvCac",
    example: "$67,000 ÷ $18,500 = 3.62x.",
    caveat: "A very high ratio can mean the company is spending too little on growth.",
    aliases: ["LTV:CAC"],
  },
  {
    id: "payback",
    group: "Unit economics",
    name: "CAC payback",
    short: "Months of gross margin from a new customer needed to recover what it cost to win them.",
    caveat: "Payback worked out on revenue instead of gross margin looks shorter than it is.",
    aliases: ["payback period"],
  },
  {
    id: "grossChurn",
    group: "Unit economics",
    name: "Gross revenue churn",
    short: "Annual recurring revenue lost to cancellations and downgrades, before any expansion.",
    caveat: "Expansion does not offset it. Net revenue retention is the measure that nets the two.",
  },
  {
    id: "nrr",
    group: "Unit economics",
    name: "Net revenue retention",
    short: "Recurring revenue a year later from the customers you started the year with, after expansion, downgrades, and churn.",
    example: "112% means last year's customers pay 12% more this year.",
    aliases: ["NRR", "NDR"],
  },

  // Funnel
  {
    id: "winRate",
    group: "Funnel",
    name: "Win rate",
    short: "The share of opportunities that close won. It is the Opp → Won stage rate, entered once.",
    caveat: "Clearing lost deals out of the pipeline without marking them lost raises the win rate on paper.",
    aliases: ["Opp → Won rate", "close rate"],
  },
  {
    id: "salesCycle",
    group: "Funnel",
    name: "Sales cycle",
    short: "Days from a new lead to a won deal: the four stage days added.",
    formulaId: "salesCycle",
    example: "8 + 12 + 18 + 35 = 73 days.",
    caveat: "Many teams count from opportunity creation instead. Compare cycles only when they start at the same point.",
  },
  { id: "avgDealSize", group: "Funnel", name: "Average deal size", short: "The average first-year contract value of a won deal.", aliases: ["ACV"] },
  {
    id: "leadsPerRep",
    group: "Funnel",
    name: "Leads per rep",
    short: "New leads assigned to each account executive in a month.",
    caveat: "More is not always better. Past what a rep can work, follow-up slips and conversion falls. The range here stops at 60.",
  },
  {
    id: "dealsPerRep",
    group: "Funnel",
    name: "Deals per rep",
    short: "Won deals each rep closes in a month at these rates.",
    formulaId: "dealsPerRep",
    example: "45 × 1.78% = 0.80.",
  },
  {
    id: "revenuePerRep",
    group: "Funnel",
    name: "Revenue per rep",
    short: "New contract value each rep closes in a year at these rates.",
    formulaId: "revenuePerRep",
    example: "0.80 × $42,000 × 12 = $403,409.",
    caveat: "It assumes every lead is worked to a result. Ramp time and rep turnover are left out.",
  },
];

export const TERMS: Record<string, Term> = Object.fromEntries(list.map((t) => [t.id, t]));
export const TERM_LIST: Term[] = list;
export const TERM_GROUPS: Term["group"][] = ["Scoring", "Pipeline", "Forecast", "Unit economics", "Funnel"];
