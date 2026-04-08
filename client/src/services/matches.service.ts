import { api } from './api';
import type { Match, MatchLineup, MatchGoal } from '@/types';

export const matchesService = {
  getAll: () => api.get<Match[]>('/matches'),
  getUpcoming: () => api.get<Match[]>('/matches/upcoming'),
  getOne: (id: string) => api.get<Match>(`/matches/${id}`),
  create: (data: Partial<Match>) => api.post<Match>('/matches', data),
  update: (id: string, data: Partial<Match>) => api.patch<Match>(`/matches/${id}`, data),
  remove: (id: string) => api.delete(`/matches/${id}`),

  getLineups: (matchId: string) => api.get<MatchLineup[]>(`/match-lineups/${matchId}`),
  addLineup: (data: Partial<MatchLineup>) => api.post<MatchLineup>('/match-lineups', data),
  removeLineup: (id: string) => api.delete(`/match-lineups/${id}`),

  getGoals: (matchId: string) => api.get<MatchGoal[]>(`/match-goals/match/${matchId}`),
  addGoal: (data: Partial<MatchGoal>) => api.post<MatchGoal>('/match-goals', data),
  removeGoal: (id: string) => api.delete(`/match-goals/${id}`),
};
