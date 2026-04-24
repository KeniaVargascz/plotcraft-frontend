import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SERIES_STATUS_LABELS, SERIES_TYPE_LABELS, SeriesDetail } from './models/series.model';
import { SeriesService } from './services/series.service';

@Component({
  selector: 'app-series-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (error()) {
      <app-error-message />
    } @else if (series(); as s) {
      <section class="shell">
        <header class="hero">
          <div class="cover">
            @if (s.coverUrl) {
              <img [src]="s.coverUrl" [alt]="s.title" loading="lazy" />
            } @else {
              <span>{{ s.title.charAt(0) }}</span>
            }
          </div>
          <div class="meta">
            <div class="badges">
              <span class="type-badge">{{ typeLabel() }}</span>
              <span class="status-badge" [class]="statusClass()">{{ statusLabel() }}</span>
              @if (s.status === 'COMPLETED') {
                <span class="complete-badge">Serie completa</span>
              }
            </div>
            <h1>{{ s.title }}</h1>
            <p class="author">
              por
              <a [routerLink]="['/perfil', s.author.username]">{{ s.author.displayName }}</a>
            </p>
            @if (s.description) {
              <p class="desc">{{ s.description }}</p>
            }
            <p class="date">Actualizada {{ s.updatedAt | date: 'longDate' }}</p>
            @if (isAuthor()) {
              <a class="manage-btn" [routerLink]="['/mis-sagas', s.slug, 'editar']">
                Gestionar serie
              </a>
            }
          </div>
        </header>

        <section class="novels-section">
          <h2>Novelas ({{ s.novels.length }})</h2>
          @if (!s.novels.length) {
            <p class="empty">Esta serie aún no tiene novelas.</p>
          } @else {
            <ol class="novels-list">
              @for (n of s.novels; track n.id) {
                <li class="novel-item">
                  <span class="order-label">Libro {{ n.orderIndex }}</span>
                  <div class="novel-cover">
                    @if (n.coverUrl) {
                      <img [src]="n.coverUrl" [alt]="n.title" loading="lazy" />
                    } @else {
                      <span>{{ n.title.charAt(0) }}</span>
                    }
                  </div>
                  <div class="novel-info">
                    <a class="novel-title" [routerLink]="['/novelas', n.slug]">{{ n.title }}</a>
                    <span class="novel-meta">
                      {{ n.status }} · {{ n.chaptersCount }} capítulos ·
                      {{ n.totalWordsCount }} palabras
                    </span>
                  </div>
                </li>
              }
            </ol>
          }
        </section>
      </section>
    }
  `,
  styles: [
    `
      .shell {
        display: grid;
        gap: 1.5rem;
      }
      .hero {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1.25rem;
      }
      .cover {
        border-radius: 1.25rem;
        overflow: hidden;
        background: var(--bg-card);
        border: 1px solid var(--border);
        min-height: 300px;
        display: grid;
        place-items: center;
        font-size: 4rem;
      }
      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .meta {
        display: grid;
        gap: 0.75rem;
        align-content: start;
      }
      .badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .type-badge,
      .status-badge,
      .complete-badge {
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .type-badge {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .status-in-progress {
        background: rgba(91, 175, 214, 0.15);
        color: #77c4ea;
      }
      .status-completed {
        background: rgba(77, 184, 138, 0.15);
        color: #63d4a2;
      }
      .status-abandoned {
        background: rgba(214, 120, 120, 0.15);
        color: #e49d9d;
      }
      .status-hiatus {
        background: rgba(176, 138, 82, 0.15);
        color: #d4ac6b;
      }
      .complete-badge {
        background: rgba(77, 184, 138, 0.25);
        color: #63d4a2;
      }
      h1 {
        margin: 0;
        font:
          700 2rem/1.2 'Playfair Display',
          serif;
      }
      .author {
        margin: 0;
        color: var(--text-2);
      }
      .desc {
        color: var(--text-2);
        white-space: pre-wrap;
      }
      .date {
        color: var(--text-3);
        font-size: 0.82rem;
      }
      .manage-btn {
        width: fit-content;
        padding: 0.6rem 1.1rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        text-decoration: none;
        font-weight: 600;
      }
      .novels-section {
        display: grid;
        gap: 0.85rem;
      }
      .novels-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }
      .novel-item {
        display: grid;
        grid-template-columns: auto 80px 1fr;
        gap: 1rem;
        align-items: center;
        padding: 0.85rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .order-label {
        font-weight: 700;
        color: var(--accent-text);
      }
      .novel-cover {
        width: 80px;
        height: 110px;
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--bg-surface);
        display: grid;
        place-items: center;
        font-size: 1.5rem;
      }
      .novel-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .novel-info {
        display: grid;
        gap: 0.3rem;
      }
      .novel-title {
        color: var(--text-1);
        text-decoration: none;
        font-weight: 700;
      }
      .novel-meta {
        color: var(--text-3);
        font-size: 0.8rem;
      }
      @media (max-width: 800px) {
        .hero {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seriesService = inject(SeriesService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly series = signal<SeriesDetail | null>(null);

  readonly typeLabel = computed(() =>
    this.series() ? SERIES_TYPE_LABELS[this.series()!.type] : '',
  );
  readonly statusLabel = computed(() =>
    this.series() ? SERIES_STATUS_LABELS[this.series()!.status] : '',
  );
  readonly statusClass = computed(() =>
    this.series() ? `status-${this.series()!.status.toLowerCase().replace(/_/g, '-')}` : '',
  );
  readonly isAuthor = computed(() => {
    const s = this.series();
    const user = this.authService.getCurrentUserSnapshot();
    return !!s && !!user && s.author.username === user.username;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.error.set(false);
      this.seriesService.getBySlug(slug).subscribe({
        next: (s) => {
          this.series.set(s);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
    });
  }
}
