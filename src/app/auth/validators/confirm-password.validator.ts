import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function confirmPasswordValidator(
  passwordField = 'password',
  confirmField = 'confirmPassword',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField)?.value;
    const confirmPassword = group.get(confirmField)?.value;
    if (!password || !confirmPassword) return null;
    return password !== confirmPassword ? { passwordMismatch: true } : null;
  };
}
