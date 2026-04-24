import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WbEntryDetail } from '../../../core/models/wb-entry.model';
import { FieldDefinition, FieldValue } from '../../../core/models/field-definition.model';
import { WorldbuildingService } from '../../../core/services/worldbuilding.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { WbEntryLinksComponent } from './components/wb-entry-links.component';
import { WbLinkGraphComponent } from './components/wb-link-graph.component';

@Component({
  selector: 'app-wb-entry-detail-page',
  standalone: true,
  imports: [RouterLink, WbEntryLinksComponent, WbLinkGraphComponent],
  template: `
    @if (loading()) {
      <p class="state">Cargando entrada...</p>
    } @else if (entry()) {
      <section class="detail-shell">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a [routerLink]="['/mundos', entry()!.world.slug]">{{ entry()!.world.name }}</a>
          <span class="sep">/</span>
          <a [routerLink]="['/mundos', entry()!.world.slug, 'lore']">Lore</a>
          <span class="sep">/</span>
          <span>{{ entry()!.name }}</span>
        </nav>

        <!-- Hero -->
        <header class="hero card">
          @if (entry()!.coverUrl) {
            <div
              class="hero-cover"
              [style.backgroundImage]="'url(' + entry()!.coverUrl + ')'"
            ></div>
          }
          <div class="hero-body">
            <div class="hero-meta">
              <span
                class="cat-badge"
                [style.background]="(entry()!.category.color || '#6366f1') + '22'"
                [style.color]="entry()!.category.color || '#6366f1'"
              >
                {{ entry()!.category.icon }} {{ entry()!.category.name }}
              </span>
              @if (!entry()!.isPublic) {
                <span class="private-badge">Privado</span>
              }
            </div>
            <h1>{{ entry()!.name }}</h1>
            @if (entry()!.summary) {
              <p class="summary">{{ entry()!.summary }}</p>
            }
            @if (entry()!.tags.length) {
              <div class="tags-row">
                @for (tag of entry()!.tags; track tag) {
                  <span class="tag-chip">{{ tag }}</span>
                }
              </div>
            }
            <p class="author-line">
              por
              <a [routerLink]="['/perfil', entry()!.author.username]">{{
                entry()!.author.displayName
              }}</a>
            </p>
          </div>
        </header>

        <div class="content-grid">
          <!-- Main content -->
          <article class="card main-content">
            @if (entry()!.fields && fieldEntries().length) {
              <section class="fields-section">
                <h2>Detalles</h2>
                <div class="fields-grid">
                  @for (fe of fieldEntries(); track fe.key) {
                    <div class="field-pair">
                      <span class="field-label">{{ fe.label }}</span>
                      <span class="field-value">{{ formatFieldValue(fe.value) }}</span>
                    </div>
                  }
                </div>
              </section>
            }

            @if (entry()!.content) {
              <section class="prose">
                <h2>Contenido</h2>
                <div [innerHTML]="markdownService.render(entry()!.content!)"></div>
              </section>
            }
          </article>

          <!-- Sidebar -->
          <aside class="side-col">
            @if (entry()!.links.length) {
              <div class="card">
                <h3>Grafo de relaciones</h3>
                <app-wb-link-graph
                  [centralEntry]="{ name: entry()!.name, slug: entry()!.slug }"
                  [links]="entry()!.links"
                  [worldSlug]="entry()!.world.slug"
                />
              </div>
              <div class="card">
                <app-wb-entry-links
                  [links]="entry()!.links"
                  [isOwner]="entry()!.viewerContext?.isOwner || false"
                />
              </div>
            }

            @if (entry()!.viewerContext?.isOwner) {
              <div class="card owner-actions">
                <a
                  class="action-btn primary"
                  [routerLink]="[
                    '/mis-mundos',
                    entry()!.world.slug,
                    'world-building',
                    entry()!.category.slug,
                    entry()!.slug,
                    'editar',
                  ]"
                >
                  Editar entrada
                </a>
              </div>
            }
          </aside>
        </div>
      </section>
    } @else {
      <p class="state">No se pudo cargar la entrada.</p>
    }
  `,
  styles: [
    `
      .detail-shell {
        display: grid;
        gap: 1rem;
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        color: var(--text-3);
      }
      .breadcrumb a {
        color: var(--text-2);
        text-decoration: none;
      }
      .breadcrumb a:hover {
        color: var(--accent-text);
      }
      .sep {
        color: var(--text-3);
      }
      .card {
        padding: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .hero {
        overflow: hidden;
        padding: 0;
      }
      .hero-cover {
        height: 12rem;
        background-size: cover;
        background-position: center;
      }
      .hero-body {
        padding: 1.25rem;
        display: grid;
        gap: 0.5rem;
      }
      .hero-meta {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .cat-badge {
        padding: 0.22rem 0.65rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .private-badge {
        padding: 0.22rem 0.65rem;
        border-radius: 999px;
        background: var(--bg-surface);
        color: var(--text-3);
        font-size: 0.75rem;
      }
      h1 {
        margin: 0;
        font-size: 1.6rem;
        color: var(--text-1);
      }
      .summary {
        color: var(--text-2);
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .tags-row {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
      }
      .tag-chip {
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        font-size: 0.72rem;
        color: var(--text-2);
      }
      .author-line {
        color: var(--text-3);
        font-size: 0.82rem;
        margin: 0;
      }
      .author-line a {
        color: var(--accent-text);
        text-decoration: none;
      }
      .content-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 1rem;
      }
      .main-content {
        display: grid;
        gap: 1.5rem;
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
        color: var(--text-1);
      }
      h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: var(--text-1);
      }
      .fields-grid {
        display: grid;
        gap: 0.5rem;
      }
      .field-pair {
        display: grid;
        grid-template-columns: 0.4fr 0.6fr;
        gap: 0.5rem;
        padding: 0.55rem 0;
        border-bottom: 1px solid var(--border);
      }
      .field-label {
        font-size: 0.82rem;
        color: var(--text-3);
        font-weight: 500;
      }
      .field-value {
        font-size: 0.85rem;
        color: var(--text-1);
      }
      .prose {
        line-height: 1.7;
        color: var(--text-1);
        font-size: 0.9rem;
      }
      .side-col {
        display: grid;
        gap: 1rem;
        align-content: start;
      }
      .owner-actions {
        display: grid;
        gap: 0.5rem;
      }
      .action-btn {
        display: block;
        text-align: center;
        padding: 0.7rem 1rem;
        border-radius: 1rem;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .action-btn.primary {
        background: var(--accent-glow);
        color: var(--accent-text);
        border-color: transparent;
      }
      .state {
        color: var(--text-3);
        text-align: center;
        padding: 3rem;
      }
      @media (max-width: 960px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WbEntryDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly wbService = inject(WorldbuildingService);
  readonly markdownService = inject(MarkdownService);
  private readonly destroyRef = inject(DestroyRef);

  readonly entry = signal<WbEntryDetail | null>(null);
  readonly loading = signal(true);

  fieldEntries(): Array<{ key: string; label: string; value: FieldValue }> {
    const e = this.entry();
    if (!e || !e.fields) return [];
    const schema: FieldDefinition[] = e.category.fieldSchema || [];
    return Object.entries(e.fields)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, value]) => {
        const def = schema.find((f) => f.key === key);
        return { key, label: def?.label || key, value };
      });
  }

  formatFieldValue(value: FieldValue): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    return String(value);
  }

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const worldSlug = params.get('slug');
      const entrySlug = params.get('entrySlug');
      if (!worldSlug || !entrySlug) return;
      this.loading.set(true);
      this.wbService.getEntry(worldSlug, entrySlug).subscribe({
        next: (entry) => {
          this.entry.set(entry);
          this.loading.set(false);
        },
        error: () => {
          this.entry.set(null);
          this.loading.set(false);
        },
      });
    });
  }
}
