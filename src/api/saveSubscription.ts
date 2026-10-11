import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned } from '../lib/server';

export default createEndpoint({
  description: 'Creates or updates a subscription or fixed commitment',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    name: z.string(),
    amount: z.number(),
    kind: z.enum(['Subscription', 'Commitment']),
    nextRenewal: z.string(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (!input.name.trim() || input.amount <= 0) throw new Error('Name and a positive amount are required');
    const fields = { name: input.name.trim(), amount: input.amount, kind: input.kind, nextRenewal: input.nextRenewal };
    if (input.id) {
      assertOwned(await zite.subscriptions.findOne({ id: input.id }), uid);
      await zite.subscriptions.update({ id: input.id, record: fields as never });
      return { id: input.id };
    }
    const rec = await zite.subscriptions.create({ record: { ...fields, owner: uid, status: 'Active' } });
    return { id: rec.id };
  },
});
