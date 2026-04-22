import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ReadingList } from '../../core/models/reading-list.model';
import { ReadingListsService } from '../../core/services/reading-lists.service';

@Component({
  selector: 'app-reading-list-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, NgClass],
  template: `
    @if (list(); as current) {
      <section class="detail-shell">
        <header class="hero card">
          <div class="hero-copy">
            <a class="back-link" routerLink="/biblioteca/listas">Volver a listas</a>
            <div class="hero-head">
              <h1>{{ current.name }}</h1>
              <span class="badge" [ngClass]="current.visibility.toLowerCase()">
                {{ current.visibility === 'PUBLIC' ? 'Publica' : 'Privada' }}
              </span>
            </div>
            <p class="lede">{{ current.description || 'Esta lista aun no tiene descripcion.' }}</p>
          </div>

          <div class="hero-meta">
            <div class="meta-card">
              <strong>{{ current.items_count }}</strong>
              <span>novelas guardadas</span>
            </div>
            <div class="meta-card">
              <strong>{{ current.updatedAt | date: 'mediumDate' }}</strong>
              <span>ultima actualizacion</span>
            </div>
          </div>
        </header>

        @if (message()) {
          <p class="feedback success">{{ message() }}</p>
        }
        @if (error()) {
          <p class="feedback error">{{ error() }}</p>
        }

        @if (!(current.items ?? []).length) {
          <section class="empty-state card">
            <h2>La lista esta vacia</h2>
            <p>Agrega novelas desde su detalle usando la accion "Guardar en lista".</p>
          </section>
        } @else {
          <section class="items-grid">
            @for (item of current.items ?? []; track item.novel.id) {
              <article class="item-card card">
                <div class="item-top">
                  <div class="cover">{{ item.novel.title.charAt(0) }}</div>

                  <div class="item-copy">
                    <div class="item-head">
                      <a class="title-link" [routerLink]="['/novelas', item.novel.slug]">
                        {{ item.novel.title }}
                      </a>
                      <span>{{ item.novel.author.displayName }}</span>
                    </div>

                    <div class="meta-row">
                      <span>{{ item.novel.stats.chaptersCount }} capitulos</span>
                      <span>{{ item.novel.stats.likesCount }} likes</span>
                      <span>{{ item.novel.status | titlecase }}</span>
                    </div>
                  </div>
                </div>

                @if (item.personal_note) {
                  <p class="note">{{ item.personal_note }}</p>
                } @else {
                  <p class="note note-muted">Sin nota personal para esta novela.</p>
                }

                <div class="card-actions">
                  <a [routerLink]="['/novelas', item.novel.slug]">Ver detalle</a>
                  <button
                    type="button"
                    class="danger"
                    [disabled]="removingNovelId() === item.novel.id"
                    (click)="remove(item.novel.id)"
                  >
                    {{ removingNovelId() === item.novel.id ? 'Quitando...' : 'Quitar de la lista' }}
                  </button>
                </div>
              </article>
            }
          </section>
        }
      </section>
    }
  `,
  styles: [
    `
      .detail-shell,
      .hero,
      .hero-copy,
      .items-grid,
      .item-card {
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
        grid-template-columns: 1.25fr 0.75fr;
        align-items: start;
      }
      .back-link,
      .title-link,
      .card-actions a {
        text-decoration: none;
      }
      .back-link,
      .lede,
      .item-head span,
      .meta-row,
      .note-muted,
      .meta-card span {
        color: var(--text-2);
      }
      .hero-head,
      .card-actions,
      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .hero-meta {
        display: grid;
        gap: 0.85rem;
      }
      .meta-card {
        display: grid;
        gap: 0.35rem;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
      }
      .meta-card strong {
        font-size: 1.2rem;
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
      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .item-top {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 1rem;
      }
      .cover {
        display: grid;
        place-items: center;
        min-height: 96px;
        border-radius: 1rem;
        font-size: 1.8rem;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .item-copy,
      .item-head {
        display: grid;
        gap: 0.5rem;
      }
      .title-link {
        color: var(--text-1);
        font-size: 1.1rem;
        font-weight: 700;
      }
      .note {
        margin: 0;
        padding: 0.95rem 1rem;
        border-radius: 1rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
      }
      button,
      .card-actions a {
        border-radius: 0.95rem;
        border: 1px solid var(--border);
        padding: 0.85rem 1rem;
        font: inherit;
      }
      .card-actions a {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .danger {
        background: color-mix(in srgb, #b42318 16%, var(--bg-card));
        color: #b42318;
      }
      .feedback.success {
        color: #027a48;
      }
      .feedback.error {
        color: #b42318;
      }
      @media (max-width: 900px) {
        .hero,
        .items-grid,
        .item-top {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReadingListDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly readingListsService = inject(ReadingListsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly list = signal<ReadingList | null>(null);
  readonly removingNovelId = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }

      this.load(id);
    });
  }

  remove(novelId: string) {
    const list = this.list();
    if (!list || this.removingNovelId()) {
      return;
    }

    this.removingNovelId.set(novelId);
    this.message.set(null);
    this.error.set(null);

    this.readingListsService
      .removeItem(list.id, novelId)
      .pipe(finalize(() => this.removingNovelId.set(null)))
      .subscribe({
        next: () => {
          this.message.set('La novela se quito de la lista.');
          this.load(list.id);
        },
        error: () => {
          this.error.set('No se pudo quitar la novela de la lista.');
        },
      });
  }

  private load(id: string) {
    this.readingListsService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((list) => this.list.set(list));
  }
}
