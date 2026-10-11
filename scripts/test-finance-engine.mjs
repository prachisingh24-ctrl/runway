import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the pure TypeScript finance engine without adding a test-runner dependency.
const source = await readFile(new URL('../src/lib/engine.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const engine = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const { compute, applyDecision, simulate } = engine;

const today = '2026-10-11';
const base = {
  cycle: { id: 'cycle-1', cycleName: 'Test cycle', startingBalance: 10000, startDate: today, lengthDays: 30 },
  transactions: [],
  goals: [],
  subscriptions: [],
  today,
};

function check(name, fn) {
  fn();
  process.stdout.write(`PASS ${name}\n`);
}

// Baseline: no transactions means the actual balance equals the starting balance.
check('starting balance is unchanged with no transactions', () => {
  assert.equal(compute(base).balance, 10000);
});

// A posted purchase must reduce the actual balance by its exact amount.
check('a purchase dated today reduces actual balance by its amount', () => {
  const input = { ...base, transactions: [{
    id: 'expense-1', title: 'Purchase', amount: 500, type: 'Expense',
    category: 'Shopping', isUnexpected: false, date: today, note: '',
  }] };
  assert.equal(compute(input).balance, 9500);
});

// A scheduled expense is not posted to today's actual balance, but affects the forecast.
check('future expense affects forecast, not actual balance', () => {
  const input = { ...base, transactions: [{
    id: 'future-expense', title: 'Planned purchase', amount: 500, type: 'Expense',
    category: 'Shopping', isUnexpected: false, date: '2026-10-15', note: '',
  }] };
  const metrics = compute(input);
  assert.equal(metrics.balance, 10000);
  assert.ok(metrics.forecastEnd < compute(base).forecastEnd);
});

// Scheduled income must not be treated as already available today.
check('future income affects forecast, not actual balance', () => {
  const input = { ...base, transactions: [{
    id: 'future-income', title: 'Pay', amount: 1000, type: 'Income',
    category: 'Other', isUnexpected: false, date: '2026-10-15', note: '',
  }] };
  const metrics = compute(input);
  assert.equal(metrics.balance, 10000);
  assert.ok(metrics.forecastEnd > compute(base).forecastEnd);
});

// Records outside the active cycle should not change this cycle's actual balance or forecast.
check('transactions outside the active cycle are ignored', () => {
  const input = { ...base, transactions: [
    { id: 'old', title: 'Old expense', amount: 700, type: 'Expense', category: 'Food', isUnexpected: false, date: '2026-09-30', note: '' },
    { id: 'later', title: 'Next-cycle income', amount: 900, type: 'Income', category: 'Other', isUnexpected: false, date: '2026-11-10', note: '' },
  ] };
  const metrics = compute(input);
  assert.equal(metrics.balance, 10000);
  assert.equal(metrics.forecastEnd, compute(base).forecastEnd);
});

// The last plotted forecast value and the forecast metric must use the same calculation.
check('final chart forecast matches the Day-30 forecast', () => {
  const input = { ...base, transactions: [{
    id: 'future-expense', title: 'Planned purchase', amount: 500, type: 'Expense',
    category: 'Shopping', isUnexpected: false, date: '2026-10-15', note: '',
  }] };
  const metrics = compute(input);
  assert.equal(metrics.series.at(-1).forecast, Math.round(metrics.forecastEnd));
});

// Cancelling a subscription in a simulation should remove its charge from the projection.
check('cancelling a subscription removes its projected renewal', () => {
  const input = { ...base, subscriptions: [{
    id: 'sub-1', name: 'Streaming', amount: 500, kind: 'Subscription',
    nextRenewal: '2026-10-20', status: 'Active',
  }] };
  const result = simulate(input, {
    type: 'Cancel Subscription', label: 'Cancel Streaming', amount: 500, subscriptionId: 'sub-1',
  });
  assert.equal(result.after.upcoming, 0);
  assert.ok(result.after.forecastEnd > result.before.forecastEnd);
});

process.stdout.write('All finance regression checks passed.\n');
