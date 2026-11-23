# SPEC 16 — Responsive de las páginas (sin juegos)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02, SPEC 04, SPEC 15
> **Date:** 2026-11-22
> **Objective:** Que `/`, `/games`, `/hall-of-fame`, `/about` y `/auth` se vean y funcionen sin desbordes y con objetivos táctiles de al menos 44 px en laptop, tablet y celular.

---

## Por qué existe esta spec

Auditoría en Chrome (iframes de tamaño exacto para tablet y celular) de las cinco páginas en 1366×768, 768×1024, 1024×768, 390×844 y 844×390. Quedaron fuera `/games/<id>` y `/games/<id>/play`.

## Alcance

**Dentro:** `src/app/globals.css` (`@layer components` y `.av-main`).
**Fuera:** player, detalle de juego, lógica, textos.

## Hallazgos

| # | Ruta | Viewport | Problema | Causa | Arreglo |
| --- | --- | --- | --- | --- | --- |
| 1 | `/hall-of-fame` | 390×844 | Desborde horizontal de 35 px: título, chips y tabla cortados por la derecha | `.av-main` (flex column) sin `min-width: 0` y `.hall-table` con columnas `1fr` (min-content) | `.av-main { min-width: 0 }`; columnas `minmax(0, 1fr)`; en ≤720 px `44px minmax(0,1fr) 90px 78px`, `gap: 6px` |
| 2 | `/hall-of-fame` | 390×844 | Cabecera de la tabla con textos encimados (RANGO/JUGADOR/PUNTUACIÓN/FECHA) | Fuente pixel de 10 px con tracking 0.16em en columnas angostas | En ≤720 px `.th` a 8 px, tracking 0.02em |
| 3 | Todas | ≤1180 px | Objetivos táctiles < 44 px: logo (36), botón de sesión (35–41), hamburguesa (37), chips (39), `JUGAR` (41), `VER SALÓN` (27), pestañas/botones de `/auth` (38–41), campo de búsqueda (20) | Padding fijo sin alto mínimo | Bloque `@media (max-width: 1180px), (pointer: coarse)` con `min-height: 44px` en `.av-nav .logo/.btn`, `.av-filters .chip`, `.hall-tabs .chip`, `.card .btn`, `.lb-link`, `.auth-tabs button`, `.auth-card .btn`, `.social .btn`, `.contact-form .btn`; hamburguesa `min-width: 44px`; `.av-search input` `min-height: 44px` |

Sin hallazgos en `/`, `/games`, `/about`, `/auth` más allá del #3. Laptop sin cambios (el bloque táctil solo aplica ≤1180 px o `pointer: coarse`).

## Plan de implementación

1. `.av-main { min-width: 0 }` y tabla del salón con `minmax(0, 1fr)` + `overflow-wrap: anywhere` en `.pl`.
2. Columnas y cabecera compactas de la tabla en `@media (max-width: 720px)`.
3. Bloque de objetivos táctiles al final de `@layer components`.

## Criterios de aceptación

- Laptop 1366×768: sin cambios visibles, sin desborde, menú completo.
- Tablet 768×1024 y 1024×768, celular 390×844 y 844×390: `scrollWidth == clientWidth` en las cinco rutas; ningún botón, enlace o chip por debajo de 44 px de alto/ancho (salvo el honeypot oculto del formulario de contacto).
- `/hall-of-fame` a 390 px: tabla y cabecera legibles sin recortes.

## Decisiones

- El usuario invocó al agente con la petición de corregir, lo que cuenta como aprobación (Status: Aprobado, ahora Implementado).
- Se usa `min-height` con media query en lugar de subir el padding global para no alterar el diseño de escritorio.
- No se tocó el aviso de consola (ver riesgos).

## Riesgos

- Error de consola en `/games` y `/hall-of-fame`: "unstable value `Date.now()` while prerendering" (Next 16 con `cacheComponents`). No es responsive y está en código fuera del alcance de este agente; requiere una spec aparte.
- `pointer: coarse` y tacto real no se pueden emular: verificar en dispositivo.

## Qué no entra

Player, detalle de juego, cambios de copy, el error de `Date.now()`.
