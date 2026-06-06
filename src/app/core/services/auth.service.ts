import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, take, tap } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';
import { TokenService } from './token.service';
import { HttpApiService } from './http-api.service';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = { email: string; username: string; password: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
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
      const timer = setTimeout(() => {
        this.clearSession();
        resolve();
      }, 5000);

      this.me().subscribe({
        next: () => {
          clearTimeout(timer);
          resolve();
        },
        error: () => {
          clearTimeout(timer);
          this.clearSession();
          resolve();
        },
      });
    });
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api
      .post<AuthResponse>('/auth/register', payload)
      .pipe(map((data) => this.handleAuthResponse(data)));
  }

  verifyRegistration(payload: { email: string; code: string }): Observable<User> {
    return this.api
      .post<AuthResponse>('/auth/register/verify', payload)
      .pipe(map((data) => this.handleAuthResponse(data)));
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
    return this.api
      .post<AuthResponse>('/auth/login', payload)
      .pipe(map((data) => this.handleAuthResponse(data)));
  }

  me(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => this.currentUserSubject.next(user)),
    );
  }

  isAdmin(): boolean {
    return (this.getCurrentUserSnapshot()?.role ?? 0) >= 50;
  }

  refresh(): Observable<string | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return of(null);
    }

    this.refreshInFlight$ = this.api
      .post<AuthResponse>('/auth/refresh', { refreshToken })
      .pipe(
        map((data) =>
          this.handleAuthResponse(data).id ? data.accessToken : null,
        ),
        tap({
          error: () => this.clearSession(),
        }),
        catchError(() => of(null)),
        tap(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    const accessToken = this.tokenService.getAccessToken();

    if (refreshToken && accessToken) {
      const { http, baseUrl } = this.api.raw();
      http
        .post(
          `${baseUrl}/auth/logout`,
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
    this.currentUserSubject.next(data.user);
    return data.user;
  }

  private clearSession(): void {
    this.tokenService.clear();
    localStorage.removeItem('plotcraft_reader_preferences');
    this.currentUserSubject.next(null);
  }
}
