import { optionalString, requiredSelect, requiredString } from '@/schemas';
import { z } from 'zod';

export const updateMatchSchema = z.object({
  opponent: requiredString('Opponent'),
  matchDate: requiredString('Match date'),
  location: requiredString('Location'),
  status: requiredSelect('Match status'),
  homeScore: z.number().min(0).optional().nullable(),
  awayScore: z.number().min(0).optional().nullable(),
  notes: optionalString(),
});

export type UpdateMatchForm = z.infer<typeof updateMatchSchema>;
