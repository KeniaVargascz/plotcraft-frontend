# PlotCraft Frontend — Guia de Desarrollo

## Stack

- **Framework:** Angular 21 (standalone components, signals)
- **UI:** Angular Material 21, SCSS
- **HTTP:** HttpApiService (wrapper sobre HttpClient)
- **State:** Signals + RxJS (BehaviorSubject para auth)
- **i18n:** JSON custom (`assets/i18n/es.json`)
- **Editor:** ngx-quill
- **Charts:** chart.js
- **E2E:** Playwright
- **Deploy:** Vercel (auto-deploy on push to main)

## Convenciones obligatorias

### Componentes

- **Maximo 250 lineas por componente.** Si crece mas, extraer sub-componentes
- **Siempre `changeDetection: ChangeDetectionStrategy.OnPush`** en componentes nuevos
- **Siempre `standalone: true`**
- **Smart/Dumb pattern:**
  - Smart (page): inyecta servicios, carga datos, maneja estado
  - Dumb (sub-component): recibe `input()`, emite `output()`, zero logica de negocio
- **Sub-componentes** van en `components/` dentro del feature: `features/novels/components/reader/reader-bookmarks-panel.component.ts`
- **Inputs/Outputs:** usar signal-based `input()` y `output()` (Angular 17+)

### Subscriptions y Memory Leaks

- **Todo `.subscribe()` en ngOnInit o long-lived** debe tener `takeUntilDestroyed(this.destroyRef)`
- **Inyectar:** `private readonly destroyRef = inject(DestroyRef)`
- **Excepciones:** one-shot HTTP calls desde button handlers (create, update, delete) completan naturalmente — no necesitan cleanup
- **Nunca:** `.subscribe()` sin cleanup en route.paramMap, form.valueChanges, Subject.pipe, interval/timer

### Servicios HTTP

- **Usar `HttpApiService`** (nunca `HttpClient` directo)
- **Patron:** `this.api.get<T>('/path')` — auto-prepend baseUrl, auto-unwrap ApiResponse
- **Para blobs:** `this.api.raw().http.get(url, { responseType: 'blob' })`
- **No importar `environment`** en servicios — HttpApiService ya maneja el baseUrl
- **No importar `ApiResponse`** en servicios — HttpApiService ya hace el `.pipe(map(r => r.data))`

### Modelos

- **Todos en `core/models/`** con interfaces TypeScript
- **Todos los campos en camelCase** (match con backend)
- **Paginacion:** usar tipos de `pagination.model.ts`:
  - `CursorPagination`: `{ nextCursor, hasMore, limit }`
  - `PagePagination`: `{ page, limit, total, totalPages, hasMore }`

### API

- **Base URL:** `environment.apiUrl` = `https://plotcraft-backend.onrender.com/api/v1`
- **Paths relativos** en servicios: `/novels`, `/auth/login` (sin `/api/v1` prefix)
- **Campos de response:** siempre camelCase

### Estado

- **Signals** para estado local de componentes (loading, error, data)
- **`computed()`** para estado derivado
- **`BehaviorSubject`** solo en AuthService para currentUser$
- **No usar NgRx ni state management global** — servicios + signals son suficientes

### Estilos

- **SCSS por componente** (inline en `styles` o archivo separado)
- **Angular Material** para UI components (mat-button, mat-card, mat-dialog, etc.)
- **Temas:** 4 temas via `data-theme` attribute (ink, parchment, midnight, forest)
- **No hardcodear colores** — usar CSS custom properties del tema

### i18n

- **Archivo:** `src/assets/i18n/es.json`
- **Estructura jerarquica:** `nav.*`, `auth.*`, `reader.*`, `novels.*`
- **TranslationService** para acceder a traducciones en componentes

### Testing

- **Unit tests:** Vitest (componentes + servicios)
- **E2E:** Playwright
- **Mock de HttpApiService:** `{ get: () => of(data), post: () => of(data) }`

### Commits

- **Formato:** `tipo(scope): descripcion`
- **Tipos:** feat, fix, refactor, perf, chore, docs
- **No push sin verificar:** `npx ng build` debe pasar sin errores

## Estructura de carpetas

```
src/app/
├── core/
│   ├── guards/           # authGuard, guestGuard, adminMatchGuard
│   ├── interceptors/     # auth.interceptor.ts, error.interceptor.ts
│   ├── models/           # 43 interfaces TypeScript (camelCase)
│   ├── pipes/            # GenreLabelPipe, RelativeDatePipe, etc.
│   └── services/         # 41 servicios (HttpApiService + domain services)
├── shared/
│   └── components/       # Componentes reutilizables (search-bar, etc.)
├── auth/
│   └── components/       # Login, Register, ForgotPassword
├── features/
│   ├── novels/
│   │   ├── components/   # Sub-componentes (reader/, novel-form/, novel-detail/)
│   │   ├── *-page.component.ts
│   │   └── models/
│   ├── characters/
│   ├── worlds/
│   ├── communities/
│   ├── community-forums/
│   ├── forum/
│   ├── discovery/
│   ├── feed/
│   ├── library/
│   ├── planner/
│   ├── timeline/
│   ├── search/
│   ├── series/
│   ├── visual-boards/
│   ├── analytics/
│   ├── notifications/
│   ├── profile/
│   ├── users/
│   ├── maps/
│   └── tools/
└── app.routes.ts         # 80+ rutas con lazy loading
```

## Checklist para nuevo componente

1. `standalone: true`, `changeDetection: OnPush`
2. Signals para estado local (`signal()`, `computed()`)
3. `DestroyRef` + `takeUntilDestroyed` en subscriptions long-lived
4. Inputs via `input()` / `input.required()`, Outputs via `output()`
5. Template max 80 lineas — si mas, extraer sub-componentes
6. Servicios via `inject()` (no constructor injection)
7. `npx ng build` pasa

## Checklist para nuevo servicio

1. `@Injectable({ providedIn: 'root' })`
2. Inyectar `HttpApiService` (no HttpClient)
3. Metodos retornan `Observable<T>` usando `this.api.get/post/patch/delete`
4. Paths relativos: `/novels`, no `environment.apiUrl + '/novels'`
5. Modelo tipado en `core/models/`
6. No importar ApiResponse ni environment
