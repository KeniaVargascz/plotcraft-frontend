import { AbstractControl, ValidationErrors } from '@angular/forms';

export function getFirstError(
  control: AbstractControl,
  errorKeyMap: Record<
    string,
    string | ((errors: ValidationErrors) => { key: string; params?: object })
  >,
): { key: string; params?: object } | null {
  if (!control.errors || !control.touched) return null;

  for (const errorKey of Object.keys(control.errors)) {
    const mapping = errorKeyMap[errorKey];
    if (!mapping) continue;

    if (typeof mapping === 'string') {
      return { key: mapping };
    }
    return mapping(control.errors);
  }
  return null;
}
