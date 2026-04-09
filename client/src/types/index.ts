export type UserRole = 'president' | 'coach' | 'player';
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';
export type LineupType = 'starting' | 'substitute';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  jerseyNumber?: number;
  avatar?: string;
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
  minute: number;
  createdAt: string;
}
