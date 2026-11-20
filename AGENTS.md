# AGENTS.md

Read `README.md` first. It lists the rules the tests enforce.

Before changing scores, weights, or ranges, update the pinned example scores in `src/lib/engine/engine.test.ts` and the worked examples in `src/lib/glossary/terms.ts` together. Run `npm test`, `npm run lint`, and `npm run build`; all three must pass.

User-facing copy follows the mongeon.co voice: no em dashes, no ellipses, no hedging, and none of the words the glossary test bans.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
