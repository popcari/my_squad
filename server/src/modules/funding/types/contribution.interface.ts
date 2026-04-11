import { ContributionType } from './contribution-type.enum';

export interface Contribution {
  id: string;
  roundId: string;
  userId: string;
  amount: number;
  type: ContributionType;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
