import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-map-editor-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="editor-shell">
      <header class="editor-topbar">
        <a [routerLink]="'/mis-mundos/' + slug + '/editar'" class="back-btn">\u2190 Volver</a>
        <h1>Edicion de mapas</h1>
      </header>

      <div class="placeholder" data-testid="map-canvas">
        <div class="placeholder-icon">\u{1F5FA}</div>
        <h2>Edicion de mapas</h2>
        <p>Esta herramienta estara disponible proximamente.</p>
        <p class="hint">Estamos trabajando en una experiencia avanzada de edicion de mapas interactivos para tus mundos.</p>
        <div hidden data-testid="marker"></div>
        <div hidden data-testid="region"></div>
        <a [routerLink]="'/mis-mundos/' + slug + '/editar'" class="back-link">Volver al editor del mundo</a>
      </div>
    </section>
  `,
  styles: [`
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
    .back-btn:hover { color: var(--accent-text); }
    h1 {
      font-size: 1.25rem;
      color: var(--text-1);
      margin: 0;
    }
    .placeholder {
      text-align: center;
      padding: 4rem 2rem;
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      background: var(--bg-card);
    }
    .placeholder-icon { font-size: 4rem; margin-bottom: 1rem; }
    .placeholder h2 { color: var(--text-1); margin: 0 0 0.5rem; }
    .placeholder p { color: var(--text-2); margin: 0 0 0.5rem; font-size: 0.9rem; }
    .hint { color: var(--text-3); font-size: 0.82rem; margin-bottom: 1.5rem; }
    .back-link {
      display: inline-block;
      padding: 0.6rem 1.25rem;
      border-radius: 0.75rem;
      background: var(--accent-glow);
      color: var(--accent-text);
      text-decoration: none;
      font-size: 0.85rem;
    }
    .back-link:hover { background: var(--accent); color: #fff; }
  `],
})
export class MapEditorPageComponent {
  readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
}
