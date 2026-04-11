import { FormControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { emailAvailableValidator } from './email-available.validator';

function createHttpMock(response: Observable<unknown>): HttpClient {
  return { get: vi.fn().mockReturnValue(response) } as unknown as HttpClient;
}

describe('emailAvailableValidator', () => {
  it('should return null when email is available', async () => {
    const http = createHttpMock(of({ available: true }));
    const validator = emailAvailableValidator(http);
    const control = new FormControl('free@test.com');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
  });

  it('should return emailTaken when email is taken', async () => {
    const http = createHttpMock(of({ available: false }));
    const validator = emailAvailableValidator(http);
    const control = new FormControl('taken@test.com');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toEqual({ emailTaken: true });
  });

  it('should return null on HTTP error', async () => {
    const http = createHttpMock(throwError(() => new Error('fail')));
    const validator = emailAvailableValidator(http);
    const control = new FormControl('any@test.com');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
  });

  it('should return null for empty value without HTTP call', async () => {
    const getSpy = vi.fn();
    const http = { get: getSpy } as unknown as HttpClient;
    const validator = emailAvailableValidator(http);
    const control = new FormControl('');

    const result = await new Promise<ValidationErrors | null>((resolve) => {
      (validator(control) as Observable<ValidationErrors | null>).subscribe(resolve);
    });

    expect(result).toBeNull();
    expect(getSpy).not.toHaveBeenCalled();
  });
});
