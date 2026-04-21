import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChapterDetail } from '../../../../core/models/chapter.model';

@Component({
  selector: 'app-reader-chapter-nav',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="reader-nav">
      @if (currentChapter().navigation?.previous; as previous) {
        <a
          [routerLink]="['/novelas', currentChapter().novel.slug, previous.slug]"
          data-testid="prev-chapter"
          >&larr; {{ previous.title }}</a
        >
      }
      @if (currentChapter().navigation?.next; as next) {
        <a
          [routerLink]="['/novelas', currentChapter().novel.slug, next.slug]"
          data-testid="next-chapter"
          >{{ next.title }} &rarr;</a
        >
      }
    </footer>
  `,
  styles: [
    `
      .reader-nav {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      a {
        color: var(--accent-text);
      }
    `,
  ],
})
export class ReaderChapterNavComponent {
  readonly currentChapter = input.required<ChapterDetail>();
}
