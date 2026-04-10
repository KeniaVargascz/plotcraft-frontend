# Editor unificado Markdown en personajes y mundos

## Resumen

Se reemplazaron los bloques de texto largos separados por un unico editor Markdown en:

- crear y editar personajes
- crear y editar mundos

El objetivo fue simplificar la edicion, permitir una estructura tipo wiki/fandom y evitar formularios fragmentados para contenido narrativo extenso.

## Personajes

En personajes se reemplazaron estos campos:

- Apariencia
- Personalidad
- Motivaciones
- Miedos
- Fortalezas
- Debilidades
- Backstory
- Arco

Por un unico campo `profileContent` con:

- toolbar Markdown
- plantillas rapidas
- preview renderizado

Compatibilidad:

- al editar personajes legacy, los campos antiguos se convierten automaticamente a un documento Markdown con secciones
- al guardar desde la nueva UI, el contenido unificado se persiste en `backstory`
- los campos legacy restantes se envian como `null`

Render de detalle:

- si el personaje ya esta en modo unificado, el detalle renderiza `backstory` completo como documento Markdown
- si sigue en formato legacy, el detalle conserva el armado por secciones

## Mundos

En mundos se reemplazaron estos campos:

- Descripcion
- Ambientacion
- Sistema de magia
- Reglas

Por un unico campo `worldContent` con:

- toolbar Markdown
- plantillas rapidas
- preview renderizado

Compatibilidad:

- al editar mundos legacy, esos cuatro campos se convierten automaticamente a un documento Markdown unico
- al guardar desde la nueva UI, el contenido unificado se persiste en `description`
- `setting`, `magicSystem` y `rules` se envian como `null`

Render de detalle:

- si el mundo ya esta en modo unificado, el detalle renderiza `description` como documento completo
- si sigue en formato legacy, el detalle recompone secciones a partir de los campos anteriores

## Archivos tocados

- `src/app/features/characters/character-form-page.component.ts`
- `src/app/features/characters/character-detail-page.component.ts`
- `src/app/features/worlds/world-form-page.component.ts`
- `src/app/features/worlds/world-detail-page.component.ts`

## Verificacion

Se valido con:

```powershell
pnpm.cmd build
```

La build del frontend compila correctamente. Los warnings observados son previos y no bloquean el build.

## Navegacion y scroll

Se agrego restauracion global de scroll en el router para que, al navegar desde el menu u otras rutas internas, la vista arranque desde el principio.

Implementacion:

- `src/app/app.config.ts`

Configuracion aplicada:

- `withInMemoryScrolling`
- `scrollPositionRestoration: 'top'`
- `anchorScrolling: 'enabled'`

Con esto se evita tener que forzar `window.scrollTo` manualmente en cada pantalla.
