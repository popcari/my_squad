import { requiredString, optionalString } from '@/schemas';
import { z } from 'zod';

export const teamSettingsSchema = z.object({
  name: requiredString('Team name'),
  description: optionalString(),
  foundedDate: optionalString(),
  homeStadium: optionalString(),
  logo: optionalString(),
});

export type TeamSettingsForm = z.infer<typeof teamSettingsSchema>;
