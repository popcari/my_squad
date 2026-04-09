export type PositionType = 'primary' | 'sub';

export interface UserPosition {
  id: string;
  userId: string;
  positionId: string;
  type: PositionType;
  createdAt: Date;
}
