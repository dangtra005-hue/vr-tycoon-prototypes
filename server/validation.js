import { z } from 'zod';

export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('next-day') }),
  z.object({ type: z.literal('hire'), role: z.enum(['cashier', 'operator', 'marketer']) }),
  z.object({ type: z.literal('price'), value: z.number().finite().min(12).max(80) }),
  z.object({ type: z.literal('train') }),
  z.object({ type: z.literal('restock') }),
  z.object({ type: z.literal('marketing') }),
  z.object({ type: z.literal('upgrade') }),
  z.object({ type: z.literal('expand') }),
  z.object({ type: z.literal('loan') })
]);

export function parseAction(input) { return actionSchema.parse(input); }
