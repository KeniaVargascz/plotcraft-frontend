import { FormControl } from '@angular/forms';
import { passwordStrengthValidator } from './password-strength.validator';

describe('passwordStrengthValidator', () => {
  const validator = passwordStrengthValidator();

  it('should return null for strong password', () => {
    expect(validator(new FormControl('MyPass1!'))).toBeNull();
  });

  it('should return null for empty value', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('should return missing uppercase', () => {
    const result = validator(new FormControl('mypass1!'));
    expect(result).toBeTruthy();
    expect(result!['passwordStrength'].missing).toContain('uppercase');
  });

  it('should return missing lowercase', () => {
    const result = validator(new FormControl('MYPASS1!'));
    expect(result).toBeTruthy();
    expect(result!['passwordStrength'].missing).toContain('lowercase');
  });

  it('should return missing number', () => {
    const result = validator(new FormControl('MyPassw!'));
    expect(result).toBeTruthy();
    expect(result!['passwordStrength'].missing).toContain('number');
  });

  it('should return missing special character', () => {
    const result = validator(new FormControl('MyPass12'));
    expect(result).toBeTruthy();
    expect(result!['passwordStrength'].missing).toContain('special');
  });

  it('should return multiple missing for weak password', () => {
    const result = validator(new FormControl('password'));
    expect(result).toBeTruthy();
    const missing = result!['passwordStrength'].missing as string[];
    expect(missing).toContain('uppercase');
    expect(missing).toContain('number');
    expect(missing).toContain('special');
  });
});
