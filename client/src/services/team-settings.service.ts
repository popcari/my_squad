import type { TeamSettings } from '@/types/team-settings';
import { api } from './api';

export const teamSettingsService = {
  get: () => api.get<TeamSettings>('/team-settings'),
  update: (data: Partial<TeamSettings>) =>
    api.patch<TeamSettings>('/team-settings', data),
};
