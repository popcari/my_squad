import type { UserPosition } from '@/types';
import { api } from './api';

export const userPositionsService = {
  getByUser: (userId: string) =>
    api.get<UserPosition[]>(`/user-positions/${userId}`),
  assign: (data: { userId: string; positionId: string }) =>
    api.post<UserPosition>('/user-positions', data),
  remove: (id: string) => api.delete(`/user-positions/${id}`),
};
