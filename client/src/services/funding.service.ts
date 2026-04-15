import type {
  Contribution,
  Expense,
  FundingRound,
  FundingSummary,
} from '@/types';
import { api } from './api';

export const fundingService = {
  // ─── ROUNDS ─────────────────────────────────────────────
  getRounds: () => api.get<FundingRound[]>('/funding/rounds'),

  createRound: (data: { name: string }) =>
    api.post<FundingRound>('/funding/rounds', data),

  updateRound: (id: string, data: { name?: string }) =>
    api.patch<FundingRound>(`/funding/rounds/${id}`, data),

  removeRound: (id: string) => api.delete(`/funding/rounds/${id}`),

  // ─── CONTRIBUTIONS ────────────────────────────────────────
  getContributions: (roundId?: string) =>
    api.get<Contribution[]>(
      roundId
        ? `/funding/contributions?roundId=${roundId}`
        : '/funding/contributions',
    ),

  addContribution: (data: Partial<Contribution>) =>
    api.post<Contribution>('/funding/contributions', data),

  removeContribution: (id: string) =>
    api.delete(`/funding/contributions/${id}`),

  // ─── EXPENSES ─────────────────────────────────────────────
  getExpenses: () => api.get<Expense[]>('/funding/expenses'),

  addExpense: (data: Partial<Expense>) =>
    api.post<Expense>('/funding/expenses', data),

  updateExpense: (id: string, data: Partial<Expense>) =>
    api.patch<Expense>(`/funding/expenses/${id}`, data),

  removeExpense: (id: string) => api.delete(`/funding/expenses/${id}`),

  // ─── SUMMARY ──────────────────────────────────────────────
  getSummary: () => api.get<FundingSummary>('/funding/summary'),
};
