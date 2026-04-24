import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubscribedNovel, SubscriptionsService } from '../../core/services/subscriptions.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-my-subscriptions-page',
  standalone: true,
  imports: [RouterLink, DatePipe, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <header>
        <h1>Mis suscripciones</h1>
        <p>Novelas de las que recibirás notificaciones al publicarse capítulos nuevos.</p>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <app-error-message />
      } @else if (!items().length) {
        <div class="empty">
          <p>Aún no sigues ninguna novela.</p>
          <a routerLink="/novelas">Explorar novelas</a>
        </div>
      } @else {
        <ul class="list">
          @for (n of items(); track n.id) {
            <li class="row">
              <div class="cover">
                @if (n.coverUrl) {
                  <img [src]="n.coverUrl" [alt]="n.title" loading="lazy" />
                } @else {
                  <span>{{ n.title.charAt(0) }}</span>
                }
              </div>
              <div class="info">
                <a class="title" [routerLink]="['/novelas', n.slug]">{{ n.title }}</a>
                <a class="author" [routerLink]="['/perfil', n.author.username]">
                  por {{ n.author.displayName }}
                </a>
                @if (n.latestChapter) {
                  <span class="latest">
                    Último: {{ n.latestChapter.title }} ·
                    {{ n.latestChapter.publishedAt | date: 'shortDate' }}
                  </span>
                }
              </div>
              <button type="button" (click)="unsubscribe(n)">Desuscribirse</button>
            </li>
          }
        </ul>

        @if (hasMore()) {
          <button type="button" class="load-more" (click)="loadMore()">Cargar más</button>
        }
      }
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.25rem;
      }
      header h1 {
        margin: 0 0 0.25rem;
      }
      header p {
        margin: 0;
        color: var(--text-2);
      }
      .list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.75rem;
      }
      .row {
        display: grid;
        grid-template-columns: 72px 1fr auto;
        gap: 1rem;
        align-items: center;
        padding: 0.9rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .cover {
        width: 72px;
        height: 96px;
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--bg-surface);
        display: grid;
        place-items: center;
        font-size: 1.5rem;
      }
      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .info {
        display: grid;
        gap: 0.3rem;
      }
      .title {
        color: var(--text-1);
        text-decoration: none;
        font-weight: 700;
      }
      .author,
      .latest {
        color: var(--text-3);
        font-size: 0.8rem;
        text-decoration: none;
      }
      button {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        cursor: pointer;
      }
      .empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-2);
      }
      .empty a {
        display: inline-block;
        margin-top: 0.5rem;
        color: var(--accent-text);
      }
      .load-more {
        margin: 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySubscriptionsPageComponent implements OnInit {
  private readonly subsService = inject(SubscriptionsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly items = signal<SubscribedNovel[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly hasMore = signal(false);

  ngOnInit(): void {
    this.load(true);
  }

  loadMore(): void {
    this.load(false);
  }

  private load(reset: boolean): void {
    this.loading.set(reset);
    this.error.set(false);
    this.subsService.getMySubscriptions(reset ? null : this.nextCursor()).subscribe({
      next: (res) => {
        this.items.set(reset ? res.data : [...this.items(), ...res.data]);
        this.nextCursor.set(res.pagination.nextCursor);
        this.hasMore.set(res.pagination.hasMore);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  unsubscribe(novel: SubscribedNovel): void {
    this.subsService.unsubscribe(novel.slug).subscribe({
      next: () => this.items.update((list) => list.filter((n) => n.id !== novel.id)),
    });
  }
}
