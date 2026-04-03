import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarkdownService } from '../../../core/services/markdown.service';

@Component({
  selector: 'app-reply-composer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="composer">
      <div class="tabs">
        <button
          type="button"
          class="tab"
          [class.active]="!previewing()"
          (click)="previewing.set(false)"
        >
          Escribir
        </button>
        <button
          type="button"
          class="tab"
          [class.active]="previewing()"
          (click)="previewing.set(true)"
        >
          Vista previa
        </button>
      </div>

      @if (previewing()) {
        <div class="preview" [innerHTML]="rendered()"></div>
      } @else {
        <textarea
          [(ngModel)]="content"
          class="textarea"
          rows="5"
          placeholder="Escribe tu respuesta... (Markdown soportado)"
          [disabled]="disabled()"
          (keydown.control.enter)="submit()"
          (keydown.meta.enter)="submit()"
        ></textarea>
      }

      <div class="footer">
        <span class="counter" [class.over]="content.length > maxLength">
          {{ content.length }}/{{ maxLength }}
        </span>
        <button
          type="button"
          class="submit-btn"
          [disabled]="disabled() || !content.trim() || content.length > maxLength"
          (click)="submit()"
        >
          Responder
        </button>
      </div>
    </div>
  `,
  styles: [`
    .composer {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      overflow: hidden;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
    }
    .tab {
      flex: 1;
      padding: 0.55rem;
      border: none;
      background: transparent;
      color: var(--text-2);
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
    }
    .tab.active {
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
    }
    .textarea {
      width: 100%;
      border: none;
      background: var(--bg-surface);
      color: var(--text-1);
      padding: 0.85rem;
      font-family: inherit;
      font-size: 0.9rem;
      resize: vertical;
      min-height: 100px;
    }
    .textarea:focus { outline: none; }
    .preview {
      padding: 0.85rem;
      min-height: 100px;
      color: var(--text-1);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      border-top: 1px solid var(--border);
    }
    .counter {
      font-size: 0.75rem;
      color: var(--text-3);
    }
    .counter.over { color: var(--danger); }
    .submit-btn {
      padding: 0.45rem 1.1rem;
      border-radius: 0.65rem;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class ReplyComposerComponent {
  private readonly md = inject(MarkdownService);

  readonly threadSlug = input.required<string>();
  readonly disabled = input(false);

  readonly submitted = output<string>();

  readonly previewing = signal(false);
  content = '';
  readonly maxLength = 10000;

  rendered() {
    return this.md.render(this.content);
  }

  submit() {
    const text = this.content.trim();
    if (!text || text.length > this.maxLength) return;
    this.submitted.emit(text);
    this.content = '';
    this.previewing.set(false);
  }
}
