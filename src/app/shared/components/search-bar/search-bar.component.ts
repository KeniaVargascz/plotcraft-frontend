import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SearchService } from '../../../core/services/search.service';
import { SearchHistoryItem, SearchSuggestion } from '../../../core/models/search.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="search-shell" [class.compact]="compact()" #root data-testid="searchbar">
      <label class="search-input">
        <span class="icon">⌕</span>
        <input
          #searchInput
          type="search"
          [placeholder]="
            compact() ? ('search.placeholderShort' | translate) : ('search.placeholder' | translate)
          "
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (focus)="handleFocus()"
          (keydown.enter)="submit()"
        />
      </label>

      @if (open()) {
        <div class="dropdown" data-testid="suggestions-dropdown">
          @if (loading()) {
            <div class="dropdown-block muted">{{ 'search.loading' | translate }}</div>
          } @else if (!query.trim() && history().length) {
            <div class="dropdown-head">
              <span>{{ 'search.history' | translate }}</span>
              <button type="button" (click)="clearHistory()">
                {{ 'search.clearHistory' | translate }}
              </button>
            </div>
            <div class="dropdown-list">
              @for (item of history(); track item.id) {
                <button type="button" class="dropdown-item" (click)="applyHistory(item.query)">
                  <div>
                    <strong>{{ item.query }}</strong>
                  </div>
                  <span class="item-action" (click)="removeHistoryItem(item.id, $event)">×</span>
                </button>
              }
            </div>
          } @else if (suggestions().length) {
            <div class="dropdown-head">
              <span>{{ 'search.suggestions' | translate }}</span>
            </div>
            <div class="dropdown-list">
              @for (item of suggestions(); track item.url) {
                <a
                  class="dropdown-item"
                  data-testid="suggestion-item"
                  [routerLink]="item.url"
                  (click)="goToSuggestion(item, $event)"
                >
                  <div class="avatar">{{ item.label.charAt(0) }}</div>
                  <div class="item-copy">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.sublabel }}</span>
                  </div>
                  <span class="item-type">{{ item.type }}</span>
                </a>
              }
            </div>
          } @else if (query.trim().length >= 2) {
            <div class="dropdown-block muted">
              {{ 'search.noResults' | translate: { query: query.trim() } }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .search-shell {
        position: relative;
        width: 100%;
      }
      .search-input {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.8rem;
        min-height: calc(3.25rem - 1px);
        border-radius: 999px;
        border: 1px solid var(--border);
        background: color-mix(in srgb, var(--bg-card) 82%, transparent);
        padding: 0.4rem 0.8rem 0.4rem 1rem;
      }
      .search-input input {
        border: none;
        background: transparent;
        color: var(--text-1);
        outline: none;
        box-shadow: none;
        font: inherit;
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
      }
      .search-input input:focus {
        outline: none;
        box-shadow: none;
        border: none;
      }
      .search-input:focus-within {
        outline: none;
        box-shadow: none;
      }
      .icon,
      .shortcut,
      .item-type,
      .muted {
        color: var(--text-3);
      }
      .compact .shortcut {
        display: none;
      }
      .dropdown {
        position: absolute;
        top: calc(100% + 0.6rem);
        left: 0;
        right: 0;
        z-index: var(--z-dropdown);
        border-radius: 1.1rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        box-shadow: var(--shadow-overlay);
        overflow: hidden;
      }
      .dropdown-head,
      .dropdown-block {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.9rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .dropdown-head button {
        border: none;
        background: transparent;
        color: var(--accent-text);
        cursor: pointer;
      }
      .dropdown-list {
        display: grid;
      }
      .dropdown-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.8rem;
        text-align: left;
        padding: 0.9rem 1rem;
        border: none;
        border-bottom: 1px solid var(--border);
        background: transparent;
        color: var(--text-1);
        cursor: pointer;
        text-decoration: none;
      }
      .dropdown-item:last-child {
        border-bottom: none;
      }
      .dropdown-item:hover {
        background: color-mix(in srgb, var(--accent-glow) 72%, transparent);
      }
      .avatar {
        width: 2.3rem;
        height: 2.3rem;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--accent-glow);
        color: var(--accent-text);
        font-weight: 700;
      }
      .item-copy {
        display: grid;
        gap: 0.15rem;
      }
      .item-copy span {
        color: var(--text-2);
        font-size: 0.92rem;
      }
      .item-action {
        font-size: 1.15rem;
        line-height: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly searchService = inject(SearchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly compact = input(false);

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('root') private root?: ElementRef<HTMLDivElement>;

  readonly loading = signal(false);
  readonly suggestions = signal<SearchSuggestion[]>([]);
  readonly history = signal<SearchHistoryItem[]>([]);
  readonly open = signal(false);
  readonly canShowHistory = computed(
    () => this.authService.isAuthenticated() && !this.query.trim().length,
  );

  query = '';
  private readonly searchChanges = new Subject<string>();

  constructor() {
    this.searchChanges
      .pipe(
        debounceTime(180),
        distinctUntilChanged(),
        switchMap((value) => {
          if (value.trim().length < 2) {
            this.loading.set(false);
            this.suggestions.set([]);
            return of(null);
          }

          this.loading.set(true);
          return this.searchService
            .getSuggestions(value)
            .pipe(catchError(() => of({ suggestions: [] })));
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.suggestions.set(response.suggestions);
        this.loading.set(false);
        this.open.set(true);
      });
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
      this.open.set(true);
      this.handleFocus();
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (!this.root?.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  onQueryChange(value: string) {
    this.query = value;
    this.searchChanges.next(value);
    if (!value.trim().length) {
      this.suggestions.set([]);
      this.handleFocus();
    }
  }

  handleFocus() {
    this.open.set(true);
    if (this.canShowHistory()) {
      this.searchService
        .getHistory()
        .pipe(catchError(() => of({ history: [] })))
        .subscribe((response) => this.history.set(response.history));
    }
  }

  submit() {
    const nextQuery = this.query.trim();
    if (!nextQuery) {
      return;
    }

    this.open.set(false);
    void this.router.navigate(['/buscar'], {
      queryParams: {
        q: nextQuery,
      },
    });
  }

  goToSuggestion(item: SearchSuggestion, event: Event) {
    event.preventDefault();
    this.open.set(false);
    void this.router.navigateByUrl(item.url);
  }

  applyHistory(query: string) {
    this.query = query;
    this.submit();
  }

  clearHistory() {
    this.searchService.clearHistory().subscribe({
      next: () => this.history.set([]),
      error: () => undefined,
    });
  }

  removeHistoryItem(id: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.searchService.deleteHistoryItem(id).subscribe({
      next: () => this.history.update((items) => items.filter((item) => item.id !== id)),
      error: () => undefined,
    });
  }
}
