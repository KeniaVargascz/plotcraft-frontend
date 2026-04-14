import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  template: `
    <nav class="paginator" [attr.aria-label]="'Paginacion'">
      <button
        type="button"
        class="page-btn"
        [disabled]="currentPage() <= 1"
        (click)="goTo(currentPage() - 1)"
      >
        &lsaquo;
      </button>

      @for (p of visiblePages(); track p) {
        @if (p === -1) {
          <span class="ellipsis">&hellip;</span>
        } @else {
          <button
            type="button"
            class="page-btn"
            [class.active]="p === currentPage()"
            (click)="goTo(p)"
          >
            {{ p }}
          </button>
        }
      }

      <button
        type="button"
        class="page-btn"
        [disabled]="currentPage() >= totalPages()"
        (click)="goTo(currentPage() + 1)"
      >
        &rsaquo;
      </button>
    </nav>
  `,
  styles: [
    `
      .paginator {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
        padding: 0.5rem 0;
      }
      .page-btn {
        min-width: 2.5rem;
        height: 2.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        padding: 0 0.5rem;
      }
      .page-btn:hover:not(:disabled):not(.active) {
        background: var(--bg-surface);
      }
      .page-btn.active {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
        font-weight: 600;
      }
      .page-btn:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .ellipsis {
        min-width: 2rem;
        text-align: center;
        color: var(--text-3);
        font-size: 1rem;
      }
      @media (max-width: 480px) {
        .page-btn {
          min-width: 2.2rem;
          height: 2.2rem;
          font-size: 0.82rem;
        }
      }
    `,
  ],
})
export class PaginatorComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push(-1); // ellipsis
    }

    pages.push(total);
    return pages;
  });

  goTo(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
