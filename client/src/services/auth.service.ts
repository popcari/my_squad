import type { User } from '@/types';
import { api } from './api';

export const authService = {
  login: (email: string) => api.post<User>('/auth/login', { email }),
  register: (data: Partial<User>) => api.post<User>('/auth/register', data),
};
