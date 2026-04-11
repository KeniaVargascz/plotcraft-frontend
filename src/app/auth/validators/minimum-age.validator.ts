import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minimumAgeValidator(minAge: number): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get('birthdate') ?? group;
    const value = control.value;
    if (!value) return null;

    const birthdate = new Date(value);
    if (isNaN(birthdate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }

    return age < minAge ? { underage: { minAge, actualAge: age } } : null;
  };
}
