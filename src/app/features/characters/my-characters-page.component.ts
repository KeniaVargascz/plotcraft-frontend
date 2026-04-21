import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CharacterSummary } from '../../core/models/character.model';
import { AuthService } from '../../core/services/auth.service';
import { CharactersService } from '../../core/services/characters.service';
import { CharacterCardComponent } from './components/character-card.component';

@Component({
  selector: 'app-my-characters-page',
  standalone: true,
  imports: [RouterLink, CharacterCardComponent],
  template: `
    <section class="page-shell">
      <header class="hero card">
        <div>
          <p class="eyebrow">Autor</p>
          <h1>Mis personajes</h1>
          <p class="lede">
            Construye fichas, arcos y conexiones entre protagonistas y secundarios.
          </p>
        </div>
        <a class="cta" routerLink="/mis-personajes/nuevo">Nuevo personaje</a>
      </header>

      @if (loading()) {
        <p class="state">Cargando personajes...</p>
      } @else if (!characters().length) {
        <section class="card">
          <h2>Aun no has creado personajes</h2>
          <p class="state">Empieza con una ficha base y luego agrega relaciones.</p>
        </section>
      } @else {
        <section class="grid">
          @for (character of characters(); track character.id) {
            <article class="stack">
              <app-character-card [character]="character" />
              <div class="actions">
                <a [routerLink]="['/mis-personajes', character.slug, 'editar']">Editar</a>
                <button
                  type="button"
                  [disabled]="removing() === character.slug"
                  (click)="remove(character.slug)"
                >
                  {{ removing() === character.slug ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .page-shell,
      .stack {
        display: grid;
        gap: 1rem;
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero,
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .cta,
      .actions a,
      .actions button {
        padding: 0.8rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        text-decoration: none;
        background: var(--accent-glow);
        color: var(--accent-text);
      }
      .eyebrow,
      .lede,
      .state {
        color: var(--text-2);
      }
      @media (max-width: 960px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MyCharactersPageComponent {
  private readonly charactersService = inject(CharactersService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly characters = signal<CharacterSummary[]>([]);
  readonly loading = signal(true);
  readonly removing = signal<string | null>(null);

  constructor() {
    this.load();
  }

  remove(slug: string) {
    const username = this.authService.getCurrentUserSnapshot()?.username;
    if (!username || this.removing()) return;
    this.removing.set(slug);
    this.charactersService
      .remove(username, slug)
      .pipe(finalize(() => this.removing.set(null)))
      .subscribe({
        next: () => this.load(),
      });
  }

  private load() {
    this.loading.set(true);
    this.charactersService
      .listMine({ limit: 40, sort: 'updated' })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.characters.set(response.data),
        error: () => this.characters.set([]),
      });
  }
}
