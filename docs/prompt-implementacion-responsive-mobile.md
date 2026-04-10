# Prompt detallado para una IA: implementacion responsive mobile de PlotCraft

Tu tarea es volver util la web en mobile, no solo hacer que quepa. Debes trabajar sobre el frontend existente en `plotcraft-frontend`.

## Objetivo

La app debe ser usable en movil para:

- navegar la app autenticada y publica
- explorar novelas, mundos, personajes y comunidades
- abrir y leer detalles
- usar buscador y notificaciones
- crear y editar personajes y mundos
- crear y editar novelas y capitulos
- usar planner, timelines, biblioteca y worldbuilding con degradacion inteligente

## Reglas

1. No rompas desktop.
2. No resuelvas esto con parches aislados por pantalla.
3. Unifica breakpoints y patrones.
4. Prioriza layout y navegacion antes que vistas sueltas.
5. Si un modulo no puede replicar desktop en mobile, crea una UX mobile util.
6. Valida cada fase con build.

## Orden estricto de ejecucion

### Fase 1. Fundaciones responsive

- audita breakpoints y layouts actuales
- define breakpoints oficiales
- crea utilidades globales y reglas base mobile-safe
- normaliza overflow, grids y spacing

### Fase 2. Layout privado mobile

- reemplaza la pseudo-sidebar horizontal por drawer o overlay real
- agrega topbar mobile
- crea bottom nav para accesos principales
- mueve navegacion secundaria al drawer

### Fase 3. Layout publico mobile

- crea navegacion movil real
- evita wrap de nav como solucion principal
- reorganiza header, auth y search

### Fase 4. Componentes compartidos

- search bar mobile
- cards
- filtros en sheet o modal
- dialogs con ancho y alto mobile-safe
- overflow encapsulado para tablas y bloques

### Fase 5. Catalogos y detalles prioritarios

- feed
- descubrir
- catalogos de novelas, mundos y personajes
- detalles principales
- perfiles

### Fase 6. Formularios principales

- personaje
- mundo
- novela
- editor de capitulo
- perfil
- comunidades

### Fase 7. Modulos complejos

- planner
- timelines
- worldbuilding
- visual boards
- analytics

### Fase 8. QA mobile

- validar en `360x800`, `390x844`, `412x915`, `768x1024`, `1024x1366`
- agregar E2E si aplica
- revisar ausencia de scroll horizontal accidental

## Criterios de aceptacion

La implementacion se considera correcta si:

- existe navegacion mobile real
- no hay scroll horizontal accidental en vistas clave
- catalogos, detalles y formularios principales funcionan bien en `360px`
- modulos complejos tienen variante mobile util
- desktop sigue funcionando
- el proyecto compila

## Entrega esperada

- cambios implementados en frontend
- build validado
- resumen breve por fase
- riesgos pendientes documentados si los hubiera
