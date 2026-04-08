import { api } from './api';
import type { UserTrait } from '@/types';

export const userTraitsService = {
  getByUser: (userId: string) => api.get<UserTrait[]>(`/user-traits/${userId}`),
  assign: (data: { userId: string; traitId: string; rating: number }) =>
    api.post<UserTrait>('/user-traits', data),
  updateRating: (id: string, rating: number) =>
    api.patch<UserTrait>(`/user-traits/${id}`, { rating }),
  remove: (id: string) => api.delete(`/user-traits/${id}`),
};
