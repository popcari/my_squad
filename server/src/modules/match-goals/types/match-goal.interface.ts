export interface MatchGoal {
  id: string;
  matchId: string;
  scorerId: string;
  assistId?: string;
  minute: number;
  createdAt: Date;
}
