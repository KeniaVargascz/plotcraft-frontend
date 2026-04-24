import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CharactersService } from '../../core/services/characters.service';
import { CharacterSummary } from '../../core/models/character.model';
import { CharacterCardComponent } from './components/character-card.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-characters-catalog-page',
  standalone: true,
  imports: [FormsModule, CharacterCardComponent, PaginatorComponent],
  template: `
    <section class="catalog-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Elenco narrativo</p>
          <h1>Personajes</h1>
          <p class="lede">
            Explora protagonistas, antagonistas y redes de relaciones entre historias.
          </p>
        </div>
        <label class="search">
          <span>Buscar</span>
          <input
            [(ngModel)]="search"
            (ngModelChange)="load()"
            placeholder="Busca por nombre, rol o rasgo"
          />
        </label>
      </header>

      @if (loading()) {
        <p class="state">Cargando personajes...</p>
      } @else if (!characters().length) {
        <p class="state">Aun no hay personajes publicos para mostrar.</p>
      } @else {
        <section class="grid">
          @for (character of characters(); track character.id) {
            <app-character-card [character]="character" />
          }
        </section>

        @if (totalPages() > 1) {
          <app-paginator
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="goToPage($event)"
          />
        }
      }
    </section>
  `,
  styles: [
    `
      .catalog-shell,
      .hero {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.35rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero {
        grid-template-columns: 1.2fr 0.8fr;
        align-items: end;
      }
      .eyebrow,
      .lede,
      .search span,
      .state {
        color: var(--text-2);
      }
      .search {
        display: grid;
        gap: 0.5rem;
      }
      input {
        padding: 0.9rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 1000px) {
        .hero,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharactersCatalogPageComponent {
  private readonly charactersService = inject(CharactersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly characters = signal<CharacterSummary[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  search = '';

  constructor() {
    this.load();
  }

  load() {
    this.currentPage.set(1);
    this.fetchPage();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.fetchPage();
  }

  private fetchPage() {
    this.loading.set(true);
    this.charactersService
      .listPublic({
        page: this.currentPage(),
        limit: 12,
        search: this.search || null,
        sort: 'updated',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.characters.set(response.data);
          this.totalPages.set(response.pagination.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.characters.set([]);
          this.loading.set(false);
        },
      });
  }
}
