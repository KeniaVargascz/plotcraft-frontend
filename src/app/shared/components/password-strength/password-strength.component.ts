import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

type PasswordRule = {
  key: string;
  label: string;
  passed: boolean;
};

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './password-strength.component.html',
  styleUrl: './password-strength.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  @Input() password = '';

  get rules(): PasswordRule[] {
    return [
      {
        key: 'length',
        label: 'auth.passwordStrength.length',
        passed: this.password.length >= 8,
      },
      {
        key: 'uppercase',
        label: 'auth.passwordStrength.uppercase',
        passed: /[A-Z]/.test(this.password),
      },
      {
        key: 'lowercase',
        label: 'auth.passwordStrength.lowercase',
        passed: /[a-z]/.test(this.password),
      },
      {
        key: 'number',
        label: 'auth.passwordStrength.number',
        passed: /\d/.test(this.password),
      },
      {
        key: 'special',
        label: 'auth.passwordStrength.special',
        passed: /[^A-Za-z0-9]/.test(this.password),
      },
    ];
  }

  get score(): number {
    return this.rules.filter((rule) => rule.passed).length;
  }

  get tone(): 'weak' | 'medium' | 'strong' {
    if (this.score >= 5) {
      return 'strong';
    }

    if (this.score >= 3) {
      return 'medium';
    }

    return 'weak';
  }

  get label(): string {
    return `auth.passwordStrength.levels.${this.tone}`;
  }
}
