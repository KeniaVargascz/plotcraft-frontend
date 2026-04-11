import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const missing: string[] = [];
    if (!/[A-Z]/.test(value)) missing.push('uppercase');
    if (!/[a-z]/.test(value)) missing.push('lowercase');
    if (!/\d/.test(value)) missing.push('number');
    if (!/[!@#$%^&*]/.test(value)) missing.push('special');

    return missing.length ? { passwordStrength: { missing } } : null;
  };
}
