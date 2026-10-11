import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { loadState } from '../lib/server';

export default createEndpoint({
  description: "Loads the signed-in user's active cycle, transactions, goals, subscriptions and simulations",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.any(),
  execute: async ({ context }) => loadState(context.user.id),
});
