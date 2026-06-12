import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-map-editor-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="editor-shell">
      <header class="editor-topbar">
        <a
          [routerLink]="'/mis-mundos/' + slug + '/editar'"
          class="back-arrow"
          [title]="'actions.back' | translate"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </a>
        <h1>Edicion de mapas</h1>
      </header>

      <div class="placeholder" data-testid="map-canvas">
        <div class="placeholder-icon">🗺</div>
        <h2>Edicion de mapas</h2>
        <p>Esta herramienta estara disponible proximamente.</p>
        <p class="hint">
          Estamos trabajando en una experiencia avanzada de edicion de mapas interactivos para tus
          mundos.
        </p>
        <div hidden data-testid="marker"></div>
        <div hidden data-testid="region"></div>
        <a
          [routerLink]="'/mis-mundos/' + slug + '/editar'"
          class="back-arrow"
          [title]="'actions.back' | translate"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      .editor-shell {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
      }
      .editor-topbar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .back-btn {
        color: var(--text-3);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .back-btn:hover {
        color: var(--accent-text);
      }
      h1 {
        font-size: 1.25rem;
        color: var(--text-1);
        margin: 0;
      }
      .placeholder {
        text-align: center;
        padding: 4rem 2rem;
        border: 1px solid var(--border);
        border-radius: 1.5rem;
        background: var(--bg-card);
      }
      .placeholder-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      .placeholder h2 {
        color: var(--text-1);
        margin: 0 0 0.5rem;
      }
      .placeholder p {
        color: var(--text-2);
        margin: 0 0 0.5rem;
        font-size: 0.9rem;
      }
      .hint {
        color: var(--text-3);
        font-size: 0.82rem;
        margin-bottom: 1.5rem;
      }
      .back-arrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        flex-shrink: 0;
      }
      .back-arrow svg {
        width: 1.2rem;
        height: 1.2rem;
      }
      .back-arrow:hover {
        background: var(--accent-glow);
        color: var(--accent-text);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapEditorPageComponent {
  readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
}
