import { MatchStatus } from './match-status.enum';

export interface Match {
  id: string;
  opponent: string;
  matchDate: Date;
  location: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
