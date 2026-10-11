# Quality, architecture, and performance

This guide records the quality gates expected for Runway and gives future changes a consistent way to validate improvements.

## Current repository checks

- `corepack yarn typecheck` checks the shared finance engine's TypeScript types.
- `corepack yarn test:finance` runs deterministic finance-engine regression checks.
- `corepack yarn build` is the full application build, but requires the Zite-generated `.zite` files and shared `@project/components` workspace.

The GitHub workflow explicitly warns when the full app build is unavailable. A passing finance-engine job alone must not be described as proof that the full application builds or that the deployed site is healthy.

## Architecture rules

- Keep calculations and decision simulations in `src/lib/engine.ts` as pure, shared functions.
- Keep UI components focused on rendering and user interaction; reuse engine outputs instead of reimplementing formulas.
- Keep persisted-data changes explicit and validate imported CSV/XLS/XLSX and pasted SMS content before saving.
- Treat bank connection screens as a roadmap until an actual consent-based provider is configured and verified.
- Keep credentials server-side and request only the permissions required for a feature.

## Performance review checklist

When changing a page or adding a dependency:

1. Avoid repeated full-list transformations inside render loops; memoize derived expensive values when profiling shows a benefit.
2. Lazy-load route-level or heavy chart/import modules when supported by the app's routing and bundler.
3. Avoid shipping duplicate charting, parsing, or date libraries for the same task.
4. Use stable list keys and avoid unnecessary state updates that trigger broad rerenders.
5. Check mobile layouts for overflow and test keyboard focus, labels, contrast, and reduced-motion behavior.
6. Compare production build output before and after significant UI or dependency changes. Prefer measured bundle/runtime improvements over speculative micro-optimizations.

## Release validation

Before calling a release ready, run finance tests and the complete build in the connected Zite workspace, review the live deployment for desktop and mobile, and record any checks that could not be completed. GitHub repository checks do not themselves confirm a Zite deployment was published.
