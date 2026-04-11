import { FormControl } from '@angular/forms';
import { nicknameFormatValidator } from './nickname-format.validator';

describe('nicknameFormatValidator', () => {
  const validator = nicknameFormatValidator();

  it('should return null for valid nickname with letters and spaces', () => {
    expect(validator(new FormControl('María José'))).toBeNull();
  });

  it('should return null for valid nickname with accented characters', () => {
    expect(validator(new FormControl('José García'))).toBeNull();
  });

  it('should return null for valid nickname with numbers', () => {
    expect(validator(new FormControl('Author42'))).toBeNull();
  });

  it('should return null for empty value (required handles that)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('should return error for only spaces', () => {
    expect(validator(new FormControl('   '))).toEqual({ nicknameFormat: true });
  });

  it('should return error for special characters like <>', () => {
    expect(validator(new FormControl('user<script>'))).toEqual({ nicknameFormat: true });
  });

  it('should return error for quotes', () => {
    expect(validator(new FormControl('user"name'))).toEqual({ nicknameFormat: true });
  });

  it('should return error for slash', () => {
    expect(validator(new FormControl('user/name'))).toEqual({ nicknameFormat: true });
  });
});
