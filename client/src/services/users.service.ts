import type { PlayerProfile, User } from '@/types';
import { api } from './api';

export const usersService = {
  getAll: () => api.get<User[]>('/users'),
  getOne: (id: string) => api.get<User>(`/users/${id}`),
  getProfile: (id: string) => api.get<PlayerProfile>(`/users/${id}/profile`),
  create: (data: Partial<User>) => api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload<{ avatar: string }>(`/users/${id}/avatar`, formData);
  },
  listAvatars: () =>
    api.get<{ url: string; publicId: string; createdAt: string }[]>(
      '/uploads/images?folder=avatars',
    ),
};
