export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  matchId?: string;
  createdAt: Date;
  updatedAt: Date;
}
