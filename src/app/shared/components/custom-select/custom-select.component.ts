import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSelectComponent {
  @Input({ required: true }) options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly open = signal(false);

  constructor(private readonly elementRef: ElementRef) {}

  get selectedLabel(): string {
    const match = this.options.find((o) => o.value === this.value);
    return match?.label || this.placeholder || '';
  }

  toggle() {
    this.open.update((v) => !v);
  }

  select(option: SelectOption) {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event) {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
