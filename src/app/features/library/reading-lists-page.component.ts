import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ReadingList } from '../../core/models/reading-list.model';
import { ReadingListsService } from '../../core/services/reading-lists.service';

@Component({
  selector: 'app-reading-lists-page',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, TitleCasePipe, NgClass],
  template: `
    <section class="lists-shell">
      <header class="hero card">
        <div class="hero-copy">
          <p class="eyebrow">Biblioteca</p>
          <h1>Listas de lectura</h1>
          <p class="lede">
            Organiza novelas por mood, pendientes, favoritos o colecciones personales.
          </p>
        </div>

        <div class="hero-actions">
          <div class="hero-stat">
            <strong>{{ lists().length }}</strong>
            <span>listas activas</span>
          </div>
          <button type="button" [disabled]="saving()" (click)="creating.set(!creating())">
            {{ creating() ? 'Cancelar' : '+ Nueva lista' }}
          </button>
        </div>
      </header>

      @if (creating()) {
        <form class="composer card" (ngSubmit)="saveList()">
          <div class="section-head">
            <div>
              <h2>Crear lista</h2>
              <p>Define un nombre claro, una nota breve y su visibilidad.</p>
            </div>
            <span class="badge" [ngClass]="visibility.toLowerCase()">{{
              visibility | titlecase
            }}</span>
          </div>

          <div class="form-grid">
            <label>
              <span>Nombre</span>
              <input
                [(ngModel)]="name"
                name="name"
                placeholder="Ej. Fantasia para fin de semana"
                required
                [disabled]="saving()"
              />
            </label>

            <label>
              <span>Visibilidad</span>
              <select [(ngModel)]="visibility" name="visibility" [disabled]="saving()">
                <option value="PRIVATE">Privada</option>
                <option value="PUBLIC">Publica</option>
              </select>
            </label>

            <label class="full-width">
              <span>Descripcion</span>
              <textarea
                [(ngModel)]="description"
                name="description"
                placeholder="Para guardar historias que quiero retomar despues."
                [disabled]="saving()"
              ></textarea>
            </label>
          </div>

          @if (message()) {
            <p class="feedback success">{{ message() }}</p>
          }
          @if (error()) {
            <p class="feedback error">{{ error() }}</p>
          }

          <div class="form-actions">
            <button type="button" class="secondary" [disabled]="saving()" (click)="resetComposer()">
              Limpiar
            </button>
            <button type="submit" [disabled]="saving() || !name.trim()">
              {{ saving() ? 'Guardando...' : 'Guardar lista' }}
            </button>
          </div>
        </form>
      }

      @if (!lists().length) {
        <section class="empty-state card">
          <h2>Todavia no tienes listas</h2>
          <p>Crea tu primera lista para agrupar novelas guardadas por tema o progreso.</p>
        </section>
      } @else {
        <section class="lists-grid">
          @for (list of lists(); track list.id) {
            <article class="list-card card">
              <div class="list-header">
                <div>
                  <a class="title-link" [routerLink]="['/biblioteca/listas', list.id]">
                    {{ list.name }}
                  </a>
                  <p>{{ list.description || 'Sin descripcion todavia.' }}</p>
                </div>
                <span class="badge" [ngClass]="list.visibility.toLowerCase()">
                  {{ list.visibility === 'PUBLIC' ? 'Publica' : 'Privada' }}
                </span>
              </div>

              <div class="meta-row">
                <span>{{ list.items_count }} novelas</span>
                <span>Actualizada {{ list.updated_at | date: 'mediumDate' }}</span>
              </div>

              <div class="card-actions">
                <a [routerLink]="['/biblioteca/listas', list.id]">Abrir lista</a>
                <button
                  type="button"
                  class="danger"
                  [disabled]="removingId() === list.id"
                  (click)="remove(list.id)"
                >
                  {{ removingId() === list.id ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .lists-shell,
      .hero,
      .composer,
      .lists-grid,
      .list-card {
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
      .hero {
        grid-template-columns: 1.4fr 0.8fr;
        align-items: end;
      }
      .eyebrow,
      .lede,
      .meta-row,
      .list-header p,
      .section-head p {
        color: var(--text-2);
      }
      .hero-actions,
      .hero-stat,
      .form-grid,
      label {
        display: grid;
        gap: 0.75rem;
      }
      .hero-actions {
        justify-items: end;
      }
      .hero-stat {
        padding: 1rem;
        min-width: 180px;
        border-radius: 1rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
      }
      .hero-stat strong {
        font-size: 2rem;
        line-height: 1;
      }
      .section-head,
      .list-header,
      .meta-row,
      .card-actions,
      .form-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      label span {
        font-size: 0.95rem;
        color: var(--text-2);
      }
      .full-width {
        grid-column: 1 / -1;
      }
      input,
      select,
      textarea,
      button,
      .card-actions a {
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        padding: 0.85rem 1rem;
        font: inherit;
      }
      input,
      select,
      textarea {
        background: var(--bg-surface);
        color: var(--text-1);
      }
      textarea {
        min-height: 110px;
        resize: vertical;
      }
      button,
      .card-actions a {
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
      }
      .secondary {
        background: transparent;
        color: var(--text-1);
      }
      .danger {
        background: color-mix(in srgb, #b42318 16%, var(--bg-card));
        color: #b42318;
      }
      .badge {
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        border: 1px solid var(--border);
      }
      .badge.public {
        background: color-mix(in srgb, #027a48 14%, var(--bg-card));
        color: #027a48;
      }
      .badge.private {
        background: color-mix(in srgb, #b54708 14%, var(--bg-card));
        color: #b54708;
      }
      .lists-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .title-link {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-1);
        text-decoration: none;
      }
      .feedback.success {
        color: #027a48;
      }
      .feedback.error {
        color: #b42318;
      }
      @media (max-width: 900px) {
        .hero,
        .form-grid,
        .lists-grid {
          grid-template-columns: 1fr;
        }
        .hero-actions {
          justify-items: stretch;
        }
      }
    `,
  ],
})
export class ReadingListsPageComponent {
  private readonly readingListsService = inject(ReadingListsService);
  readonly lists = signal<ReadingList[]>([]);
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly removingId = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  name = '';
  description = '';
  visibility: 'PUBLIC' | 'PRIVATE' = 'PRIVATE';

  constructor() {
    this.load();
  }

  saveList() {
    if (!this.name.trim() || this.saving()) {
      return;
    }

    this.error.set(null);
    this.message.set(null);
    this.saving.set(true);

    this.readingListsService
      .create({
        name: this.name.trim(),
        description: this.description.trim() || null,
        visibility: this.visibility,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set('Lista creada correctamente.');
          this.resetComposer(false);
          this.creating.set(false);
          this.load();
        },
        error: () => {
          this.error.set('No se pudo crear la lista.');
        },
      });
  }

  remove(id: string) {
    if (this.removingId()) {
      return;
    }

    this.removingId.set(id);
    this.error.set(null);
    this.message.set(null);

    this.readingListsService
      .remove(id)
      .pipe(finalize(() => this.removingId.set(null)))
      .subscribe({
        next: () => {
          this.message.set('Lista eliminada correctamente.');
          this.load();
        },
        error: () => {
          this.error.set('No se pudo eliminar la lista.');
        },
      });
  }

  resetComposer(clearFeedback = true) {
    this.name = '';
    this.description = '';
    this.visibility = 'PRIVATE';
    if (clearFeedback) {
      this.error.set(null);
      this.message.set(null);
    }
  }

  private load() {
    this.readingListsService.listMine().subscribe((lists) => this.lists.set(lists));
  }
}
