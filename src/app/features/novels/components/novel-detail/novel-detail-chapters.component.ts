import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelChapterSummary } from '../../../../core/models/novel.model';

@Component({
  selector: 'app-novel-detail-chapters',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chapter-list card">
      <h2>Capitulos</h2>
      @for (chapter of chapters(); track chapter.id) {
        <a class="chapter-item" [routerLink]="['/novelas', novelSlug(), chapter.slug]">
          <span>{{ chapter.order }}. {{ chapter.title }}</span>
          <small>{{ chapter.wordCount }} palabras</small>
        </a>
      }
    </div>
  `,
  styles: [
    `
      .chapter-list {
        display: grid;
        gap: 1rem;
        align-content: start;
      }
      .card {
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        padding: 1.25rem;
      }
      .chapter-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        text-decoration: none;
        color: var(--text-1);
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--border);
      }
    `,
  ],
})
export class NovelDetailChaptersComponent {
  readonly chapters = input.required<NovelChapterSummary[]>();
  readonly novelSlug = input.required<string>();

  readonly navigateToChapter = output<string>();
}
