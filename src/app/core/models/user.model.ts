import { Profile } from './profile.model';

export interface User {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  isAdmin?: boolean;
  role?: number;
  createdAt: string;
  updatedAt: string;
  profile?: Profile | null;
}
