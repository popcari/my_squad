import type { Position } from '@/types';
import { api } from './api';

export const positionsService = {
  getAll: () => api.get<Position[]>('/positions'),
  create: (data: Partial<Position>) => api.post<Position>('/positions', data),
  update: (id: string, data: Partial<Position>) =>
    api.patch<Position>(`/positions/${id}`, data),
  remove: (id: string) => api.delete(`/positions/${id}`),
};
