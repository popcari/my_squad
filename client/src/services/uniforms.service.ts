import type { TeamUniform } from '@/types/team-uniform';
import { api } from './api';

export interface CreateUniformPayload {
  year: number;
  name: string;
  numberColor: string;
  shirtColor: string;
  pantColor: string;
}

export const uniformsService = {
  getAll: (year?: number) =>
    api.get<TeamUniform[]>(
      year !== undefined ? `/team-uniforms?year=${year}` : '/team-uniforms',
    ),
  create: (data: CreateUniformPayload) =>
    api.post<TeamUniform>('/team-uniforms', data),
  update: (id: string, data: Partial<CreateUniformPayload>) =>
    api.patch<TeamUniform>(`/team-uniforms/${id}`, data),
  remove: (id: string) => api.delete(`/team-uniforms/${id}`),
};
