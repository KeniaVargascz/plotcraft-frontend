import { ChangeDetectionStrategy, Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-wb-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-wrapper">
      <span class="search-icon">&#128269;</span>
      <input
        type="text"
        [placeholder]="placeholder()"
        [(ngModel)]="query"
        (ngModelChange)="onInput($event)"
      />
      @if (query) {
        <button type="button" class="clear-btn" (click)="clear()">&#10005;</button>
      }
    </div>
  `,
  styles: [
    `
      .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 0.75rem;
        font-size: 0.85rem;
        opacity: 0.5;
        pointer-events: none;
      }
      input {
        width: 100%;
        padding: 0.7rem 2.2rem 0.7rem 2.2rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        font-size: 0.85rem;
      }
      input::placeholder {
        color: var(--text-3);
      }
      input:focus {
        outline: 1px solid var(--accent-glow);
      }
      .clear-btn {
        position: absolute;
        right: 0.5rem;
        background: none;
        border: none;
        color: var(--text-3);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WbSearchBarComponent implements OnInit, OnDestroy {
  readonly placeholder = input('Buscar entradas...');
  readonly searchQuery = output<string>();

  query = '';
  private readonly input$ = new Subject<string>();
  private sub: Subscription | null = null;

  ngOnInit() {
    this.sub = this.input$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value) => {
      if (value.length >= 2 || value.length === 0) {
        this.searchQuery.emit(value);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onInput(value: string) {
    this.input$.next(value);
  }

  clear() {
    this.query = '';
    this.input$.next('');
  }
}
