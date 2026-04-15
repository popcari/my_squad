import type { Formation, FormationSlot } from '@/types/formation';
import { api } from './api';

export interface CreateFormationPayload {
  name: string;
  slots: FormationSlot[];
}

export const formationsService = {
  getAll: () => api.get<Formation[]>('/formations'),
  getOne: (id: string) => api.get<Formation>(`/formations/${id}`),
  create: (data: CreateFormationPayload) =>
    api.post<Formation>('/formations', data),
  update: (id: string, data: Partial<CreateFormationPayload>) =>
    api.patch<Formation>(`/formations/${id}`, data),
  remove: (id: string) => api.delete(`/formations/${id}`),
};
