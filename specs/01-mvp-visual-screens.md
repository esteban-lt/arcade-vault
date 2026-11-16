# SPEC 01 — MVP visual de las pantallas de Arcade Vault

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-11-16
> **Objective:** Implementar en Next.js (App Router) las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, salón de la fama y auth) con datos simulados y sin lógica de juego real.

---

## Por qué existe esta spec

El tema visual ya está en `app/globals.css` (clases `av-nav`, `av-grid`, `av-detail`, `av-player`, `av-hall`, `av-auth-wrap`, `podium`, `modal-bd`, `cover-*`, etc.) y en `app/layout.tsx` (fuentes y capas de fondo). Falta la estructura: rutas, componentes y datos. Las plantillas son un SPA de React con Babel en el navegador y navegación por hash, así que se **portan** a Next, no se copian.

---

## Alcance

**Dentro:**

- Cinco rutas reales del App Router:
  - `/` — Biblioteca (reemplaza el hero actual de `app/page.tsx`).
  - `/games/[id]` — Detalle del juego.
  - `/games/[id]/play` — Reproductor simulado.
  - `/hall-of-fame` — Salón de la Fama.
  - `/auth` — Iniciar sesión / Crear cuenta.
- `Nav` global dentro de `app/layout.tsx`, con menú móvil hamburguesa (panel lateral + backdrop) y estado activo según la ruta.
- Tilt 3D en las tarjetas de juego.
- Sesión simulada con `AuthProvider` (context cliente) respaldada en `localStorage`.
- Reproductor simulado: HUD, puntos que suben solos, pausa, botón FIN, modal de fin de juego y guardado de la puntuación en `localStorage`.
- Datos simulados tipados en `lib/`: 8 juegos y puntuaciones deterministas con semilla.
- Botones Google/GitHub en Auth, visibles pero inertes.
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con código limpio (nombres descriptivos, sin abreviaturas).
- Excepción: los `id` y `title` de los juegos van en inglés (p. ej. `brick-buster` / `BRICK BUSTER`); sus descripciones siguen en español.

**Fuera de alcance (para otras specs):**

- Lógica de juego real (colisiones, input, bucle de juego, ningún juego jugable).
- Backend, base de datos, API routes o autenticación real (contraseñas, OAuth, sesiones).
- Leer las puntuaciones guardadas en `localStorage` desde el Detalle o el Salón.
- Footer global (la plantilla lo trae, se decidió no incluirlo).
- Contador de créditos dinámico (`CRÉDITOS · 03` es texto fijo).
- Validación de formularios y mensajes de error de Auth.
- Tests automatizados (el proyecto no tiene framework de pruebas).
- Metadatos SEO por página.

---

## Modelo de datos

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameAccentColor = "cyan" | "magenta" | "green" | "yellow";

export type Game = {
  id: string;            // slug used in the URL, e.g. "brick-buster"
  title: string;
  shortDescription: string;
  longDescription: string;
  category: GameCategory;
  coverClassName: string; // existing CSS class, e.g. "cover-bricks"
  accentColor: GameAccentColor;
  bestScore: number;
  playsLabel: string;     // already formatted, e.g. "12.4K"
};

export const GAMES: Game[];                              // the 8 games from data.jsx
export const CATEGORY_FILTERS: ("TODOS" | GameCategory)[];
export function findGameById(id: string): Game | undefined;

// lib/scores.ts
export type ScoreEntry = { rank: number; playerName: string; score: number; date: string }; // date "dd/mm/2026"
export function generateSeededScores(seed: number, count?: number): ScoreEntry[]; // deterministic, same RNG as data.jsx

