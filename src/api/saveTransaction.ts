import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned, requireCycle } from '../lib/server';

export default createEndpoint({
  description: 'Creates or updates an expense or income entry in the current cycle',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    title: z.string(),
    amount: z.number(),
    type: z.enum(['Expense', 'Income']),
    category: z.string(),
    isUnexpected: z.boolean(),
    date: z.string(),
    note: z.string(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (!input.title.trim() || input.amount <= 0) throw new Error('Title and a positive amount are required');
    const fields = {
      title: input.title.trim(), amount: input.amount, type: input.type, category: input.category,
      isUnexpected: input.type === 'Expense' && input.isUnexpected, date: input.date, note: input.note,
    };
    if (input.id) {
      assertOwned(await zite.transactions.findOne({ id: input.id }), uid);
      await zite.transactions.update({ id: input.id, record: fields as never });
      return { id: input.id };
    }
    const cycle = await requireCycle(uid);
    const rec = await zite.transactions.create({ record: { ...fields, owner: uid, cycle: cycle.id } });
    return { id: rec.id };
  },
});
