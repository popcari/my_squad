import { UserRole } from './user-role.enum';

export interface User {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  phone: string;
  jerseyNumber?: number;
  avatar?: string;
  status: number; // 1 = active, 0 = inactive
  createdAt: Date;
  updatedAt: Date;
}
