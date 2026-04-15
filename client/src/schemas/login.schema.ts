import { emailField, passwordField } from '@/schemas';
import { z } from 'zod';

export const loginSchema = z.object({
  email: emailField(),
  // email: emailField().max(10, 'Email must be at most 10 characters'),
  password: passwordField(),
});

export type LoginForm = z.infer<typeof loginSchema>;
