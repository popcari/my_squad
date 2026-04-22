import type { User } from '@/types';
import { api } from './api';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: Partial<User> & { password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
};
