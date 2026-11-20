# Revenue Healthcheck

A revenue operations diagnostic at https://healthcheck.mongeon.co. It scores four checks (pipeline health, forecast accuracy, unit economics, funnel efficiency) against published benchmarks and shows the arithmetic behind every score.

Built on the same stack and conventions as the Pricing Workbench (pricing.mongeon.co): Next.js App Router, TypeScript, Tailwind, Recharts, Vitest.

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm test`

Every push to `main` deploys to production on Vercel.

## Layout

- `src/lib/engine/` the scoring engine. Inputs, benchmark ranges, weights, derived values, and the diagnosis text. Every number on screen comes from here.
- `src/lib/engine/sources.ts` the published source behind every benchmark range, and how each end was set. The methodology page renders it.
- `src/lib/glossary/` terms for the info bubbles and the formulas shown on screen. Tests hold each formula to the engine.
- `src/app/` one route per check, plus `/summary`, `/inputs`, `/methodology`, `/glossary`.
- `src/components/` shared pieces, most of them carried over from the Pricing Workbench.

## Rules

- Each input is stored once. Win rate, the sales cycle, lead-to-close, and LTV to CAC are derived, never entered twice.
- Every scored range names a source in `sources.ts`. A range with no published figure is not scored. Tests pin the published quartiles and check how unpublished ends were set.
- No input is scored in two checks. A test enforces it.
- The example company's scores are pinned in `engine.test.ts`. A change to the method changes that test on purpose.
- Copy has no em dashes. A test scans every source file.
- Your numbers are kept in the browser's local storage under `revenue-healthcheck:`. Nothing is sent to a server.
