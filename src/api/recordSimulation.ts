import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { loadState } from '../lib/server';
import { simulate, type Decision } from '../lib/engine';

export default createEndpoint({
  description: 'Scores a what-if decision on the server, saves it to history and applies it when committed',
  authenticated: true,
  inputSchema: z.object({
    today: z.string(),
    commit: z.boolean(),
    decision: z.object({
      type: z.enum(['One-time Buy', 'New Subscription', 'Cancel Subscription', 'Save', 'Extra Income']),
      label: z.string(),
      amount: z.number(),
      category: z.string().optional(),
      subscriptionId: z.string().optional(),
      goalId: z.string().optional(),
    }),
  }),
  outputSchema: z.object({ verdict: z.string(), scoreBefore: z.number(), scoreAfter: z.number(), goalCompleted: z.boolean() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const d = input.decision as Decision;
    const state = await loadState(uid);
    if (!state.cycle) throw new Error('No active budget cycle');
    if (d.amount <= 0 && d.type !== 'Cancel Subscription') throw new Error('Amount must be positive');
    const sub = d.subscriptionId ? state.subscriptions.find((s) => s.id === d.subscriptionId) : undefined;
    const goal = d.goalId ? state.goals.find((g) => g.id === d.goalId) : undefined;
    if (d.type === 'Cancel Subscription' && !sub) throw new Error('Pick a subscription to cancel');
    if (d.type === 'Save' && !goal) throw new Error('Pick a goal to save toward');
    if (sub) d.amount = sub.amount;

    const res = simulate({ ...state, cycle: state.cycle, today: input.today }, d);
    await zite.simulations.create({
      record: {
        decision: d.label || d.type, owner: uid, decisionType: d.type, amount: d.amount,
        scoreBefore: res.before.score, scoreAfter: res.after.score, verdict: res.verdict, committed: input.commit,
      },
    });

    let goalCompleted = false;
    if (input.commit) {
      const base = { owner: uid, cycle: state.cycle.id, isUnexpected: false, date: input.today, note: 'Committed from simulator' };
      if (d.type === 'One-time Buy')
        await zite.transactions.create({ record: { ...base, title: d.label, amount: d.amount, type: 'Expense', category: d.category || 'Other' } });
      else if (d.type === 'Extra Income')
        await zite.transactions.create({ record: { ...base, title: d.label, amount: d.amount, type: 'Income', category: 'Other' } });
      else if (d.type === 'New Subscription')
        await zite.subscriptions.create({ record: { name: d.label, owner: uid, amount: d.amount, kind: 'Subscription', nextRenewal: input.today, status: 'Active' } });
      else if (d.type === 'Cancel Subscription' && sub)
        await zite.subscriptions.update({ id: sub.id, record: { status: 'Cancelled' } as never });
      else if (d.type === 'Save' && goal) {
        const savedAmount = goal.savedAmount + d.amount;
        goalCompleted = savedAmount >= goal.targetAmount && !goal.completed;
        await zite.savingsGoals.update({ id: goal.id, record: { savedAmount, completed: savedAmount >= goal.targetAmount } as never });
        await zite.transactions.create({ record: { ...base, title: `→ ${goal.goalName}`, amount: d.amount, type: 'Goal Contribution', category: 'Other' } });
      }
    }
    return { verdict: res.verdict, scoreBefore: res.before.score, scoreAfter: res.after.score, goalCompleted };
  },
});
