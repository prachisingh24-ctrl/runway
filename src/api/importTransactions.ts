import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { loadState } from '../lib/server';

export default createEndpoint({
  description: 'Imports reviewed bank statement or SMS transactions into the current cycle, skipping duplicates',
  authenticated: true,
  inputSchema: z.object({
    source: z.string(),
    records: z.array(z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['Expense', 'Income']),
      category: z.string(),
      date: z.string(),
    })),
  }),
  outputSchema: z.object({ imported: z.number(), skipped: z.number() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const { cycle, transactions } = await loadState(uid);
    if (!cycle) throw new Error('No active budget cycle');
    const seen = new Set(transactions.map((t) => `${t.date}|${t.amount}|${t.type}`));
    const fresh = input.records.filter((r) => {
      if (!(r.amount > 0) || !r.title.trim()) return false;
      const k = `${r.date}|${r.amount}|${r.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    for (let i = 0; i < fresh.length; i += 100) {
      await zite.transactions.bulkCreate({
        records: fresh.slice(i, i + 100).map((r) => ({
          title: r.title.trim(), owner: uid, cycle: cycle.id, amount: r.amount, type: r.type,
          category: r.type === 'Income' ? 'Other' : r.category, isUnexpected: false, date: r.date, note: `Imported from ${input.source}`,
        })),
      });
    }
    return { imported: fresh.length, skipped: input.records.length - fresh.length };
  },
});
