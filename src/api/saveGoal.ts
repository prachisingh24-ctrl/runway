import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned } from '../lib/server';

export default createEndpoint({
  description: 'Creates or updates a savings goal',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    goalName: z.string(),
    emoji: z.string(),
    targetAmount: z.number(),
    deadline: z.string(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (!input.goalName.trim() || input.targetAmount <= 0) throw new Error('Name and a positive target are required');
    const fields = { goalName: input.goalName.trim(), emoji: input.emoji || '🎯', targetAmount: input.targetAmount, deadline: input.deadline || null };
    if (input.id) {
      const g = assertOwned(await zite.savingsGoals.findOne({ id: input.id }), uid);
      await zite.savingsGoals.update({ id: input.id, record: { ...fields, completed: (g.savedAmount || 0) >= input.targetAmount } as never });
      return { id: input.id };
    }
    const rec = await zite.savingsGoals.create({ record: { ...fields, owner: uid, savedAmount: 0, completed: false } });
    return { id: rec.id };
  },
});