// lib/auth (client)
export type SessionUser = { name: string }; // uppercase, max 10 chars
// localStorage keys
//   "arcade-vault:user"       -> SessionUser | absent (guest)
//   "arcade-vault:scores:v1"  -> { gameId: string; playerName: string; score: number; savedAt: number }[]
```

Convenciones:

- `generateSeededScores` debe devolver el mismo resultado en servidor y cliente para la misma semilla (sin `Math.random`), para evitar errores de hidratación.
- Las semillas se calculan igual que en las plantillas: Detalle `id.length * 17 + 3` (10 filas), Salón `id.length * 23 + 7` (12 filas).
- Números formateados con `toLocaleString("es-ES")`.
- Los nombres de los campos pasan de abreviados (`short`, `long`, `cat`, `best`) a descriptivos.

---

## Plan de implementación

Antes de empezar: leer en `node_modules/next/dist/docs/01-app/01-getting-started/` las guías `03-layouts-and-pages.md`, `04-linking-and-navigating.md` y `05-server-and-client-components.md` (esta versión de Next tiene cambios incompatibles, por ejemplo `params` asíncrono).

1. **Datos.** Crear `lib/games.ts` y `lib/scores.ts` con los tipos y el contenido de `data.jsx`. Verificación: `npm run lint` y `npx tsc --noEmit` pasan.
2. **Sesión.** Crear `components/auth-provider.tsx` (`"use client"`) con `useAuth()` que expone `user`, `signIn(user)` y `signOut()`. Lee `arcade-vault:user` en un `useEffect` (no durante el render) para no romper la hidratación. Verificación: compila y envuelve el árbol sin cambios visuales.
3. **Nav.** Crear `components/nav.tsx` (`"use client"`, usa `usePathname`) con logo, enlaces, créditos fijos, botón de sesión y panel móvil. Montarlo en `app/layout.tsx` junto con `AuthProvider`. Verificación: el nav se ve en `/` y el enlace "Biblioteca" aparece activo.
4. **Biblioteca.** Crear `components/game-card.tsx` (cliente, con tilt) y `components/library.tsx` (cliente, con buscador y chips de categoría). Reemplazar `app/page.tsx` para que renderice `Library`. Las tarjetas enlazan a `/games/[id]`. Verificación: filtrar por texto y categoría; el estado vacío muestra "NO HAY RESULTADOS".
5. **Detalle.** Crear `app/games/[id]/page.tsx` (Server Component) con portada, etiquetas, descripción, franja de estadísticas, acciones y ranking de 10 filas. Llamar a `notFound()` si el juego no existe. Verificación: `/games/block-fall` se renderiza y `/games/xyz` da 404.
6. **Auth.** Crear `app/auth/page.tsx` y `components/auth-form.tsx` (cliente) con pestañas, campos, botón de invitado y botones sociales inertes. Enviar el formulario llama a `signIn` y navega a `/`. "Jugar como invitado" llama a `signOut` y navega a `/`. Verificación: tras entrar el nav muestra el nombre en mayúsculas.
7. **Reproductor.** Crear `app/games/[id]/play/page.tsx` (Server Component, valida el juego) y `components/game-player.tsx` (cliente) con HUD, arena decorativa, CRT, puntos simulados cada 220 ms, pausa, FIN y modal de fin de juego. Guardar escribe en `arcade-vault:scores:v1` y muestra el toast. Verificación: la puntuación sube sola, pausa la detiene, FIN abre el modal, "Jugar de nuevo" reinicia.
8. **Salón de la Fama.** Crear `app/hall-of-fame/page.tsx` y `components/hall-of-fame.tsx` (cliente por las pestañas): podio, tabla con animación escalonada y fila "tu mejor marca" solo con sesión. Verificación: cambiar de pestaña cambia los datos; sin sesión no aparece la fila del usuario.
9. **Revisión final de paridad.** Comparar cada pantalla con `references/templates/Arcade Vault.html` en escritorio y móvil, y corregir diferencias de estructura. Ejecutar `npm run lint` y `npm run build`. El build exige `generateStaticParams` en `/games/[id]` y `/games/[id]/play` (por `cacheComponents: true`), y el lint exige ignorar `references/**` en `eslint.config.mjs`.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Existen las rutas `/`, `/games/[id]`, `/games/[id]/play`, `/hall-of-fame` y `/auth`, y cada una carga sin errores en la consola del navegador.
- [ ] `/games/id-inexistente` y `/games/id-inexistente/play` responden con la página 404.
- [ ] La Biblioteca muestra 8 tarjetas; filtrar por "PUZZLE" deja solo "BLOCK FALL"; buscar "zzz" muestra "NO HAY RESULTADOS".
- [ ] Mover el mouse sobre una tarjeta la inclina y al salir vuelve a su posición.
- [ ] Hacer clic en una tarjeta o en "JUGAR" lleva a `/games/[id]` del juego correcto.
- [ ] El Detalle muestra 10 filas de ranking, con las 3 primeras con estilo `top1`/`top2`/`top3`.
- [ ] "JUGAR AHORA" lleva a `/games/[id]/play` y "VOLVER AL VAULT" a `/`.
- [ ] En el Reproductor la puntuación aumenta sola; "PAUSA" la detiene y muestra "EN PAUSA"; "REANUDAR" continúa.
- [ ] "FIN" abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA_" y agrega una entrada a `arcade-vault:scores:v1`.
- [ ] "JUGAR DE NUEVO" reinicia puntos, vidas y nivel; "SALIR" lleva al Detalle del mismo juego.
- [ ] El Salón muestra podio (02, 01, 03), tabla de 12 filas y una pestaña por juego; cambiar de pestaña cambia los datos.
- [ ] La fila "TU MEJOR MARCA" aparece en el Salón solo con sesión iniciada.
- [ ] Enviar el formulario de Auth guarda `arcade-vault:user` con el nombre en mayúsculas (máximo 10 caracteres) y el Nav lo muestra; "Cerrar sesión" lo elimina.
- [ ] La pestaña "CREAR CUENTA" muestra el campo de correo; "INICIAR SESIÓN" lo oculta.
- [ ] Los botones Google y GitHub no navegan ni producen errores.
- [ ] En ancho móvil (≤ 768 px) aparece el botón hamburguesa y abre/cierra el panel lateral al pulsarlo y al pulsar el backdrop.
- [ ] El enlace activo del Nav corresponde a la ruta actual ("Biblioteca" también activo en detalle y reproductor).
- [ ] Recargar con sesión iniciada no produce advertencias de hidratación en la consola.
- [ ] No quedan archivos `.jsx`, Babel, ni variables globales en `window` en el código nuevo.

---

## Decisiones tomadas y descartadas

- **Sí:** rutas reales del App Router. URLs compartibles y aprovecha Server Components. **No:** SPA de una sola página con estado de ruta, porque desaprovecha Next y rompe el botón "atrás".
- **Sí:** rutas, archivos y código en inglés (`/games`, `/hall-of-fame`, `GameCard`); la UI sigue en español. Decisión del usuario. **No:** rutas en español.
- **Sí:** `id` y `title` de los juegos en inglés (`BRICK BUSTER`, `BLOCK FALL`, `SERPENTINE`, `GLUTTON`, `INVADERS`, `ROCKS`, `FROG CROSSING`, `PIXEL DUEL`), como excepción a la regla de UI en español. Decisión del usuario: suenan más adecuados como nombres de juego arcade. **No:** traducir también las descripciones.
- **Sí:** nombres descriptivos sin abreviaturas (`shortDescription`, no `short`). **No:** portar los nombres abreviados de las plantillas.
- **Sí:** sesión simulada con context y `localStorage`. Permite revisar los estados con sesión e invitado. **No:** Auth solo visual, porque se pierden estados de Nav y Salón.
- **Sí:** reproductor simulado con modal de fin de juego, como la plantilla. **No:** pantalla estática ni juego real; la lógica de juego va en otra spec.
- **Sí:** guardar la puntuación en `localStorage` aunque nadie la lea todavía. Deja listo el punto de integración. **No:** conectarla al Detalle o Salón en esta spec.
- **Sí:** datos mock tipados en `lib/*.ts`. Se reemplazan por una API o base de datos más adelante. **No:** JSON suelto.
- **Sí:** reemplazar el hero de `app/page.tsx` por la Biblioteca, porque la plantilla ya incluye ese hero. **No:** mantener una home aparte.
- **Sí:** claves de `localStorage` con prefijo `arcade-vault:` y versión en las puntuaciones. **No:** reutilizar `av_user` y `av_scores` de la plantilla.
- **No:** footer global y créditos dinámicos (excluidos por el usuario / sin utilidad en un MVP visual).
- **Sí:** `generateStaticParams` con los 8 ids en las rutas dinámicas. `next.config.ts` tiene `cacheComponents: true` y la guía de Next lo indica para `params` conocidos en build. **No:** `<Suspense>` (es para datos de petición como cookies o `searchParams`) ni `instant = false` (bloquea la carga).
- **Sí:** ignorar `references/**` en ESLint, porque son plantillas JSX del navegador y no parte de la app.
- **Sí:** puntuaciones deterministas con semilla, igual que las plantillas, para que servidor y cliente coincidan.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Error de hidratación al leer `localStorage` durante el render | `AuthProvider` lee la sesión dentro de `useEffect` y arranca con `user = null`. |
| `localStorage` no disponible (modo privado) | Envolver lecturas y escrituras en `try/catch`; la app sigue funcionando sin persistir. |
| Cambios incompatibles de Next 16 (p. ej. `params` asíncrono) | Leer las guías de `node_modules/next/dist/docs/` antes de escribir las páginas. |
| Clases CSS de las plantillas ausentes en `globals.css` | El paso 9 compara contra la plantilla; añadir solo las clases que falten. |
| Nombres de clases CSS siguen abreviados (`av-`, `lb-row`) | Se conservan porque ya existen en `globals.css`; renombrarlos queda fuera de alcance. |

---

## Qué **no** entra en esta spec

- Ningún juego jugable ni bucle de juego real.
- Backend, base de datos y autenticación real (incluido OAuth con Google/GitHub).
- Lectura de puntuaciones guardadas en Detalle o Salón.
- Footer global y créditos dinámicos.
- Validación de formularios, SEO por página y pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
