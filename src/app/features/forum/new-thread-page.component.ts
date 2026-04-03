import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ForumCategory } from '../../core/models/forum-thread.model';
import { ForumService } from '../../core/services/forum.service';
import { MarkdownService } from '../../core/services/markdown.service';

type CategoryOption = { value: ForumCategory; label: string };

const CATEGORIES: CategoryOption[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'FEEDBACK', label: 'Feedback' },
  { value: 'WRITING_TIPS', label: 'Consejos de escritura' },
  { value: 'WORLD_BUILDING', label: 'Worldbuilding' },
  { value: 'CHARACTERS', label: 'Personajes' },
  { value: 'SHOWCASE', label: 'Showcase' },
  { value: 'ANNOUNCEMENTS', label: 'Anuncios' },
  { value: 'HELP', label: 'Ayuda' },
  { value: 'OFF_TOPIC', label: 'Off-topic' },
];

@Component({
  selector: 'app-new-thread-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="new-thread-page">
      <h1 class="page-title">Nuevo hilo</h1>

      <div class="form-card">
        <!-- Title -->
        <label class="field">
          <span class="label">Titulo</span>
          <input
            type="text"
            [(ngModel)]="title"
            maxlength="300"
            placeholder="Titulo del hilo"
            class="input"
          />
          <span class="counter">{{ title.length }}/300</span>
        </label>

        <!-- Category -->
        <label class="field">
          <span class="label">Categoria</span>
          <select [(ngModel)]="category" class="input">
            @for (cat of categories; track cat.value) {
              <option [value]="cat.value">{{ cat.label }}</option>
            }
          </select>
        </label>

        <!-- Tags -->
        <div class="field">
          <span class="label">Etiquetas (max 5)</span>
          <div class="tags-input">
            @for (tag of tags(); track $index) {
              <span class="tag-chip">
                {{ tag }}
                <button type="button" class="tag-remove" (click)="removeTag($index)">x</button>
              </span>
            }
            @if (tags().length < 5) {
              <input
                type="text"
                [(ngModel)]="newTag"
                placeholder="Agregar etiqueta..."
                class="tag-field"
                (keydown.enter)="addTag()"
              />
            }
          </div>
        </div>

        <!-- Content -->
        <div class="field">
          <div class="content-tabs">
            <button
              type="button"
              class="tab"
              [class.active]="!previewContent()"
              (click)="previewContent.set(false)"
            >
              Escribir
            </button>
            <button
              type="button"
              class="tab"
              [class.active]="previewContent()"
              (click)="previewContent.set(true)"
            >
              Vista previa
            </button>
          </div>

          @if (previewContent()) {
            <div class="preview" [innerHTML]="renderedContent()"></div>
          } @else {
            <textarea
              [(ngModel)]="content"
              class="textarea"
              rows="10"
              placeholder="Escribe el contenido de tu hilo... (Markdown soportado)"
            ></textarea>
          }
        </div>

        <!-- Poll (collapsible) -->
        <div class="field">
          <button type="button" class="toggle-poll" (click)="showPoll.set(!showPoll())">
            {{ showPoll() ? '- Quitar encuesta' : '+ Agregar encuesta' }}
          </button>

          @if (showPoll()) {
            <div class="poll-section">
              <label class="field">
                <span class="label">Pregunta de la encuesta</span>
                <input
                  type="text"
                  [(ngModel)]="pollQuestion"
                  maxlength="300"
                  placeholder="Pregunta..."
                  class="input"
                />
              </label>

              <div class="poll-options">
                <span class="label">Opciones (2-8)</span>
                @for (opt of pollOptions(); track $index) {
                  <div class="option-row">
                    <input
                      type="text"
                      [ngModel]="opt"
                      (ngModelChange)="updateOption($index, $event)"
                      maxlength="200"
                      [placeholder]="'Opcion ' + ($index + 1)"
                      class="input"
                    />
                    @if (pollOptions().length > 2) {
                      <button type="button" class="remove-opt" (click)="removeOption($index)">x</button>
                    }
                  </div>
                }
                @if (pollOptions().length < 8) {
                  <button type="button" class="add-opt" (click)="addOption()">+ Agregar opcion</button>
                }
              </div>

              <label class="field">
                <span class="label">Cierre de la encuesta (opcional)</span>
                <input
                  type="datetime-local"
                  [(ngModel)]="pollClosesAt"
                  class="input"
                />
              </label>
            </div>
          }
        </div>

        <!-- Submit -->
        <button
          type="button"
          class="submit-btn"
          [disabled]="submitting() || !title.trim() || !content.trim()"
          (click)="publish()"
        >
          {{ submitting() ? 'Publicando...' : 'Publicar hilo' }}
        </button>

        @if (errorMsg()) {
          <p class="error-msg">{{ errorMsg() }}</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .new-thread-page {
      max-width: 720px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .page-title {
      font-size: 1.5rem;
      color: var(--text-1);
      margin: 0 0 1.25rem;
    }
    .form-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      display: grid;
      gap: 1rem;
    }
    .field {
      display: grid;
      gap: 0.35rem;
    }
    .label {
      font-size: 0.85rem;
      color: var(--text-2);
      font-weight: 500;
    }
    .input,
    .textarea {
      padding: 0.65rem 0.85rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-1);
      font-family: inherit;
      font-size: 0.9rem;
    }
    .textarea {
      resize: vertical;
      min-height: 160px;
    }
    .counter {
      font-size: 0.75rem;
      color: var(--text-3);
      text-align: right;
    }
    .tags-input {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0.4rem;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      background: var(--bg-surface);
    }
    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      background: var(--accent);
      color: #fff;
      font-size: 0.8rem;
    }
    .tag-remove {
      background: none;
      border: none;
      color: var(--accent-text);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0;
      line-height: 1;
    }
    .tag-field {
      flex: 1;
      min-width: 100px;
      border: none;
      background: transparent;
      color: var(--text-1);
      font-size: 0.85rem;
      outline: none;
    }
    .content-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0.5rem;
    }
    .tab {
      flex: 1;
      padding: 0.5rem;
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
    .preview {
      min-height: 160px;
      padding: 0.75rem;
      color: var(--text-1);
      font-size: 0.9rem;
      line-height: 1.6;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      background: var(--bg-surface);
    }
    .toggle-poll {
      background: none;
      border: 1px dashed var(--border);
      border-radius: 0.65rem;
      padding: 0.55rem;
      color: var(--accent);
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .poll-section {
      display: grid;
      gap: 0.75rem;
      margin-top: 0.65rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      background: var(--bg-surface);
    }
    .poll-options { display: grid; gap: 0.4rem; }
    .option-row {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .option-row .input { flex: 1; }
    .remove-opt {
      padding: 0.35rem 0.55rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--danger);
      cursor: pointer;
      font-size: 0.8rem;
    }
    .add-opt {
      padding: 0.4rem 0.75rem;
      border-radius: 0.55rem;
      border: 1px dashed var(--border);
      background: transparent;
      color: var(--accent);
      cursor: pointer;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    .submit-btn {
      padding: 0.65rem;
      border-radius: 0.75rem;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .submit-btn:hover:not(:disabled) {
      box-shadow: 0 0 12px var(--accent-glow);
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.85rem;
      margin: 0;
    }
  `],
})
export class NewThreadPageComponent {
  private readonly forumService = inject(ForumService);
  private readonly router = inject(Router);
  private readonly md = inject(MarkdownService);

  readonly categories = CATEGORIES;

  title = '';
  category: ForumCategory = 'GENERAL';
  content = '';
  newTag = '';

  readonly tags = signal<string[]>([]);
  readonly previewContent = signal(false);
  readonly showPoll = signal(false);
  readonly submitting = signal(false);
  readonly errorMsg = signal('');

  pollQuestion = '';
  readonly pollOptions = signal<string[]>(['', '']);
  pollClosesAt = '';

  renderedContent() {
    return this.md.render(this.content);
  }

  addTag() {
    const tag = this.newTag.trim().toLowerCase();
    if (!tag || this.tags().includes(tag) || this.tags().length >= 5) return;
    this.tags.set([...this.tags(), tag]);
    this.newTag = '';
  }

  removeTag(index: number) {
    this.tags.set(this.tags().filter((_, i) => i !== index));
  }

  addOption() {
    if (this.pollOptions().length >= 8) return;
    this.pollOptions.set([...this.pollOptions(), '']);
  }

  removeOption(index: number) {
    if (this.pollOptions().length <= 2) return;
    this.pollOptions.set(this.pollOptions().filter((_, i) => i !== index));
  }

  updateOption(index: number, value: string) {
    const opts = [...this.pollOptions()];
    opts[index] = value;
    this.pollOptions.set(opts);
  }

  publish() {
    const titleVal = this.title.trim();
    const contentVal = this.content.trim();
    if (!titleVal || !contentVal) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const payload: any = {
      title: titleVal,
      content: contentVal,
      category: this.category,
      tags: this.tags().length ? this.tags() : undefined,
    };

    if (this.showPoll() && this.pollQuestion.trim()) {
      const validOptions = this.pollOptions().filter((o) => o.trim());
      if (validOptions.length >= 2) {
        payload.poll = {
          question: this.pollQuestion.trim(),
          options: validOptions,
          closesAt: this.pollClosesAt || undefined,
        };
      }
    }

    this.forumService.createThread(payload).subscribe({
      next: (thread) => {
        this.submitting.set(false);
        void this.router.navigate(['/foro', thread.slug]);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMsg.set('Error al publicar el hilo. Intenta de nuevo.');
      },
    });
  }
}
