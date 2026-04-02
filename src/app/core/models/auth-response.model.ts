import { User } from './user.model';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
