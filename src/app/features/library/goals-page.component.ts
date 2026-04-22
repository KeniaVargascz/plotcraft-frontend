import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReadingGoal } from '../../core/models/library.model';
import { LibraryService } from '../../core/services/library.service';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="goals-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Biblioteca</p>
          <h1>Metas</h1>
          <p class="lede">
            Define objetivos mensuales o anuales y sigue tu avance de lectura real.
          </p>
        </div>
        <div class="hero-stat">
          <strong>{{ goals().length }}</strong>
          <span>metas registradas</span>
        </div>
      </header>

      <form class="composer card" (ngSubmit)="save()">
        <div class="form-grid">
          <label>
            <span>Ano</span>
            <input
              [(ngModel)]="year"
              name="year"
              type="number"
              min="2020"
              max="2100"
              [disabled]="saving()"
            />
          </label>

          <label>
            <span>Mes</span>
            <input
              [(ngModel)]="month"
              name="month"
              type="number"
              min="1"
              max="12"
              [disabled]="saving()"
            />
          </label>

          <label class="full-width">
            <span>Meta de palabras</span>
            <input
              [(ngModel)]="targetWords"
              name="targetWords"
              type="number"
              min="1"
              [disabled]="saving()"
            />
          </label>
        </div>

        @if (message()) {
          <p class="feedback success">{{ message() }}</p>
        }

        <div class="actions">
          <button type="submit" [disabled]="saving() || targetWords < 1">
            {{ saving() ? 'Guardando...' : 'Guardar meta' }}
          </button>
        </div>
      </form>

      @if (!goals().length) {
        <section class="empty-state card">
          <h2>No hay metas registradas</h2>
          <p>Empieza con un objetivo sencillo y deja que la biblioteca calcule tu progreso.</p>
        </section>
      } @else {
        <section class="grid">
          @for (goal of goals(); track goal.id) {
            <article class="goal-card card">
              <div class="row">
                <strong>{{ goal.year }}{{ goal.month ? '/' + goal.month : '' }}</strong>
                <span>{{ (goal.progress.pctComplete * 100).toFixed(0) }}%</span>
              </div>
              <div class="meter">
                <span [style.width.%]="goal.progress.pctComplete * 100"></span>
              </div>
              <div class="meta">
                <span>{{ goal.progress.wordsRead }} / {{ goal.targetWords }} palabras</span>
                <span>{{ goal.progress.chaptersRead }} capitulos leidos</span>
                <span>{{ goal.progress.novelsRead }} novelas avanzadas</span>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .goals-shell,
      .grid {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 92%, white 8%),
          var(--bg-card)
        );
        box-shadow: 0 12px 30px color-mix(in srgb, var(--bg) 82%, transparent);
      }
      .hero,
      .row,
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .eyebrow,
      .lede,
      .meta {
        color: var(--text-2);
      }
      .hero-stat {
        display: grid;
        gap: 0.35rem;
        min-width: 180px;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .hero-stat strong {
        font-size: 2rem;
        line-height: 1;
      }
      .composer,
      .goal-card,
      .meta {
        display: grid;
        gap: 1rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.5rem;
      }
      label span {
        color: var(--text-2);
      }
      .full-width {
        grid-column: 1 / -1;
      }
      input,
      button {
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        padding: 0.85rem 1rem;
        font: inherit;
      }
      input {
        background: var(--bg-surface);
        color: var(--text-1);
      }
      button {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .meter {
        height: 12px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--bg-surface);
      }
      .meter span {
        display: block;
        height: 100%;
        background: var(--accent);
      }
      .feedback.success {
        color: #027a48;
      }
      @media (max-width: 900px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class GoalsPageComponent {
  private readonly libraryService = inject(LibraryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly goals = signal<ReadingGoal[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);

  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  targetWords = 50000;

  constructor() {
    this.load();
  }

  save() {
    if (this.saving()) {
      return;
    }

    this.message.set(null);
    this.saving.set(true);
    this.libraryService
      .saveGoal({
        year: this.year,
        month: this.month || null,
        targetWords: this.targetWords,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.message.set('Meta guardada correctamente.');
        this.load();
      });
  }

  private load() {
    this.libraryService.listGoals().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((goals) => this.goals.set(goals));
  }
}
