import { api } from './api';
import type { User, PlayerProfile } from '@/types';

export const usersService = {
  getAll: () => api.get<User[]>('/users'),
  getOne: (id: string) => api.get<User>(`/users/${id}`),
  getProfile: (id: string) => api.get<PlayerProfile>(`/users/${id}/profile`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
};
