import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TemplateCardComponent, TemplateCardData } from './components/template-card.component';
import { TemplatePreviewComponent } from './components/template-preview.component';

type MarkdownTool = {
  title: string;
  syntax: string;
  example: string;
  note: string;
};

type AppArea = {
  title: string;
  route: string;
  note: string;
  fields: string[];
};

const MARKDOWN_TOOLS: MarkdownTool[] = [
  {
    title: 'Titulos',
    syntax: '# Titulo / ## Seccion / ### Subtitulo',
    example: '# Casa Stark\n## Historia\n### Guerra de los Cinco Reyes',
    note: 'Sirve para ordenar fichas largas y perfiles tipo wiki.',
  },
  {
    title: 'Negritas y cursivas',
    syntax: '**negrita** / *cursiva* / ***ambas***',
    example: '**Alias:** El Lobo Blanco\n*Rumor:* desaparecio en el norte',
    note: 'Util para destacar nombres, alias, rangos y advertencias.',
  },
  {
    title: 'Listas',
    syntax: '- item / 1. item',
    example: '- Leal\n- Calculador\n- Protector\n\n1. Exilio\n2. Retorno\n3. Coronacion',
    note: 'Ideal para habilidades, relaciones, eventos y objetivos.',
  },
  {
    title: 'Links',
    syntax: '[texto](https://ejemplo.com)',
    example: '[Referencia visual](https://myheroacademia.fandom.com/es/wiki/Izuku_Midoriya)',
    note: 'Funciona para fuentes externas, tableros y referencias de investigacion.',
  },
  {
    title: 'Imagen por URL',
    syntax: '![alt](https://url-de-imagen)',
    example:
      '![Escudo](https://static.wikia.nocookie.net/gameofthrones/images/b/bd/House_Stark.svg)',
    note: 'Conviene usarlo con moderacion en campos descriptivos extensos.',
  },
  {
    title: 'Citas',
    syntax: '> cita',
    example: '> Cuando nieva y sopla el viento blanco, el lobo solitario muere.',
    note: 'Sirve para frases iconicas, juramentos o citas de worldbuilding.',
  },
  {
    title: 'Separador',
    syntax: '---',
    example: '## Perfil\n\nResumen corto.\n\n---\n\n## Historia',
    note: 'Ayuda a dividir bloques largos sin crear ruido visual.',
  },
  {
    title: 'Tablas',
    syntax: '| Columna | Valor |',
    example:
      '| Dato | Valor |\n| --- | --- |\n| Edad | 17 |\n| Altura | 1.66 m |\n| Estado | Activo |',
    note: 'Excelente para fichas rapidas estilo fandom.',
  },
  {
    title: 'Codigo inline y bloques',
    syntax: '`inline` / ```bloque```',
    example:
      'Usa el titulo `Hero Name` como variante corta.\n\n```txt\nQuirk: One For All\nEstado: En entrenamiento\n```',
    note: 'Mas util para notas tecnicas, sistemas o plantillas reutilizables.',
  },
];

const APP_AREAS: AppArea[] = [
  {
    title: 'Personajes',
    route: '/mis-personajes/:slug/editar',
    note: 'Soporta preview Markdown al editar y render Markdown en el detalle.',
    fields: [
      'Apariencia',
      'Personalidad',
      'Motivaciones',
      'Miedos',
      'Fortalezas',
      'Debilidades',
      'Backstory',
      'Arco',
    ],
  },
  {
    title: 'Mundos',
    route: '/mis-mundos/:slug/editar',
    note: 'Pensado para describir universos, reglas, ambientacion y magia.',
    fields: ['Descripcion', 'Ambientacion', 'Sistema de magia', 'Reglas'],
  },
  {
    title: 'Worldbuilding',
    route: '/mis-mundos/:slug/world-building',
    note: 'Las entradas principales y los campos de tipo markdown usan el mismo render.',
    fields: ['Contenido de entrada', 'Campos dinamicos tipo markdown'],
  },
  {
    title: 'Foro general',
    route: '/foro/nuevo',
    note: 'Hilos y respuestas permiten contenido markdown con vista previa.',
    fields: ['Contenido del hilo', 'Respuestas'],
  },
  {
    title: 'Foros de comunidad',
    route: '/comunidades/:slug/foros/:forumSlug',
    note: 'Los threads y replies renderizan Markdown como en el foro general.',
    fields: ['Hilo principal', 'Respuestas'],
  },
  {
    title: 'Comunidades',
    route: '/mis-comunidades/:slug/editar',
    note: 'Las reglas se muestran con Markdown en el detalle de la comunidad.',
    fields: ['Reglas'],
  },
  {
    title: 'Capitulos',
    route: '/mis-novelas/:slug/capitulos/:chSlug/editar',
    note: 'El editor y el lector de capitulos ya trabajan en Markdown completo.',
    fields: ['Contenido del capitulo'],
  },
];

