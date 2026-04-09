# Implementacion de parentesco y ajustes de UI

## Resumen

Se implemento en frontend el flujo para administrar parentescos entre personajes y se agrego el avatar del usuario en la navbar privada.

La entrega cubre:

- formulario de alta de parentesco
- visualizacion de relaciones en detalle de personaje
- navegacion al personaje relacionado
- confirmacion robusta en acciones destructivas
- avatar junto al nickname en la navbar

## Cambios tecnicos

### Modelos y servicio

Se actualizaron los contratos de personajes para soportar:

- `category`
- `kinshipType`
- `label`
- `relationshipGroupId`

Tambien se adapto `CharactersService` para enviar el nuevo payload de parentesco al backend.

### Dialogo de parentesco

Se agrego un dialog standalone para dar de alta relaciones de parentesco:

- seleccion de tipo de parentesco
- busqueda de personajes propios
- exclusion del personaje actual
- envio del alta al backend

Archivo principal:

- `src/app/features/characters/components/character-kinship-dialog.component.ts`

### Detalle del personaje

Se actualizo el detalle del personaje para:

- mostrar la seccion de relaciones familiares
- permitir alta de parentesco para el owner
- permitir eliminacion del parentesco para el owner
- renderizar listado navegable al personaje vinculado
- hacer clicables los nodos del diagrama

Archivo principal:

- `src/app/features/characters/character-detail-page.component.ts`

### Confirm dialog

Se corrigio el bug donde `Cancelar` podia ejecutar acciones destructivas por uso de strings truthy en `mat-dialog-close`.

Se ajusto el dialogo para devolver booleanos reales y los consumidores destructivos ahora validan `confirmed === true`.

### Navbar

Se agrego un avatar al lado del nickname del usuario en la navbar privada:

- si existe `profile.avatarUrl`, se renderiza la imagen
- si no existe, se usa la inicial del usuario como fallback

Archivos:

- `src/app/layout/private-layout/private-layout.component.html`
- `src/app/layout/private-layout/private-layout.component.scss`

## Verificacion realizada

Se valido localmente con:

```powershell
pnpm.cmd build
```

Y se probo manualmente:

- alta de parentesco
- listado navegable
- cancelacion de dialogo de borrado sin eliminar
- visualizacion de avatar en navbar
