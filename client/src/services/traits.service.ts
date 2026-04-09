import type { Trait } from '@/types';
import { api } from './api';

export const traitsService = {
  getAll: () => api.get<Trait[]>('/traits'),
  create: (data: Partial<Trait>) => api.post<Trait>('/traits', data),
  update: (id: string, data: Partial<Trait>) =>
    api.patch<Trait>(`/traits/${id}`, data),
  remove: (id: string) => api.delete(`/traits/${id}`),
};
