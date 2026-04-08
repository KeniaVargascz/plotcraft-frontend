# PlotCraft Frontend

Frontend standalone de PlotCraft construido con Angular.

## Stack

- Angular standalone
- Angular Material
- Reactive Forms
- Router lazy loading
- i18n JSON
- Sistema de temas

## Requisitos

- Node.js LTS
- pnpm

## Instalacion

```bash
pnpm install
```

## Desarrollo

```bash
pnpm start
```

Aplicacion:
- `http://localhost:4200`

## Configuracion de API

La URL del backend se define en:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Por defecto apunta a:

- `http://localhost:3000/api`

## Cambio reciente de rating

- El frontend usa `T` en lugar de `PG13` para `NovelRating`.
- El cambio ya esta reflejado en el modelo, el formulario de novela y las tarjetas/resumenes donde se muestra la clasificacion.
