import { FormBuilder } from '@angular/forms';
import { confirmPasswordValidator } from './confirm-password.validator';

describe('confirmPasswordValidator', () => {
  const fb = new FormBuilder();
  const validator = confirmPasswordValidator();

  it('should return null when passwords match', () => {
    const group = fb.group({ password: 'abc123', confirmPassword: 'abc123' });
    expect(validator(group)).toBeNull();
  });

  it('should return passwordMismatch when passwords differ', () => {
    const group = fb.group({ password: 'abc123', confirmPassword: 'xyz789' });
    expect(validator(group)).toEqual({ passwordMismatch: true });
  });

  it('should return null when password is empty', () => {
    const group = fb.group({ password: '', confirmPassword: 'abc123' });
    expect(validator(group)).toBeNull();
  });

  it('should return null when confirmPassword is empty', () => {
    const group = fb.group({ password: 'abc123', confirmPassword: '' });
    expect(validator(group)).toBeNull();
  });

  it('should return null when both are empty', () => {
    const group = fb.group({ password: '', confirmPassword: '' });
    expect(validator(group)).toBeNull();
  });
});
