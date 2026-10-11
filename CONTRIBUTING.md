# Contributing to Runway

Thanks for helping improve Runway. Keep changes focused, explain their user impact, and protect the consistency of financial calculations.

## Before opening a pull request

1. Create a focused branch from `main`.
2. Keep shared budget calculations in `src/lib/engine.ts`; avoid duplicating finance formulas in UI components.
3. Add regression tests in `scripts/test-finance-engine.mjs` for changes to cash flow, renewals, goals, risk, forecasts, or simulations.
4. Run:
   ```bash
   corepack yarn typecheck
   corepack yarn test:finance
   corepack yarn build
   ```
5. Explain the behavior change, test evidence, and any assumptions in the PR.

The full app build depends on Zite-generated files and the shared `@project/components` workspace. If those are not present in a local checkout, validate the complete build in the connected Zite environment and state clearly when that validation has not been run.

## Finance correctness checklist

- Does the change distinguish posted transactions from future scheduled cash flows?
- Are cycle boundaries inclusive and consistent across balance, forecast, and chart?
- Are recurring renewals counted once per occurrence, including month-end dates?
- Does a simulation leave the original input unchanged?
- Are zero/negative values, missing dates, and goal deadlines handled intentionally?
- Do UI labels explain estimates without implying verified bank data?

## Security and privacy

Use synthetic data in tests and screenshots. Never commit secrets or personal financial records. See [SECURITY.md](SECURITY.md).
