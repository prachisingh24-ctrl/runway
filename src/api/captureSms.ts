import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { getActiveCycle } from '../lib/server';
import { parseSms } from '../lib/sms';

// Phone SMS-forwarder apps / iOS Shortcuts POST here with { key, text }.
export default createEndpoint({
  description: 'Receives a forwarded bank/UPI SMS from a phone and logs it as a transaction automatically',
  webhook: {},
  inputSchema: z.object({
    key: z.string().optional(),
    text: z.string().optional(),
    message: z.string().optional(),
    body: z.string().optional(),
    sms: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean(), status: z.string() }),
  execute: async ({ input }) => {
    const key = (input.key ?? '').trim();
    const text = (input.text ?? input.message ?? input.body ?? input.sms ?? '').trim();
    if (!key || !text) return { ok: false, status: 'Missing key or text' };

    const owner = await zite.captureKeys.findOne({ filters: { key } });
    if (!owner) return { ok: false, status: 'Unknown key' };
    const uid = Array.isArray(owner.owner) ? owner.owner[0] : owner.owner;
    if (!uid) return { ok: false, status: 'Unknown key' };

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const [d] = parseSms(text.replace(/\s*\n\s*/g, ' '), today);
    if (!d) return { ok: true, status: 'Not a transaction message — ignored' };

    const cycle = await getActiveCycle(uid);
    if (!cycle) return { ok: true, status: 'No active cycle — ignored' };

    // Dedup retries / double-forwards: same day, amount, type and title.
    const { records: dupes } = await zite.transactions.findAll({
      filters: { owner: uid, cycle: cycle.id, date: d.date, amount: d.amount, type: d.type, title: d.title }, limit: 1,
    });
    if (dupes.length) return { ok: true, status: 'Duplicate — already logged' };

    await zite.transactions.create({
      record: {
        title: d.title, owner: uid, cycle: cycle.id, amount: d.amount, type: d.type,
        category: d.type === 'Income' ? 'Other' : d.category, isUnexpected: false, date: d.date, note: 'Auto-captured from SMS',
      },
    });
    await zite.captureKeys.update({
      id: owner.id,
      record: { lastCaptured: new Date().toISOString(), capturedCount: (owner.capturedCount || 0) + 1 } as never,
    });
    return { ok: true, status: `Logged ${d.type.toLowerCase()} ₹${d.amount} · ${d.title}` };
  },
});
