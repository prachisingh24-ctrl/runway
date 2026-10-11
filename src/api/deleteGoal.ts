import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned, getActiveCycle } from '../lib/server';

export default createEndpoint({
  description: 'Deletes a savings goal and returns its saved money to the balance',
  authenticated: true,
  inputSchema: z.object({ id: z.string(), today: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const g = assertOwned(await zite.savingsGoals.findOne({ id: input.id }), uid);
    const cycle = await getActiveCycle(uid);
    if (cycle && (g.savedAmount || 0) > 0) {
      await zite.transactions.create({
        record: {
          title: `← ${g.goalName} (goal closed)`, owner: uid, cycle: cycle.id, amount: g.savedAmount || 0,
          type: 'Goal Withdrawal', category: 'Other', isUnexpected: false, date: input.today, note: '',
        },
      });
    }
    await zite.savingsGoals.delete({ id: input.id });
    return { success: true };
  },
});
