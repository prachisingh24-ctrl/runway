import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned, requireCycle } from '../lib/server';

export default createEndpoint({
  description: 'Adds money to or withdraws money from a savings goal',
  authenticated: true,
  inputSchema: z.object({ goalId: z.string(), amount: z.number(), direction: z.enum(['add', 'withdraw']), today: z.string() }),
  outputSchema: z.object({ savedAmount: z.number(), completed: z.boolean(), justCompleted: z.boolean() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (input.amount <= 0) throw new Error('Amount must be positive');
    const g = assertOwned(await zite.savingsGoals.findOne({ id: input.goalId }), uid);
    const cycle = await requireCycle(uid);
    const current = g.savedAmount || 0;
    if (input.direction === 'withdraw' && input.amount > current) throw new Error('You cannot withdraw more than is saved');
    const savedAmount = input.direction === 'add' ? current + input.amount : current - input.amount;
    const completed = savedAmount >= (g.targetAmount || 0);
    await zite.savingsGoals.update({ id: g.id, record: { savedAmount, completed } as never });
    await zite.transactions.create({
      record: {
        title: input.direction === 'add' ? `→ ${g.goalName}` : `← ${g.goalName}`, owner: uid, cycle: cycle.id,
        amount: input.amount, type: input.direction === 'add' ? 'Goal Contribution' : 'Goal Withdrawal',
        category: 'Other', isUnexpected: false, date: input.today, note: '',
      },
    });
    return { savedAmount, completed, justCompleted: completed && !g.completed };
  },
});
