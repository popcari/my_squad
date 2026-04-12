import { optionalString, requiredSelect, requiredString } from '@/schemas';
import { z } from 'zod';

export const createTraitSchema = z.object({
  name: requiredString('Trait name'),
  description: optionalString(),
});

export type CreateTraitForm = z.infer<typeof createTraitSchema>;

export const assignTraitSchema = z.object({
  userId: requiredSelect('a player'),
  traitId: requiredSelect('a trait'),
  rating: z.number().min(1).max(100),
});

export type AssignTraitForm = z.infer<typeof assignTraitSchema>;
