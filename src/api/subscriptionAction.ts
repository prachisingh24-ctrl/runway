import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned, requireCycle } from '../lib/server';
import { addMonth } from '../lib/engine';

export default createEndpoint({
  description: 'Marks a subscription paid, pauses, resumes, cancels or deletes it',
  authenticated: true,
  inputSchema: z.object({ id: z.string(), action: z.enum(['pay', 'pause', 'resume', 'cancel', 'delete']), today: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const s = assertOwned(await zite.subscriptions.findOne({ id: input.id }), uid);
    if (input.action === 'delete') {
      await zite.subscriptions.delete({ id: s.id });
    } else if (input.action === 'pay') {
      const cycle = await requireCycle(uid);
      await zite.transactions.create({
        record: {
          title: s.name || 'Subscription', owner: uid, cycle: cycle.id, amount: s.amount || 0, type: 'Expense',
          category: 'Bills', isUnexpected: false, date: input.today, note: `${s.kind} payment`,
        },
      });
      await zite.subscriptions.update({ id: s.id, record: { nextRenewal: addMonth(s.nextRenewal || input.today) } as never });
    } else {
      const status = input.action === 'pause' ? 'Paused' : input.action === 'resume' ? 'Active' : 'Cancelled';
      await zite.subscriptions.update({ id: s.id, record: { status } as never });
    }
    return { success: true };
  },
});
