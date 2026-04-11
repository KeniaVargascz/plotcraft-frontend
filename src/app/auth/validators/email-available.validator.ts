import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export function emailAvailableValidator(http: HttpClient): AsyncValidatorFn {
  let lastChecked = '';
  let lastResult: ValidationErrors | null = null;

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = (control.value as string || '').trim();
    if (!value) return of(null);

    if (value === lastChecked) return of(lastResult);

    return timer(500).pipe(
      switchMap(() =>
        http.get<{ available: boolean }>(
          `${environment.apiUrl}/auth/check-email`,
          { params: { value } },
        ),
      ),
      map((res) => {
        lastChecked = value;
        lastResult = res.available ? null : { emailTaken: true };
        return lastResult;
      }),
      catchError(() => of(null)),
    );
  };
}
