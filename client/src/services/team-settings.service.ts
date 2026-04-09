import { api } from './api';
import type { TeamSettings } from '@/types/team-settings';

export const teamSettingsService = {
  get: () => api.get<TeamSettings>('/team-settings'),
  update: (data: Partial<TeamSettings>) =>
    api.patch<TeamSettings>('/team-settings', data),
};
