import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function usernameFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$/;
    if (!regex.test(value)) {
      return { usernameFormat: true };
    }
    return null;
  };
}
