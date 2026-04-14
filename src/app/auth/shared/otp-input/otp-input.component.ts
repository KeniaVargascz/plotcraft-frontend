import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';

@Component({
  selector: 'pc-otp-input',
  standalone: true,
  template: `
    <div class="otp-wrapper">
      @for (d of digits; track $index) {
        <input
          #digitInput
          type="text"
          inputmode="numeric"
          maxlength="1"
          [value]="digits[$index]"
          (input)="onInput($index, $event)"
          (keydown)="onKeydown($index, $event)"
          (paste)="onPaste($event)"
          [attr.aria-label]="'Digito ' + ($index + 1)"
          class="otp-digit"
        />
      }
    </div>
  `,
  styles: [
    `
      .otp-wrapper {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      .otp-digit {
        width: 3rem;
        height: 3.5rem;
        text-align: center;
        font-size: 1.5rem;
        font-weight: 600;
        border: 1px solid var(--border, #ccc);
        border-radius: 0.5rem;
        background: var(--bg-card, #fff);
        color: var(--text-1, #333);
        outline: none;
        transition: border-color 0.2s;
      }
      .otp-digit:focus {
        border-color: var(--primary, #6366f1);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary, #6366f1) 25%, transparent);
      }
    `,
  ],
})
export class OtpInputComponent {
  @Input() length = 6;
  @Output() completed = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  @ViewChildren('digitInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits: string[] = Array(6).fill('');

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const char = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = char;
    input.value = char;

    if (char && index < this.length - 1) {
      this.focusAt(index + 1);
    }

    this.checkComplete();
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        event.preventDefault();
        this.digits[index - 1] = '';
        const prev = this.inputs.get(index - 1);
        if (prev) {
          prev.nativeElement.value = '';
          prev.nativeElement.focus();
        }
      } else {
        this.digits[index] = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    const chars = pasted.slice(0, this.length).split('');

    chars.forEach((char, i) => {
      this.digits[i] = char;
      const input = this.inputs.get(i);
      if (input) input.nativeElement.value = char;
    });

    const nextIndex = Math.min(chars.length, this.length - 1);
    this.focusAt(nextIndex);
    this.checkComplete();
  }

  clear(): void {
    this.digits = Array(this.length).fill('');
    this.inputs.forEach((ref) => (ref.nativeElement.value = ''));
    this.focusAt(0);
    this.cleared.emit();
  }

  private focusAt(index: number): void {
    const input = this.inputs.get(index);
    if (input) input.nativeElement.focus();
  }

  private checkComplete(): void {
    const code = this.digits.join('');
    if (code.length === this.length && this.digits.every((d) => d !== '')) {
      this.completed.emit(code);
    }
  }
}
