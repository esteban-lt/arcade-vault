# mobile-porter — memoria

Auditorías responsive ya hechas. Viewports estándar: laptop 1366×768; tablet 768×1024 y 1024×768; celular 390×844 y 844×390.

| Fecha | Rutas | Viewports | Spec | Hallazgos | Estado |
| --- | --- | --- | --- | --- | --- |

## Trucos de Chrome

- Chrome de escritorio no baja de ~500 px de ancho: tablet/celular se prueban con un iframe del tamaño exacto en una página del mismo origen (`javascript_tool`).
- `pointer: coarse` y touch real no se pueden emular: marcar como "verificar en dispositivo".

## Preferencias del usuario

- Prefiere probar con Claude in Chrome en lugar de Playwright.
- No hace commits el agente.
