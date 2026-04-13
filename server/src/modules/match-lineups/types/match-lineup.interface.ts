import { LineupType } from './lineup-type.enum';

export interface MatchLineup {
  id: string;
  matchId: string;
  userId: string;
  type: LineupType;
  /** Index of the pitch slot this player occupies (0..slotCount-1). `null`
   *  for bench players or legacy records without an explicit slot. */
  slotIndex?: number | null;
  createdAt: Date;
}
