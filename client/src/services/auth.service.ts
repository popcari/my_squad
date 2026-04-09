import type { User } from '@/types';
import { api } from './api';

export const authService = {
  login: (email: string, password: string) =>
    api.post<User>('/auth/login', { email, password }),
  register: (data: Partial<User> & { password: string }) =>
    api.post<User>('/auth/register', data),
};
