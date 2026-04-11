import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'pc-password-strength-indicator',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (password) {
      <div class="strength-bar">
        <div class="strength-fill" [class]="level" [style.width]="fillWidth"></div>
      </div>
      <span class="strength-label" [class]="level">
        {{ labelKey | translate }}
      </span>
    }
  `,
  styles: [`
    :host { display: block; margin-top: -0.5rem; margin-bottom: 0.25rem; }
    .strength-bar {
      height: 4px;
      border-radius: 2px;
      background: var(--border, #e0e0e0);
      overflow: hidden;
    }
    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s, background 0.3s;
    }
    .strength-fill.weak   { background: var(--danger, #ef4444); }
    .strength-fill.medium { background: var(--warning, #f59e0b); }
    .strength-fill.strong { background: var(--success, #22c55e); }
    .strength-label {
      font-size: 0.75rem;
      font-weight: 500;
    }
    .strength-label.weak   { color: var(--danger, #ef4444); }
    .strength-label.medium { color: var(--warning, #f59e0b); }
    .strength-label.strong { color: var(--success, #22c55e); }
  `],
})
export class PasswordStrengthIndicatorComponent {
  @Input() password = '';

  get level(): 'empty' | 'weak' | 'medium' | 'strong' {
    if (!this.password) return 'empty';
    const checks = {
      length:  this.password.length >= 8,
      upper:   /[A-Z]/.test(this.password),
      lower:   /[a-z]/.test(this.password),
      number:  /\d/.test(this.password),
      special: /[!@#$%^&*]/.test(this.password),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed <= 2) return 'weak';
    if (passed <= 4) return 'medium';
    return 'strong';
  }

  get fillWidth(): string {
    const map = { empty: '0%', weak: '33%', medium: '66%', strong: '100%' };
    return map[this.level];
  }

  get labelKey(): string {
    return `auth.register.strength.${this.level}`;
  }
}
