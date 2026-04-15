import {
  emailField,
  optionalString,
  passwordField,
  phoneField,
  requiredString,
} from '@/schemas';
import { z } from 'zod';

export const registerSchema = z.object({
  displayName: requiredString('Display name'),
  email: emailField(),
  password: passwordField(),
  phone: phoneField(),
  jerseyNumber: optionalString(),
});

export type RegisterForm = z.infer<typeof registerSchema>;
