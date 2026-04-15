import type { User } from '@/types';
import { api } from './api';

export const authService = {
  login: (email: string, password: string) =>
    api.post<User>('/auth/login', { email, password }),
  register: (data: Partial<User> & { password: string }) =>
    api.post<User>('/auth/register', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ ok: true }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),
  forgotPassword: (email: string) =>
    api.post<{ ok: true }>('/auth/forgot-password', { email }),
};
