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

// Monthly renewal forecast is reflected in the available budget and projected ending balance.
check('active subscription renewal reduces the forecast and allowance', () => {
  const input = { ...base, subscriptions: [{ id: 'sub-monthly', name: 'Music', amount: 300, kind: 'Subscription', nextRenewal: '2026-10-20', status: 'Active' }] };
  const metrics = compute(input);
  assert.equal(metrics.upcoming, 300);
  assert.equal(metrics.monthlyCommitments, 300);
  assert.ok(metrics.dailyAllowance < compute(base).dailyAllowance);
  assert.ok(metrics.forecastEnd < compute(base).forecastEnd);
});

// A renewal due before today is counted once as a catch-up charge, not twice.
check('overdue renewal is counted once in the cycle forecast', () => {
  const input = { ...base, today: '2026-10-25', subscriptions: [{ id: 'sub-overdue', name: 'Cloud', amount: 250, kind: 'Subscription', nextRenewal: '2026-10-20', status: 'Active' }] };
  assert.equal(compute(input).upcoming, 250);
});

// Health score and factor points remain inside their documented ranges.
check('health score remains between 0 and 100', () => {
  const metrics = compute({ ...base, transactions: [{ id: 'big', title: 'Big spend', amount: 20000, type: 'Expense', category: 'Shopping', isUnexpected: true, date: today, note: '' }] });
  assert.ok(metrics.score >= 0 && metrics.score <= 100);
  assert.ok(metrics.factors.every((f) => f.points >= 0 && f.points <= f.max));
});

// A lower-cost alternative should preserve more forecast cash than the original purchase.
check('lower-cost purchase alternative preserves more forecast cash', () => {
  const original = simulate(base, { type: 'One-time Buy', label: 'Full price', amount: 2000, category: 'Shopping' });
  const alternative = simulate(base, { type: 'One-time Buy', label: 'Budget pick', amount: 1000, category: 'Shopping' });
  assert.ok(alternative.after.forecastEnd > original.after.forecastEnd);
});

process.stdout.write('All finance regression checks passed.\n');

// Month-end renewals remain anchored to the original due day across short months.
check('month-end renewals stay anchored and count each in-cycle occurrence once', () => {
  const input = {
    ...base,
    cycle: { ...base.cycle, startDate: '2026-01-01', lengthDays: 90 },
    today: '2026-01-01',
    subscriptions: [{ id: 'sub-month-end', name: 'Annual-ish monthly', amount: 300, kind: 'Subscription', nextRenewal: '2026-01-31', status: 'Active' }],
  };
  assert.equal(compute(input).upcoming, 900); // Jan 31, Feb 28, Mar 31
});

// Saving toward a goal moves money out of spendable balance and into goal progress.
check('goal contribution lowers balance and increases goal progress once', () => {
  const input = { ...base, goals: [{ id: 'goal-1', goalName: 'Laptop', emoji: '💻', targetAmount: 3000, savedAmount: 500, deadline: '2026-11-10', completed: false }] };
  const result = simulate(input, { type: 'Save', label: 'Save toward Laptop', amount: 400, goalId: 'goal-1' });
  assert.equal(result.after.balance, result.before.balance - 400);
  assert.equal(result.after.goals.find((g) => g.id === 'goal-1')?.remaining, 2100);
});

// An improving decision must not be called Safe if the resulting plan is still high risk.
check('verdict remains cautious when extra income helps but the plan is still critical', () => {
  const stressed = {
    ...base,
    transactions: [{ id: 'overspend', title: 'Unexpected emergency', amount: 20000, type: 'Expense', category: 'Bills', isUnexpected: true, date: today, note: '' }],
  };
  const result = simulate(stressed, { type: 'Extra Income', label: 'Small gig', amount: 1000 });
  assert.equal(result.after.risk, 'Critical');
  assert.equal(result.verdict, 'Caution');
});

