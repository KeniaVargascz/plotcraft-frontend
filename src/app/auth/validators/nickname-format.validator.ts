import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function nicknameFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const regex = /^[\p{L}\p{N} ]{1,50}$/u;
    if (!regex.test(value) || value.trim().length === 0) {
      return { nicknameFormat: true };
    }
    return null;
  };
}
