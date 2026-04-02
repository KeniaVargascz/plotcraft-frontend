import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  updateProfile(payload: Partial<Profile>): Observable<Profile> {
    return this.http.patch<ApiResponse<Profile>>(`${environment.apiUrl}/profiles/me`, payload).pipe(
      map((response) => response.data),
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
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, payload).pipe(
      map((response) => response.data),
      tap((user) => this.authService.updateCurrentUser(user)),
    );
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http
      .request<ApiResponse<{ message: string }>>('delete', `${environment.apiUrl}/users/me`, {
        body: { password },
      })
      .pipe(map((response) => response.data));
  }

  getPublicProfile(username: string): Observable<Record<string, unknown>> {
    return this.http
      .get<ApiResponse<Record<string, unknown>>>(`${environment.apiUrl}/profiles/${username}`)
      .pipe(map((response) => response.data));
  }
}
