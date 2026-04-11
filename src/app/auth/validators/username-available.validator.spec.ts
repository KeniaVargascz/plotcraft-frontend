import { FormControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { usernameAvailableValidator } from './username-available.validator';

function createHttpMock(response: Observable<unknown>): HttpClient {
  return { get: vi.fn().mockReturnValue(response) } as unknown as HttpClient;
}

describe('usernameAvailableValidator', () => {
  it('should return null when username is available', async () => {
    const http = createHttpMock(of({ available: true }));
    const validator = usernameAvailableValidator(http);
    const control = new FormControl('freeuser');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
  });

  it('should return usernameTaken when username is taken', async () => {
    const http = createHttpMock(of({ available: false }));
    const validator = usernameAvailableValidator(http);
    const control = new FormControl('takenuser');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toEqual({ usernameTaken: true });
  });

  it('should return null on HTTP error', async () => {
    const http = createHttpMock(throwError(() => new Error('network error')));
    const validator = usernameAvailableValidator(http);
    const control = new FormControl('anyuser');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
  });

  it('should return null for empty value without calling HTTP', async () => {
    const getSpy = vi.fn();
    const http = { get: getSpy } as unknown as HttpClient;
    const validator = usernameAvailableValidator(http);
    const control = new FormControl('');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
    expect(getSpy).not.toHaveBeenCalled();
  });
});
