# mobile-porter — memoria

Auditorías responsive ya hechas. Viewports estándar: laptop 1366×768; tablet 768×1024 y 1024×768; celular 390×844 y 844×390.

| Fecha | Rutas | Viewports | Spec | Hallazgos | Estado |
| --- | --- | --- | --- | --- | --- |
| 2026-11-22 | `/`, `/games`, `/hall-of-fame`, `/about`, `/auth` | todos | `specs/16-responsive-pages.md` | desborde 35 px y cabecera encimada en salón a 390; objetivos táctiles <44 px en nav/chips/botones/auth | Implementado (sin commit, rama `spec-16-responsive-pages`) |

## Trucos de Chrome

- Chrome de escritorio no baja de ~500 px de ancho: tablet/celular se prueban con un iframe del tamaño exacto en una página del mismo origen (`javascript_tool`).
- `pointer: coarse` y touch real no se pueden emular: marcar como "verificar en dispositivo".
- `javascript_tool` bloquea salidas con `=` mezcladas con rutas (filtro "Cookie/query string"): devolver `JSON.stringify` de objetos.
- Si `screenshot` da timeout, la pestaña quedó congelada: cerrarla y abrir otra con `tabs_context_mcp {createIfEmpty:true}`.
- Auditoría automática: iframe por ruta/tamaño, comparar `documentElement.scrollWidth` vs `clientWidth` (el scrollbar resta ~10 px) y medir `getBoundingClientRect` de a/button/input; ignorar `.av-mobile-panel` (fuera de pantalla).
- El viewport visible de Chrome es ~1280×581: para capturas de iframes altos, hacer scroll dentro del iframe.
- Sin Python en el entorno: editar con Edit.

## Pendientes conocidos

- Error de consola `Date.now()` al prerenderizar en `/games` y `/hall-of-fame` (cacheComponents); no es responsive.

## Preferencias del usuario

- Prefiere probar con Claude in Chrome en lugar de Playwright.
- No hace commits el agente.
