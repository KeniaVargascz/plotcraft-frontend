import { Component, signal } from '@angular/core';
import { RegisterStep1Component } from './steps/register-step1/register-step1.component';
import { RegisterStep2Component } from './steps/register-step2/register-step2.component';

export interface RegisterStep1Payload {
  nickname: string;
  username: string;
  email: string;
  password: string;
  birthdate: string | null;
}

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [RegisterStep1Component, RegisterStep2Component],
  template: `
    @if (step() === 1) {
      <app-register-step1 (submitted)="onStep1Complete($event)" />
    } @else {
      <app-register-step2 [email]="registeredEmail()" />
    }
  `,
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent {
  readonly step = signal(1);
  readonly registeredEmail = signal('');

  onStep1Complete(payload: RegisterStep1Payload & { email: string }): void {
    this.registeredEmail.set(payload.email);
    this.step.set(2);
  }
}
