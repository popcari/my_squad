import { UserRole } from './user-role.enum';

export interface User {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  jerseyNumber?: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
