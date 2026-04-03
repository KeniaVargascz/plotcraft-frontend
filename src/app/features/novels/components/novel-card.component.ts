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
        <div class="meta-stack">
          <div class="chips chips-status">
            <span class="chip">{{ novel().status }}</span>
          </div>
          <div class="chips chips-rating">
            <span class="chip">{{ novel().rating }}</span>
          </div>
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
      :host {
        display: block;
        height: 100%;
      }

      .novel-card {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 1rem;
        padding: 1rem;
        border-radius: 1.25rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        align-items: start;
        height: 100%;
      }

      .cover {
        min-height: 0;
        aspect-ratio: 3 / 4;
        align-self: start;
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
        grid-template-rows: auto auto auto minmax(0, 1fr) auto auto;
        gap: 0.6rem;
        min-width: 0;
        height: 100%;
      }

      .meta-stack {
        display: grid;
        grid-template-rows: repeat(2, minmax(1.72rem, auto));
        gap: 0.35rem;
        min-height: calc(1.72rem * 2 + 0.35rem);
      }

      .chips,
      .genres,
      footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .chips {
        align-content: start;
        min-height: 1.72rem;
      }

      .chips-status,
      .chips-rating {
        min-height: 1.72rem;
      }

      .genres {
        align-content: start;
        min-height: calc(1.72rem * 2 + 0.5rem);
        max-height: calc(1.72rem * 2 + 0.5rem);
        overflow: hidden;
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

      .chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 4.75rem;
        min-height: 1.72rem;
        text-align: center;
        white-space: nowrap;
      }

      .title {
        font:
          700 1.12rem/1.22 'Playfair Display',
          serif;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: calc(1.22em * 2);
        max-height: calc(1.22em * 2);
        color: var(--text-1);
        text-decoration: none;
        overflow-wrap: anywhere;
      }

      .author,
      .synopsis {
        margin: 0;
        color: var(--text-2);
      }

      .author {
        font-size: 0.94rem;
        min-height: 1.2rem;
      }

      .synopsis {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.45;
        min-height: calc(1.45em * 2);
      }

      footer {
        padding-top: 0.15rem;
        border-top: 1px solid var(--border);
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
