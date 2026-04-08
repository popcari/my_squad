import { LineupType } from './lineup-type.enum';

export interface MatchLineup {
  id: string;
  matchId: string;
  userId: string;
  type: LineupType;
  createdAt: Date;
}
