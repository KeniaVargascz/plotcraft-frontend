import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, take, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';
import { TokenService } from './token.service';
import { HttpApiService } from './http-api.service';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = { email: string; username: string; password: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(HttpApiService);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private refreshInFlight$: Observable<string | null> | null = null;

  async initializeSession(): Promise<void> {
    const accessToken = this.tokenService.getAccessToken();
    if (!accessToken) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.me().subscribe({
        next: () => resolve(),
        error: () => {
          this.clearSession();
          resolve();
        },
      });
    });
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(map((response) => this.handleAuthResponse(response.data)));
  }

  verifyRegistration(payload: { email: string; code: string }): Observable<User> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register/verify`, payload)
      .pipe(map((response) => this.handleAuthResponse(response.data)));
  }

  resendOtp(email: string): Observable<unknown> {
    return this.api.post<unknown>('/auth/register/resend', { email });
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.api.post<unknown>('/auth/forgot-password', { email });
  }

  resetPassword(payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Observable<unknown> {
    return this.api.post<unknown>('/auth/reset-password', payload);
  }

  login(payload: LoginPayload): Observable<User> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(map((response) => this.handleAuthResponse(response.data)));
  }

  me(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      map((user) => this.enrichWithJwtClaims(user)),
      tap((user) => this.currentUserSubject.next(user)),
    );
  }

  isAdmin(): boolean {
    return Boolean(this.getCurrentUserSnapshot()?.isAdmin);
  }

  private enrichWithJwtClaims(user: User): User {
    if (user.isAdmin !== undefined) return user;
    const token = this.tokenService.getAccessToken();
    if (!token) return user;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (typeof payload?.isAdmin === 'boolean') {
        return { ...user, isAdmin: payload.isAdmin };
      }
    } catch {
      // ignore decode errors
    }
    return user;
  }

  refresh(): Observable<string | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    this.refreshInFlight$ = this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        map((response) =>
          this.handleAuthResponse(response.data).id ? response.data.accessToken : null,
        ),
        tap({
          error: () => this.clearSession(),
        }),
        catchError(() => of(null)),
        tap(() => {
          this.refreshInFlight$ = null;
        }),
      );

    return this.refreshInFlight$;
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    const accessToken = this.tokenService.getAccessToken();

    if (refreshToken && accessToken) {
      this.http
        .post(
          `${environment.apiUrl}/auth/logout`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
        .pipe(take(1), catchError(() => of(null)))
        .subscribe();
    }

    this.clearSession();
    void this.router.navigateByUrl('/');
  }

  isAuthenticated(): boolean {
    return Boolean(this.tokenService.getAccessToken());
  }

  getCurrentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  private handleAuthResponse(data: AuthResponse): User {
    this.tokenService.setTokens(data.accessToken, data.refreshToken);
    const user = this.enrichWithJwtClaims(data.user);
    this.currentUserSubject.next(user);
    return user;
  }

  private clearSession(): void {
    this.tokenService.clear();
    this.currentUserSubject.next(null);
  }
}
