import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MaintenanceService } from '../services/maintenance.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const maintenance = inject(MaintenanceService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 503) {
          maintenance.enabled.set(true);
        }
        return throwError(() => error);
      }

      return throwError(() => new Error('Unexpected error'));
    }),
  );
};
