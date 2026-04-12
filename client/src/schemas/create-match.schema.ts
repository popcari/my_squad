import { requiredString, optionalString } from '@/schemas';
import { z } from 'zod';

export const createMatchSchema = z.object({
  opponent: requiredString('Opponent'),
  matchDate: requiredString('Match date'),
  location: requiredString('Location'),
  notes: optionalString(),
});

export type CreateMatchForm = z.infer<typeof createMatchSchema>;
