import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: "Returns (creating if needed) the signed-in user's private auto-capture key and capture stats",
  authenticated: true,
  inputSchema: z.object({ regenerate: z.boolean().optional() }),
  outputSchema: z.object({ key: z.string(), webhookUrl: z.string(), capturedCount: z.number(), lastCaptured: z.string() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const newKey = () => `rw_${crypto.randomUUID().replace(/-/g, '')}`;
    let rec = await zite.captureKeys.findOne({ filters: { owner: uid } });
    if (!rec) {
      rec = await zite.captureKeys.create({ record: { key: newKey(), owner: uid, lastCaptured: null, capturedCount: 0 } });
    } else if (input.regenerate) {
      const key = newKey();
      await zite.captureKeys.update({ id: rec.id, record: { key } as never });
      rec = { ...rec, key };
    }
    const env = process.env as Record<string, string | undefined>;
    return {
      key: rec.key || '',
      webhookUrl: env.ZITE_CAPTURE_WEBHOOK_URL || '',
      capturedCount: rec.capturedCount || 0,
      lastCaptured: rec.lastCaptured || '',
    };
  },
});
