import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { MaintenanceService } from '../services/maintenance.service';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = tokenService.getAccessToken();
  const isPublicRoute =
    request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register');

  const authRequest =
    accessToken && request.url.startsWith(environment.apiUrl) && !isPublicRoute
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : request;

  const maintenance = inject(MaintenanceService);

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // 503 = maintenance mode — show maintenance screen
      if (error.status === 503) {
        maintenance.enabled.set(true);
        return throwError(() => error);
      }

      // 403 = forced logout (account disabled, locked, flags changed)
      if (error.status === 403) {
        authService.logout();
        return throwError(() => error);
      }

      // 401 on refresh endpoint = no retry
      if (error.status !== 401 || request.url.endsWith('/auth/refresh')) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap((newToken) => {
          if (!newToken) {
            void router.navigateByUrl('/login');
            return throwError(() => error);
          }

          const retriedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retriedRequest);
        }),
      );
    }),
  );
};
