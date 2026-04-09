import { api } from './api';
import type { Trait } from '@/types';

export const traitsService = {
  getAll: () => api.get<Trait[]>('/traits'),
  create: (data: Partial<Trait>) => api.post<Trait>('/traits', data),
  update: (id: string, data: Partial<Trait>) =>
    api.patch<Trait>(`/traits/${id}`, data),
  remove: (id: string) => api.delete(`/traits/${id}`),
};
