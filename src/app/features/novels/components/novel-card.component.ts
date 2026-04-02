import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelSummary } from '../../../core/models/novel.model';

@Component({
  selector: 'app-novel-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <article class="novel-card">
      <a class="cover" [routerLink]="['/novelas', novel().slug]">
        <span>{{ novel().title.charAt(0) }}</span>
      </a>

      <div class="body">
        <div class="chips">
          <span class="chip">{{ novel().status }}</span>
          <span class="chip">{{ novel().rating }}</span>
        </div>

        <a class="title" [routerLink]="['/novelas', novel().slug]">{{ novel().title }}</a>
        <p class="author">
          por
          <a [routerLink]="['/perfil', novel().author.username]">@{{ novel().author.username }}</a>
        </p>
        <p class="synopsis">{{ novel().synopsis || 'Sin sinopsis.' }}</p>

        <div class="genres">
          @for (genre of novel().genres; track genre.id) {
            <span>{{ genre.label }}</span>
          }
        </div>

        <footer>
          <span>{{ novel().stats.publishedChaptersCount }} caps</span>
          <span>{{ novel().stats.likesCount }} likes</span>
          <span>{{ novel().viewsCount }} vistas</span>
          <span>{{ novel().updatedAt | date: 'shortDate' }}</span>
        </footer>
      </div>
    </article>
  `,
  styles: [
    `
      .novel-card {
        display: grid;
        grid-template-columns: 112px 1fr;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
      }

      .cover {
        min-height: 156px;
        border-radius: 1rem;
        background:
          linear-gradient(160deg, rgba(205, 153, 73, 0.35), transparent 60%),
          linear-gradient(220deg, rgba(37, 58, 82, 0.8), rgba(12, 16, 22, 0.95));
        display: grid;
        place-items: center;
        color: var(--accent-text);
        font-size: 2rem;
        text-decoration: none;
      }

      .body {
        display: grid;
        gap: 0.7rem;
        min-width: 0;
      }

      .chips,
      .genres,
      footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .chip,
      .genres span,
      footer span {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-size: 0.82rem;
      }

      .title {
        font:
          700 1.2rem/1.2 'Playfair Display',
          serif;
        color: var(--text-1);
        text-decoration: none;
      }

      .author,
      .synopsis {
        margin: 0;
        color: var(--text-2);
      }

      .synopsis {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      a {
        color: inherit;
      }

      @media (max-width: 700px) {
        .novel-card {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NovelCardComponent {
  readonly novel = input.required<NovelSummary>();
}
