import {
  HAS_NUMBER_REGEX,
  HAS_UPPERCASE_REGEX,
  PHONE_VN_REGEX,
} from '@/constant/regex';
import { z } from 'zod';

// ─── Shared field validators ────────────────────────────

/** Required non-empty string */
export const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`);

/** Optional string (can be empty or undefined) */
export const optionalString = () => z.string().optional();

/** Required select — must pick a non-empty value */
export const requiredSelect = (fieldName: string) =>
  z.string().min(1, `Please select ${fieldName}`);

/** Required positive number (accepts string input, coerces to number) */
export const requiredNumber = (fieldName: string) =>
  z.coerce
    .number({ message: `${fieldName} is required` })
    .positive(`${fieldName} must be greater than 0`);

/** Date field (required, ISO date string) */
export const dateField = (fieldName = 'Date') =>
  z.string().min(1, `${fieldName} is required`);

/** Email field with standard validation */
export const emailField = () => z.string().email('Invalid email address');

/** Phone field — Vietnamese format (03x, 05x, 07x, 08x, 09x — 10 digits) */
export const phoneField = () =>
  z
    .string()
    .min(1, 'Phone number is required')
    .regex(PHONE_VN_REGEX, 'Invalid phone number (e.g. 0901234567)');

/**
 * Password field with multi-rule validation (superRefine).
 * Shows ALL errors at once instead of stopping at the first one.
 *
 * Rules:
 * - Required (non-empty)
 * - Min 6 characters
 * - Max 32 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
export const passwordField = () =>
  z.string().superRefine((val, ctx) => {
    if (val.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password is required' });
      return;
    }
    if (val.length < 6) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must be at least 6 characters',
      });
    }
    if (val.length > 32) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must be at most 32 characters',
      });
    }
    if (!HAS_UPPERCASE_REGEX.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must contain at least 1 uppercase letter',
      });
    }
    if (!HAS_NUMBER_REGEX.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must contain at least 1 number',
      });
    }
  });
