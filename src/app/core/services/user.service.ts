import { Injectable, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Profile, PublicProfile } from '../models/profile.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { HttpApiService } from './http-api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(HttpApiService);
  private readonly authService = inject(AuthService);

  updateProfile(payload: Partial<Profile>): Observable<Profile> {
    return this.api.patch<Profile>('/profiles/me', payload).pipe(
      tap((profile) => {
        const currentUser = this.authService.getCurrentUserSnapshot();
        if (currentUser) {
          const updatedUser: User = { ...currentUser, profile };
          this.authService.updateCurrentUser(updatedUser);
        }
      }),
    );
  }

  updateAccount(payload: Record<string, string>): Observable<User> {
    return this.api.patch<User>('/users/me', payload).pipe(
      tap((user) => this.authService.updateCurrentUser(user)),
    );
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    const { http, baseUrl } = this.api.raw();
    return http
      .request<{ data: { message: string } }>('delete', `${baseUrl}/users/me`, {
        body: { password },
      })
      .pipe(map((response) => response.data));
  }

  getPublicProfile(username: string): Observable<PublicProfile> {
    return this.api.get<PublicProfile>(`/profiles/${username}`);
  }
}
