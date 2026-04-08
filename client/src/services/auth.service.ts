import { api } from './api';
import type { User } from '@/types';

export const authService = {
  login: (email: string) => api.post<User>('/auth/login', { email }),
  register: (data: Partial<User>) => api.post<User>('/auth/register', data),
};
