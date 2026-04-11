import { FormBuilder } from '@angular/forms';
import { minimumAgeValidator } from './minimum-age.validator';

describe('minimumAgeValidator', () => {
  const fb = new FormBuilder();
  const validator = minimumAgeValidator(13);

  function makeGroup(birthdate: string | null): ReturnType<FormBuilder['group']> {
    return fb.group({ birthdate });
  }

  it('should return null when birthdate is empty (optional field)', () => {
    expect(validator(makeGroup(null))).toBeNull();
    expect(validator(makeGroup(''))).toBeNull();
  });

  it('should return null for user older than 13', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 20);
    expect(validator(makeGroup(date.toISOString().split('T')[0]))).toBeNull();
  });

  it('should return null for user exactly 13 today', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    expect(validator(makeGroup(date.toISOString().split('T')[0]))).toBeNull();
  });

  it('should return underage for user younger than 13', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 10);
    const result = validator(makeGroup(date.toISOString().split('T')[0]));
    expect(result).toBeTruthy();
    expect(result!['underage']).toBeTruthy();
    expect(result!['underage'].minAge).toBe(13);
    expect(result!['underage'].actualAge).toBe(10);
  });

  it('should return underage for user who is 12 turning 13 later this year', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    date.setMonth(date.getMonth() + 2);
    const result = validator(makeGroup(date.toISOString().split('T')[0]));
    expect(result).toBeTruthy();
    expect(result!['underage'].actualAge).toBe(12);
  });
});