const TEMPLATE_CARDS: TemplateCardData[] = [
  {
    id: 'personaje-fandom',
    title: 'Perfil de personaje estilo fandom',
    category: 'Personajes',
    summary:
      'Plantilla compacta para perfiles tipo wiki con ficha, historia, relaciones y curiosidades.',
    bestFor: 'Backstory, arco o fichas largas de personaje.',
    content: `# Nombre del personaje

> Frase iconica o tagline del personaje.

## Ficha rapida

| Dato | Valor |
| --- | --- |
| Nombre completo |  |
| Alias |  |
| Edad |  |
| Raza / especie |  |
| Afiliacion |  |
| Estado |  |

## Resumen

Describe en 3 a 5 lineas quien es, por que importa y cual es su rol en la historia.

## Apariencia

- Altura:
- Rasgos distintivos:
- Estilo de ropa:
- Elementos visuales clave:

## Personalidad

- Virtud principal:
- Defecto principal:
- Miedos:
- Deseos:

## Historia

### Origen

Cuenta su contexto inicial, familia, lugar de origen y detonante narrativo.

### Desarrollo

Resume sus eventos mas importantes en orden.

### Estado actual

Explica en que punto esta ahora y que conflicto mantiene abierto.

## Relaciones

- **Aliado:** [Nombre](https://ejemplo.com)
- **Rival:** Nombre
- **Familia:** Nombre

## Habilidades

1. Habilidad principal
2. Tecnica especial
3. Limitaciones

## Curiosidades

- Dato 1
- Dato 2
- Dato 3`,
    routes: [
      { label: 'Usar en personajes', to: '/mis-personajes/nuevo' },
      { label: 'Ver mis personajes', to: '/mis-personajes' },
    ],
  },
  {
    id: 'personaje-enciclopedia',
    title: 'Ficha enciclopedica extensa',
    category: 'Personajes',
    summary: 'Enfoque mas documental para universos grandes, sagas o fandoms densos.',
    bestFor: 'Perfiles con mucha continuidad, power scaling o cronologia.',
    content: `# Nombre del personaje

## Identidad

| Campo | Valor |
| --- | --- |
| Nombre original |  |
| Alias |  |
| Titulo |  |
| Debut |  |
| Estado |  |

## Descripcion general

Parrafo introductorio similar a una wiki: presenta al personaje, su rol y su relevancia narrativa.

## Biografia

### Antes de la historia

### Arco inicial

### Arcos intermedios

### Punto de quiebre

### Situacion actual

## Poderes y capacidades

| Categoria | Detalle |
| --- | --- |
| Habilidad base |  |
| Tecnicas |  |
| Equipo |  |
| Debilidades |  |

## Participacion por saga

1. Saga 1
2. Saga 2
3. Saga 3

## Relaciones destacadas

> Usa esta seccion para enlazar otros perfiles internos o referencias externas.

- **Mentor:** [Nombre](https://ejemplo.com)
- **Compañero/a:** Nombre
- **Antagonista:** Nombre`,
    routes: [
      { label: 'Usar en personajes', to: '/mis-personajes/nuevo' },
      { label: 'Abrir catalogo', to: '/personajes' },
    ],
  },
  {
    id: 'mundo-fandom',
    title: 'Plantilla de mundo o setting',
    category: 'Mundos',
    summary: 'Plantilla para entradas tipo universo, reino, pais o ambientacion principal.',
    bestFor: 'Descripcion, ambientacion o sistema de magia.',
    content: `# Nombre del mundo

## Vista general

Resume el tono del universo, su genero y el conflicto base.

## Datos clave

| Elemento | Valor |
| --- | --- |
| Genero |  |
| Nivel tecnologico |  |
| Nivel de magia |  |
| Epoca |  |
| Estado politico |  |

## Geografia y regiones

- Region 1:
- Region 2:
- Region 3:

## Cultura

### Costumbres

### Religiones

### Organizaciones

## Sistema de poder o magia

1. Fuente del poder
2. Reglas
3. Costos
4. Riesgos

## Conflictos centrales

- Conflicto 1
- Conflicto 2

## Referencias

- [Moodboard](https://ejemplo.com)
- [Mapa externo](https://ejemplo.com)`,
    routes: [
      { label: 'Usar en mundos', to: '/mis-mundos/nuevo' },
      { label: 'Ver mis mundos', to: '/mis-mundos' },
    ],
  },
  {
    id: 'cronologia',
    title: 'Cronologia resumida',
    category: 'Lore',
    summary: 'Plantilla pensada para resumir eras, guerras, reinados o eventos clave.',
    bestFor: 'Entradas de worldbuilding y backstory historico.',
    content: `# Cronologia

## Era antigua

- **Año 0:** Evento fundacional.
- **Año 54:** Primera ruptura.

## Era de expansion

- **Año 110:** Ascenso de la casa dominante.
- **Año 146:** Guerra civil.

## Era actual

- **Año 301:** Regreso del antagonista.
- **Año 304:** Inicio de la historia principal.

---

> Puedes duplicar esta estructura para reinos, clanes, academias o sagas enteras.`,
    routes: [
      { label: 'Usar en mundos', to: '/mis-mundos/nuevo' },
      { label: 'Abrir worldbuilding', to: '/mis-mundos' },
    ],
  },
  {
    id: 'foro-analisis',
    title: 'Hilo de teoria o analisis',
    category: 'Foro',
    summary: 'Formato para publicar teorias, comparativas y breakdowns mas legibles.',
    bestFor: 'Hilos y respuestas largas en foro o comunidad.',
    content: `# Tesis principal

Explica la teoria o el punto central en 2 o 3 lineas.

## Evidencia

1. Primera pista
2. Segunda pista
3. Tercera pista

## Citas o referencias

> Fragmento, escena o afirmacion clave.

## Contrapuntos

- Objecion 1
- Objecion 2

## Conclusion

Cierra con una idea fuerte y, si aplica, agrega enlaces:

- [Wiki externa](https://ejemplo.com)
- [Referencia visual](https://ejemplo.com)`,
    routes: [
      { label: 'Usar en foro', to: '/foro/nuevo' },
      { label: 'Abrir foro', to: '/foro' },
    ],
  },
  {
    id: 'relaciones-citas',
    title: 'Bloque de relaciones y citas',
    category: 'Complementos',
    summary: 'Snippet corto para complementar perfiles sin reescribir toda la ficha.',
    bestFor: 'Backstory, personalidad, reglas o lore.',
    content: `## Relaciones clave

- **Aliado principal:** Nombre
- **Interes romantico:** Nombre
- **Figura paternal:** Nombre
- **Rival directo:** Nombre

## Frases destacadas

> "Primera cita memorable."

> "Segunda cita memorable."

## Enlaces utiles

- [Wiki de referencia](https://ejemplo.com)
- [Playlist](https://ejemplo.com)
- [Moodboard](https://ejemplo.com)`,
    routes: [
      { label: 'Usar en personajes', to: '/mis-personajes/nuevo' },
      { label: 'Usar en mundos', to: '/mis-mundos/nuevo' },
    ],
  },
  {
    id: 'casa-clan-reino',
    title: 'Ficha de casa, clan o reino',
    category: 'Mundos',
    summary: 'Plantilla para grupos politicos, familias nobles, clanes, academias y facciones.',
    bestFor: 'Entradas de lore, worldbuilding y perfiles de facciones.',
    content: `# Nombre de la casa o reino

> Lema, mantra o linea representativa.

## Identidad

| Campo | Valor |
| --- | --- |
| Fundacion |  |
| Sede |  |
| Lider actual |  |
| Region de influencia |  |
| Estado |  |

## Resumen

Explica por que esta faccion importa, como se percibe y cual es su peso politico o militar.

## Historia

### Origen

### Auge

### Crisis

### Situacion actual

## Miembros destacados

- **Lider:** Nombre
- **Heredero/a:** Nombre
- **Aliado clave:** Nombre
- **Rival historico:** Nombre

## Recursos y fortalezas

- Ejercito
- Economia
- Territorio
- Reliquias

## Debilidades

- Division interna
- Dependencia externa
- Enemigos activos

## Referencias

- [Arbol genealogico](https://ejemplo.com)
- [Mapa del territorio](https://ejemplo.com)`,
    routes: [
      { label: 'Usar en mundos', to: '/mis-mundos/nuevo' },
      { label: 'Explorar mundos', to: '/mundos' },
    ],
  },
];

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TemplateCardComponent, TemplatePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="templates-shell">
      <header class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Herramientas</p>
          <h1>Plantillas</h1>
          <p class="lede">
            Coleccion de snippets, estructuras y recursos Markdown para construir perfiles tipo
            fandom, fichas enciclopedicas, lore y publicaciones con mejor formato.
          </p>
          <div class="hero-actions">
            <a class="ghost-btn" routerLink="/mis-personajes">Abrir personajes</a>
            <a class="ghost-btn" routerLink="/mis-mundos">Abrir mundos</a>
            <a class="ghost-btn" routerLink="/foro/nuevo">Abrir foro</a>
          </div>
        </div>

        <article class="hero-preview card">
          <p class="mini-label">Sintaxis activa en la app</p>
          <div class="capsules">
            @for (tool of markdownTools; track tool.title) {
              <span>{{ tool.title }}</span>
            }
          </div>
          <p class="hero-note">
            El render usa Markdown sanitizado, con soporte para enlaces, listas, tablas, citas,
            imagenes por URL y bloques de codigo.
          </p>
        </article>
      </header>

      <section class="grid">
        <article class="card block">
          <div class="block-head">
            <div>
              <p class="mini-label">Mapa de soporte</p>
              <h2>Donde funciona</h2>
            </div>
          </div>
          <div class="areas">
            @for (area of appAreas; track area.title) {
              <article class="area-card">
                <div class="area-top">
                  <h3>{{ area.title }}</h3>
                  <code>{{ area.route }}</code>
                </div>
                <p>{{ area.note }}</p>
                <div class="chips">
                  @for (field of area.fields; track field) {
                    <span>{{ field }}</span>
                  }
                </div>
              </article>
            }
          </div>
        </article>

        <article class="card block">
          <div class="block-head">
            <div>
              <p class="mini-label">Referencia rapida</p>
              <h2>Herramientas Markdown</h2>
            </div>
          </div>

          <div class="tool-list">
            @for (tool of markdownTools; track tool.title) {
              <article class="tool-card">
                <div class="tool-title-row">
                  <h3>{{ tool.title }}</h3>
                  <button type="button" class="copy-btn" (click)="copy(tool.example, tool.title)">
                    {{ copyLabel(tool.title) }}
                  </button>
                </div>
                <code class="syntax">{{ tool.syntax }}</code>
                <pre>{{ tool.example }}</pre>
                <p>{{ tool.note }}</p>
              </article>
            }
          </div>
        </article>
      </section>

      <section class="block templates-block">
        <div class="block-head">
          <div>
            <p class="mini-label">Plantillas listas</p>
            <h2>Perfiles y estructuras copiables</h2>
          </div>
          <p class="section-note">
            Pensadas para universos similares a fandom wikis, fichas de personajes, lore y analisis.
          </p>
        </div>

        <div class="filters card-lite">
          <label class="filter-field">
            <span>Buscar plantilla</span>
            <input
              type="text"
              [ngModel]="search()"
              (ngModelChange)="updateSearch($event)"
              placeholder="Personaje, reino, cronologia, teoria..."
            />
          </label>

          <label class="filter-field">
            <span>Categoria</span>
            <select [ngModel]="categoryFilter()" (ngModelChange)="updateCategory($event)">
              @for (category of categories; track category) {
                <option [value]="category">{{ category }}</option>
              }
            </select>
          </label>
        </div>

        <div class="template-grid">
          @for (tpl of filteredTemplates(); track tpl.id) {
            <app-template-card
              [template]="tpl"
              [selected]="selectedTemplateId() === tpl.id"
              [copied]="copiedKey() === tpl.id"
              (preview)="selectedTemplateId.set($event.id)"
              (copy)="copy($event.content, $event.id)"
            />
          }
        </div>

        @if (!filteredTemplates().length) {
          <div class="empty-state card-lite">
            <strong>No hay coincidencias.</strong>
            <p>Ajusta la búsqueda o cambia la categoría para ver más plantillas.</p>
          </div>
        }
      </section>

      <app-template-preview
        [template]="activeTemplate()"
        [copied]="copiedKey() === activeTemplate().id"
        (useTemplate)="copy($event.content, $event.id)"
      />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .templates-shell {
        display: grid;
        gap: 1.4rem;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
        gap: 1rem;
        align-items: stretch;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: 1.4rem;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--bg-card) 92%, #f4e7d3 8%),
          var(--bg-card)
        );
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      }
      .hero-copy,
      .hero-preview,
      .block,
      .preview-section {
        padding: 1.3rem;
      }
      .hero-copy {
        border: 1px solid var(--border);
        border-radius: 1.6rem;
        background:
          radial-gradient(circle at top left, rgba(200, 129, 54, 0.18), transparent 42%),
          radial-gradient(circle at bottom right, rgba(50, 101, 160, 0.18), transparent 38%),
          linear-gradient(
            145deg,
            var(--bg-card),
            color-mix(in srgb, var(--bg-surface) 80%, #f3e9d8 20%)
          );
      }
      .eyebrow,
      .mini-label,
      .lede,
      .section-note,
      .tool-card p,
      .template-meta p,
      .area-card p {
        color: var(--text-2);
      }
      .eyebrow,
      .mini-label {
        margin: 0 0 0.35rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
      }
      h1,
      h2,
      h3,
      p {
        margin-top: 0;
      }
      h1 {
        margin-bottom: 0.75rem;
        font-size: clamp(2rem, 4vw, 3.3rem);
        line-height: 0.95;
      }
      h2 {
        margin-bottom: 0.25rem;
        font-size: 1.4rem;
      }
      .lede {
        max-width: 68ch;
        font-size: 1rem;
        line-height: 1.7;
      }
      .hero-actions,
      .preview-actions,
      .template-actions,
      .chips,
      .capsules {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .ghost-btn,
      .copy-btn {
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-surface);
        color: var(--text-1);
        padding: 0.65rem 1rem;
        text-decoration: none;
        cursor: pointer;
        font-weight: 600;
      }
      .copy-btn.strong {
        background: color-mix(in srgb, var(--accent-glow) 70%, var(--bg-surface));
        color: var(--accent-text);
        border-color: transparent;
      }
      .hero-preview {
        display: grid;
        gap: 0.85rem;
        align-content: start;
      }
      .capsules span,
      .chips span,
      .template-category {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0.28rem 0.7rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent-glow) 28%, var(--bg-surface));
        border: 1px solid color-mix(in srgb, var(--border) 75%, #c88136 25%);
        font-size: 0.8rem;
        font-weight: 600;
      }
      .hero-note {
        margin-bottom: 0;
        line-height: 1.6;
      }
      .grid,
      .template-grid,
      .preview-grid,
      .areas,
      .tool-list {
        display: grid;
        gap: 1rem;
      }
      .card-lite {
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 90%, #fff7ea 10%);
        padding: 1rem;
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .filters {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.7fr);
        gap: 0.85rem;
        margin-bottom: 1rem;
      }
      .filter-field {
        display: grid;
        gap: 0.4rem;
      }
      .filter-field span {
        color: var(--text-2);
        font-size: 0.82rem;
        font-weight: 600;
      }
      .filter-field input,
      .filter-field select {
        min-height: 2.9rem;
        border-radius: 0.9rem;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text-1);
        padding: 0.75rem 0.9rem;
      }
      .areas {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .area-card,
      .tool-card,
      .template-card,
      .preview-pane {
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--bg-surface) 88%, #fff7ea 12%);
        padding: 1rem;
      }
      .area-top,
      .tool-title-row,
      .block-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
      }
      .block-head {
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .area-top {
        flex-direction: column;
      }
      .area-top code,
      .syntax {
        color: color-mix(in srgb, var(--text-1) 76%, #6f4e37 24%);
      }
      code,
      pre {
        font-family: Consolas, 'Courier New', monospace;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        line-height: 1.55;
      }
      .tool-list {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .tool-card pre,
      .template-source,
      .preview-pane pre {
        margin-top: 0.85rem;
        padding: 0.9rem;
        border-radius: 0.85rem;
        background: #1f2026;
        color: #f6f6f8;
        overflow-x: auto;
      }
      .template-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      .template-meta small {
        color: var(--text-3);
      }
      .empty-state {
        text-align: center;
      }
      .empty-state p {
        margin-bottom: 0;
      }
      @media (max-width: 1040px) {
        .hero,
        .preview-grid {
          grid-template-columns: 1fr;
        }
        .filters {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TemplatesPageComponent {
  readonly markdownTools = MARKDOWN_TOOLS;
  readonly appAreas = APP_AREAS;
  readonly templates = TEMPLATE_CARDS;
  readonly copiedKey = signal<string | null>(null);
  readonly selectedTemplateId = signal(TEMPLATE_CARDS[0].id);
  readonly search = signal('');
  readonly categoryFilter = signal<'Todas' | string>('Todas');
  readonly categories = ['Todas', ...new Set(TEMPLATE_CARDS.map((template) => template.category))];
  readonly filteredTemplates = computed(() => {
    const query = this.search().trim().toLowerCase();
    const category = this.categoryFilter();
    return this.templates.filter((template) => {
      const matchesCategory = category === 'Todas' || template.category === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      const haystack = [
        template.title,
        template.category,
        template.summary,
        template.bestFor,
        template.content,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  });
  readonly activeTemplate = computed(
    () =>
      this.filteredTemplates().find((template) => template.id === this.selectedTemplateId()) ??
      this.filteredTemplates()[0] ??
      this.templates[0],
  );

  copy(content: string, key: string): void {
    void navigator.clipboard.writeText(content).then(() => {
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) {
          this.copiedKey.set(null);
        }
      }, 1800);
    });
  }

  copyLabel(key: string): string {
    return this.copiedKey() === key ? 'Copiado' : 'Copiar';
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.ensureSelectedTemplateIsVisible();
  }

  updateCategory(value: string): void {
    this.categoryFilter.set(value);
    this.ensureSelectedTemplateIsVisible();
  }

  private ensureSelectedTemplateIsVisible(): void {
    const visible = this.filteredTemplates();
    if (!visible.some((template) => template.id === this.selectedTemplateId())) {
      this.selectedTemplateId.set(visible[0]?.id ?? this.templates[0].id);
    }
  }
}
