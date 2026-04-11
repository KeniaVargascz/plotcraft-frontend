import { FormControl } from '@angular/forms';
import { usernameFormatValidator } from './username-format.validator';

describe('usernameFormatValidator', () => {
  const validator = usernameFormatValidator();

  it('should return null for valid username', () => {
    expect(validator(new FormControl('john_doe'))).toBeNull();
  });

  it('should return null for username with hyphens', () => {
    expect(validator(new FormControl('john-doe'))).toBeNull();
  });

  it('should return null for alphanumeric only', () => {
    expect(validator(new FormControl('user123'))).toBeNull();
  });

  it('should return null for empty value', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('should return error for too short username (2 chars)', () => {
    expect(validator(new FormControl('ab'))).toEqual({ usernameFormat: true });
  });

  it('should return error for username starting with hyphen', () => {
    expect(validator(new FormControl('-username'))).toEqual({ usernameFormat: true });
  });

  it('should return error for username ending with underscore', () => {
    expect(validator(new FormControl('username_'))).toEqual({ usernameFormat: true });
  });

  it('should return error for username with spaces', () => {
    expect(validator(new FormControl('user name'))).toEqual({ usernameFormat: true });
  });

  it('should return error for username starting with underscore', () => {
    expect(validator(new FormControl('_user'))).toEqual({ usernameFormat: true });
  });

  it('should return error for username ending with hyphen', () => {
    expect(validator(new FormControl('user-'))).toEqual({ usernameFormat: true });
  });

  it('should return null for exactly 3 chars valid', () => {
    expect(validator(new FormControl('abc'))).toBeNull();
  });

  it('should return null for exactly 30 chars valid', () => {
    expect(validator(new FormControl('a' + 'b'.repeat(28) + 'c'))).toBeNull();
  });
});
