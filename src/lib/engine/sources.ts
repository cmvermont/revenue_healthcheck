import type { MetricId } from "./model";

/** A published source for one or more benchmark ranges. Checked November 2026. */
export type Source = { id: string; publisher: string; title: string; year: string; url: string; sample: string };

export const SOURCES: Record<string, Source> = {
  benchmarkit: {
    id: "benchmarkit",
    publisher: "Benchmarkit and Aleph",
    title: "2026 SaaS and AI Performance Benchmarks",
    year: "2026 edition, full-year 2025 data",
    url: "https://www.getaleph.com/guides-and-templates/2026-saas-benchmarks",
    sample: "342 B2B SaaS and AI-native companies; each metric reports on the companies that answered it",
  },
  bridgeGroup: {
    id: "bridgeGroup",
    publisher: "The Bridge Group",
    title: "SaaS AE Metrics and Compensation Report",
    year: "2024",
    url: "https://blog.bridgegroupinc.com/2024-ae-metrics-compensation-benchmark",
    sample: "172 B2B SaaS companies",
  },
  ebsta: {
    id: "ebsta",
    publisher: "Ebsta and Pavilion",
    title: "2025 GTM Benchmarks",
    year: "2025",
    url: "https://benchmarks.ebsta.com/2025-gtm-benchmarks",
    sample: "655,000 opportunities at 387 companies",
  },
  firstPageSage: {
    id: "firstPageSage",
    publisher: "First Page Sage",
    title: "B2B SaaS Funnel Conversion Benchmarks",
    year: "updated June 2025",
    url: "https://firstpagesage.com/seo-blog/b2b-saas-funnel-conversion-benchmarks/",
    sample: "50+ B2B SaaS client companies over ten years, mostly $10M to $100M in revenue",
  },
  gartner: {
    id: "gartner",
    publisher: "Gartner",
    title: "Sales forecast accuracy research, as reported by Demand Gen Report",
    year: "summary article",
    url: "https://demandgenreport.com/demanding-views/harnessing-ai-transforming-sales-forecasting-for-greater-accuracy-and-strategic-action/48964",
    sample: "Gartner's survey of sales organizations; the full research is behind Gartner's paywall",
  },
  sirius: {
    id: "sirius",
    publisher: "SiriusDecisions (Forrester)",
    title: "The Definitive Way to Measure and Grade Sales Forecast Accuracy",
    year: "Forrester blog",
    url: "https://www.forrester.com/blogs/thedefinitivewaytomeasureandgradesalesforecastaccuracy",
    sample: "SiriusDecisions research",
  },
};

/**
 * How each scored range was set. Basis says how far the published data reaches: quartiles cover all
 * three values; a median with a top figure covers good and best; an average covers good only; a
 * convention is a rule of thumb with no survey behind it.
 */
export const RANGE_SOURCES: Record<MetricId, { sources: string[]; basis: "quartiles" | "median and top" | "average" | "convention"; note: string }> = {
  leadToMql: {
    sources: ["firstPageSage"],
    basis: "average",
    note: "Good is the 41% average for $10M to $100M ARR companies. Only averages are published, so poor and best are set here at half and one and a half times it. Stage definitions vary widely between companies, and other published figures for this stage differ.",
  },
  mqlToSql: {
    sources: ["firstPageSage"],
    basis: "average",
    note: "Good is the 39% average for $10M to $100M ARR companies. Poor and best are set here at half and one and a half times it. This stage has the widest spread between published sources, because companies define an MQL and an SQL differently.",
  },
  sqlToOpp: {
    sources: ["firstPageSage"],
    basis: "average",
    note: "Good is the 42% average for $10M to $100M ARR companies. Poor and best are set here at half and one and a half times it.",
  },
  coverage: {
    sources: ["bridgeGroup"],
    basis: "convention",
    note: "No survey of observed coverage was found. 3x is the long-standing rule of thumb. The Bridge Group notes that the fall in median win rate to 19% moved the coverage needed to hit the number from 4.3x to 5.3x, so 3x is a floor, not a target.",
  },
  forecastAccuracy: {
    sources: ["gartner", "sirius"],
    basis: "median and top",
    note: "Gartner puts median accuracy at 70% to 79%, so good is the 75% midpoint, and 7% of organizations reach 90%, which is best. Poor is set here as far below good as best is above it. SiriusDecisions found 79% of sales organizations miss by more than 10%.",
  },
  weightedPipelineAccuracy: {
    sources: ["gartner"],
    basis: "median and top",
    note: "No separate benchmark was found, so it uses the forecast accuracy range: it is a forecast too, built from stage-weighted pipeline.",
  },
  ltvCac: {
    sources: ["benchmarkit"],
    basis: "quartiles",
    note: "25th percentile 1.1x, median 4.1x, 75th percentile 7.8x, from 146 companies. LTV there is gross-margin based: revenue per customer × gross margin ÷ churn.",
  },
  paybackMonths: {
    sources: ["benchmarkit"],
    basis: "quartiles",
    note: "Median 16 months from 198 companies, the fastest quarter at 10 months, the slowest quarter at 24 months or more. Payback there is gross-margin based. The same page also says the top quartile pays back in 6 months or less; this tool uses the 10-month percentile.",
  },
  grossChurn: {
    sources: ["benchmarkit"],
    basis: "quartiles",
    note: "Gross revenue retention of 76% at the 25th percentile, 84% median, and 91% at the 75th percentile, read here as churn of 24%, 16%, and 9%. SaaS Capital and KeyBanc with Sapphire put median gross retention nearer 90%, so this range is the stricter of the published ones.",
  },
  nrr: {
    sources: ["benchmarkit"],
    basis: "quartiles",
    note: "25th percentile 92%, median 102%, 75th percentile 110%. Usage-priced companies ran higher (108% median) than seat-priced ones.",
  },
  winRate: {
    sources: ["bridgeGroup", "ebsta"],
    basis: "median and top",
    note: "The Bridge Group's median is 19%, and Ebsta with Pavilion report 19% for new logos. Ebsta's top performers win 43% more often: 19% × 1.43 = 27%, which is best. Poor is set here as far below good as best is above it.",
  },
  salesCycle: {
    sources: ["ebsta", "bridgeGroup"],
    basis: "median and top",
    note: "Ebsta with Pavilion report 91 days for new business, and top performers 42% shorter: 91 × 58% = 53 days, which is best. Poor is set here as far above good as best is below it. The Bridge Group's median is longer, at 5.0 months.",
  },
};

export const BASIS_LABEL: Record<(typeof RANGE_SOURCES)[MetricId]["basis"], string> = {
  quartiles: "Published quartiles",
  "median and top": "Published median and top figure",
  average: "Published average only",
  convention: "Rule of thumb",
};
