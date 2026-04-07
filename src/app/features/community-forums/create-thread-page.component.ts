import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagChipsInputComponent } from '../../shared/components/tag-chips-input/tag-chips-input.component';
import { CommunityForumsService } from './services/community-forums.service';
import { CommunityForum } from './models/community-forum.model';

@Component({
  selector: 'app-create-thread-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TagChipsInputComponent],
  template: `
    <section class="page">
      <nav class="breadcrumb">
        <a routerLink="/comunidades">Comunidades</a>
        <span>/</span>
        <a [routerLink]="['/comunidades', communitySlug()]">{{ communitySlug() }}</a>
        <span>/</span>
        <a [routerLink]="['/comunidades', communitySlug(), 'foros', forumSlug()]">
          {{ forum()?.name ?? forumSlug() }}
        </a>
        <span>/</span>
        <span>Nuevo hilo</span>
      </nav>

      <h1>Nuevo hilo</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form">
        <label class="field">
          <span>Título del hilo</span>
          <input
            type="text"
            formControlName="title"
            maxlength="300"
            placeholder="Escribe un título descriptivo"
          />
          <small>{{ form.controls.title.value.length }}/300</small>
        </label>

        <label class="field">
          <span>Contenido (Markdown)</span>
          <textarea
            formControlName="content"
            rows="12"
            maxlength="50000"
            placeholder="Comparte tus ideas..."
          ></textarea>
        </label>

        <div class="field">
          <span>Etiquetas</span>
          <app-tag-chips-input formControlName="tags" [maxTags]="5" />
        </div>

        <div class="field">
          <label class="toggle">
            <input type="checkbox" [checked]="includePoll()" (change)="togglePoll()" />
            <span>Añadir encuesta</span>
          </label>
          @if (includePoll()) {
            <div class="poll-block" [formGroup]="pollForm">
              <label class="field">
                <span>Pregunta</span>
                <input type="text" formControlName="question" maxlength="300" />
              </label>
              <div class="poll-options" formArrayName="options">
                @for (opt of pollOptions.controls; track $index) {
                  <div class="opt-row">
                    <input type="text" [formControlName]="$index" placeholder="Opción" />
                    @if (pollOptions.length > 2) {
                      <button type="button" (click)="removeOption($index)">x</button>
                    }
                  </div>
                }
              </div>
              @if (pollOptions.length < 6) {
                <button type="button" class="btn small" (click)="addOption()">+ Opción</button>
              }
              <label class="field">
                <span>Fecha de cierre (opcional)</span>
                <input type="datetime-local" formControlName="closesAt" />
              </label>
            </div>
          }
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <div class="actions">
          <button type="button" class="btn" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Publicando...' : 'Publicar hilo' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .page {
        max-width: 800px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .breadcrumb {
        font-size: 0.85rem;
        color: var(--text-3);
        display: flex;
        gap: 0.4rem;
      }
      .breadcrumb a {
        color: var(--accent);
        text-decoration: none;
      }
      .form {
        display: grid;
        gap: 1rem;
      }
      .field {
        display: grid;
        gap: 0.35rem;
      }
      .field input,
      .field textarea {
        padding: 0.7rem 0.85rem;
        border-radius: 0.65rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-family: inherit;
        font-size: 0.95rem;
      }
      .field small {
        text-align: right;
        color: var(--text-3);
      }
      .toggle {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        color: var(--text-2);
      }
      .poll-block {
        display: grid;
        gap: 0.65rem;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--bg-surface);
      }
      .opt-row {
        display: flex;
        gap: 0.4rem;
      }
      .opt-row input {
        flex: 1;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .btn {
        padding: 0.6rem 1.1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        cursor: pointer;
        font-weight: 600;
      }
      .btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .btn.small {
        padding: 0.35rem 0.75rem;
        font-size: 0.85rem;
      }
      .btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        color: #e49d9d;
      }
    `,
  ],
})
export class CreateThreadPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CommunityForumsService);
  private readonly snackbar = inject(MatSnackBar);

  readonly communitySlug = signal('');
  readonly forumSlug = signal('');
  readonly forum = signal<CommunityForum | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly includePoll = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50000)]],
    tags: this.fb.nonNullable.control<string[]>([]),
  });

  readonly pollForm = this.fb.nonNullable.group({
    question: ['', [Validators.maxLength(300)]],
    options: this.fb.array<FormControl<string>>([
      this.fb.nonNullable.control(''),
      this.fb.nonNullable.control(''),
    ]),
    closesAt: [''],
  });

  get pollOptions(): FormArray<FormControl<string>> {
    return this.pollForm.controls.options;
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const cs = params.get('slug') ?? '';
      const fs = params.get('forumSlug') ?? '';
      this.communitySlug.set(cs);
      this.forumSlug.set(fs);
      this.service.getForum(cs, fs).subscribe({
        next: (f) => {
          this.forum.set(f);
          if (!f.isMember) {
            this.snackbar.open('Únete al foro para publicar.', 'Cerrar', { duration: 3000 });
            void this.router.navigate(['/comunidades', cs, 'foros', fs]);
          }
        },
        error: () => {
          void this.router.navigate(['/comunidades', cs]);
        },
      });
    });
  }

  togglePoll() {
    this.includePoll.update((v) => !v);
  }

  addOption() {
    if (this.pollOptions.length < 6) {
      this.pollOptions.push(this.fb.nonNullable.control(''));
    }
  }

  removeOption(i: number) {
    if (this.pollOptions.length > 2) {
      this.pollOptions.removeAt(i);
    }
  }

  cancel() {
    void this.router.navigate(['/comunidades', this.communitySlug(), 'foros', this.forumSlug()]);
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    let poll: { question: string; options: string[]; closesAt?: string } | null = null;
    if (this.includePoll()) {
      const pv = this.pollForm.getRawValue();
      const opts = (pv.options as string[]).map((o) => o.trim()).filter(Boolean);
      if (pv.question.trim() && opts.length >= 2) {
        poll = { question: pv.question.trim(), options: opts };
        if (pv.closesAt) poll.closesAt = pv.closesAt;
      }
    }
    this.service
      .createThread(this.communitySlug(), this.forumSlug(), {
        title: v.title.trim(),
        content: v.content,
        tags: v.tags,
        poll,
      })
      .subscribe({
        next: (thread) => {
          this.saving.set(false);
          void this.router.navigate([
            '/comunidades',
            this.communitySlug(),
            'foros',
            this.forumSlug(),
            'hilos',
            thread.slug,
          ]);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo publicar el hilo.');
        },
      });
  }
}
