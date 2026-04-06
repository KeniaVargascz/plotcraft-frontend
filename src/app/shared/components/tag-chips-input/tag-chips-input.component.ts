import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-tag-chips-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tag-chips-input.component.html',
  styleUrl: './tag-chips-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagChipsInputComponent),
      multi: true,
    },
  ],
})
export class TagChipsInputComponent implements ControlValueAccessor {
  @Input() tags: string[] = [];
  @Input() maxTags = 10;
  @Input() placeholder = 'Anadir etiqueta...';
  @Output() tagsChange = new EventEmitter<string[]>();

  inputValue = '';
  private onChange?: (value: string[]) => void;
  private onTouched?: () => void;

  get isMaxReached() {
    return this.tags.length >= this.maxTags;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && !this.inputValue && this.tags.length) {
      this.removeTag(this.tags.length - 1);
    }
  }

  addTag() {
    const normalized = this.inputValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/,/g, '');
    if (!normalized || this.tags.includes(normalized) || this.isMaxReached) {
      this.inputValue = '';
      return;
    }
    this.tags = [...this.tags, normalized];
    this.inputValue = '';
    this.emitChange();
  }

  removeTag(index: number) {
    this.tags = this.tags.filter((_, i) => i !== index);
    this.emitChange();
  }

  writeValue(value: string[]): void {
    this.tags = value ?? [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private emitChange() {
    this.tagsChange.emit(this.tags);
    this.onChange?.(this.tags);
    this.onTouched?.();
  }
}
