import { CONTRIBUTION_TYPE, MATCH_STATUS, LINEUP_TYPE, USER_ROLE } from '@/constant/enum';

export type UserRole = `${USER_ROLE}`;
export type MatchStatus = `${MATCH_STATUS}`;
export type LineupType = `${LINEUP_TYPE}`;

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone: string;
  jerseyNumber?: number;
  avatar?: string;
  status: number; // 1 = active, 0 = inactive
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile extends User {
  positions: UserPosition[];
  traits: UserTrait[];
  stats: { goals: number; assists: number };
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trait {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type PositionType = 'primary' | 'sub';

export interface UserPosition {
  id: string;
  userId: string;
  positionId: string;
  type: PositionType;
  createdAt: string;
}

export interface UserTrait {
  id: string;
  userId: string;
  traitId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  opponent: string;
  matchDate: string;
  location: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchLineup {
  id: string;
  matchId: string;
  userId: string;
  type: LineupType;
  createdAt: string;
}

export interface MatchGoal {
  id: string;
  matchId: string;
  scorerId: string;
  assistId?: string;
  minute: number | null;
  createdAt: string;
}

// ─── FUNDING ──────────────────────────────────────────────

export type ContributionType = `${CONTRIBUTION_TYPE}`;

export interface FundingRound {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  id: string;
  roundId: string;
  userId: string;
  amount: number;
  type: ContributionType;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  matchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundingSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
