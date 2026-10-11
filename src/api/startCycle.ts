import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Starts a new 30-day budget cycle with commitments and an optional goal',
  authenticated: true,
  inputSchema: z.object({
    today: z.string(),
    startingBalance: z.number(),
    commitments: z.array(z.object({ name: z.string(), amount: z.number(), kind: z.enum(['Subscription', 'Commitment']) })),
    goal: z.object({ goalName: z.string(), emoji: z.string(), targetAmount: z.number(), deadline: z.string() }).optional(),
  }),
  outputSchema: z.object({ cycleId: z.string() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (input.startingBalance <= 0) throw new Error('Starting balance must be positive');
    const total = input.commitments.reduce((a, c) => a + c.amount, 0);
    if (input.commitments.some((c) => c.amount <= 0 || !c.name.trim())) throw new Error('Each commitment needs a name and positive amount');
    if (total > input.startingBalance) throw new Error('Commitments cannot exceed your starting balance');

    const { records: old } = await zite.budgetCycles.findAll({ filters: { owner: uid, status: 'Active' }, limit: 50 });
    await Promise.all(old.map((c) => zite.budgetCycles.update({ id: c.id, record: { status: 'Completed' } as never })));

    const cycle = await zite.budgetCycles.create({
      record: {
        cycleName: `Cycle from ${input.today}`,
        owner: uid,
        startingBalance: input.startingBalance,
        startDate: input.today,
        lengthDays: 30,
        status: 'Active',
        transactions: null,
      },
    });

    if (input.commitments.length) {
      await zite.subscriptions.bulkCreate({
        records: input.commitments.map((c) => ({
          name: c.name.trim(), owner: uid, amount: c.amount, kind: c.kind, nextRenewal: input.today, status: 'Active',
        })),
      });
    }
    if (input.goal && input.goal.goalName.trim() && input.goal.targetAmount > 0) {
      await zite.savingsGoals.create({
        record: {
          goalName: input.goal.goalName.trim(), owner: uid, emoji: input.goal.emoji || '🎯',
          targetAmount: input.goal.targetAmount, savedAmount: 0, deadline: input.goal.deadline || null, completed: false,
        },
      });
    }
    return { cycleId: cycle.id };
  },
});
