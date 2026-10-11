import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { assertOwned } from '../lib/server';

export default createEndpoint({
  description: 'Deletes one of the signed-in user’s transactions',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    assertOwned(await zite.transactions.findOne({ id: input.id }), context.user.id);
    await zite.transactions.delete({ id: input.id });
    return { success: true };
  },
});
