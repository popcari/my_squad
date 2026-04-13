import { dateField, requiredNumber, requiredSelect, requiredString } from '@/schemas';
import { z } from 'zod';

export const expenseSchema = z.object({
  description: requiredString('Description'),
  amount: requiredNumber('Amount'),
  date: dateField(),
});

export type ExpenseForm = z.infer<typeof expenseSchema>;

export const matchExpenseSchema = z.object({
  matchId: requiredSelect('a match'),
  amount: requiredNumber('Amount'),
  date: dateField(),
});

export type MatchExpenseForm = z.infer<typeof matchExpenseSchema>;
