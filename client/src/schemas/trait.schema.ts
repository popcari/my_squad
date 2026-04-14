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
  rating: z
    .number()
    .min(1)
    .max(5)
    .refine((v) => v * 2 === Math.round(v * 2), 'Rating must be in 0.5 steps'),
});

export type AssignTraitForm = z.infer<typeof assignTraitSchema>;
