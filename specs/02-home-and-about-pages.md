# SPEC 02 — Home en `/`, Acerca de en `/about` y Biblioteca en `/games`

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-11-16
> **Objective:** Reemplazar la ruta `/` por la landing de `references/templates/home-about/`, mover la Biblioteca actual a `/games` y añadir la página Acerca de en `/about`, siguiendo las convenciones de la SPEC 01.

---

## Por qué existe esta spec

La SPEC 01 dejó la Biblioteca en `/` porque la plantilla de entonces no traía landing. La carpeta `references/templates/home-about/` añade dos pantallas nuevas (Home y Acerca de) y un Nav de cuatro enlaces (Inicio, Biblioteca, Salón de la Fama, Acerca de). Eso obliga a liberar `/` y a reubicar la Biblioteca en `/games`, junto a `/games/[id]` y `/games/[id]/play`. Como en la SPEC 01, las plantillas son JSX con Babel y navegación por estado, así que se **portan** a Next, no se copian.

---

## Alcance

**Dentro:**

- Rutas del App Router:
  - `/` — Home (landing). Reemplaza el contenido actual de `app/page.tsx`.
  - `/games` — Biblioteca (el componente `Library` actual, sin cambios visuales).
  - `/about` — Acerca de, con formulario de contacto.
- Home con las secciones de la plantilla: hero con siluetas flotantes, "¿Por qué Arcade Vault?", juegos disponibles (mini tarjetas), estadísticas, actividad en vivo (últimas puntuaciones y top jugadores), precios con FAQ y CTA final.
- Acerca de con las secciones de la plantilla: misión, tres destacados, divisor animado y contacto.
- Formulario de contacto simulado: valida que los tres campos tengan texto (sacudida si falta alguno) y, si es válido, muestra la terminal de éxito con el nombre en mayúsculas y el botón "ENVIAR OTRO MENSAJE". No envía ni guarda nada.
- Animación de aparición al hacer scroll (`.reveal` → `.in`) con un hook reutilizable basado en `IntersectionObserver`.
- Nav de cuatro enlaces en escritorio y panel móvil: Inicio → `/` (activo solo en `/`), Biblioteca → `/games` (activo en `/games` y subrutas), Salón de la Fama → `/hall-of-fame`, Acerca de → `/about`.
- Reapuntar a `/games` todo enlace o redirección que hoy espera la Biblioteca en `/`: "VOLVER AL VAULT" del Detalle, "SALIR" del Reproductor, botón del Salón, cierre de sesión en el panel móvil y las dos redirecciones de Auth (enviar formulario y "Jugar como invitado"). El logo y "Inicio" siguen apuntando a `/`.
- Datos simulados tipados en `lib/home.ts` (actividad reciente, top jugadores, estadísticas, características, planes y FAQ). Las actividades usan los títulos reales de `GAMES`; las mini tarjetas salen de `GAMES.slice(0, 6)`.
- Portar a `app/globals.css` solo las clases que falten de la plantilla (bloques HOME, ABOUT, ACTIVITY y PRICING, `.reveal`, `.btn.press`, `.terminal-success`, textarea del contacto).
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Envío real del formulario de contacto (backend, correo, API route) y persistencia del mensaje.
- Datos reales para actividad, top jugadores y estadísticas; leer puntuaciones de `localStorage` en la Home.
- Pasarela de pagos o planes reales (la sección de precios es informativa).
- Contador de créditos dinámico y footer global (siguen excluidos, como en la SPEC 01).
- Metadatos SEO por página y pruebas automatizadas.
- Redirecciones permanentes de la antigua Biblioteca (`/`) a `/games` (no hay URLs públicas que preservar).
- Cambios en la lógica de los juegos, Auth, Detalle, Reproductor o Salón más allá de los enlaces mencionados.

---

## Modelo de datos

```ts
// lib/home.ts
import type { GameAccentColor } from "@/lib/games";

export type FeatureIconKind = "gamepad" | "free" | "trophy" | "rocket";
export type HighlightIconKind = "heart" | "browser" | "plant"; // used by /about

export type HomeFeature = {
  icon: FeatureIconKind;
  title: string;
  description: string;
  accentColor: GameAccentColor;
};

export type HomeStat = { value: string; unit: string; caption: string };

export type RecentScore = {
  playerName: string;
  gameId: string;          // resolved with findGameById to show the game title
  score: number;
  timeAgoLabel: string;    // already formatted, e.g. "hace 2 min"
  accentColor: GameAccentColor;
};

export type TopPlayer = { rank: number; playerName: string; score: number };

export type PricingFaqItem = { question: string; answer: string };

export const HOME_FEATURES: HomeFeature[];
export const HOME_STATS: HomeStat[];
export const RECENT_SCORES: RecentScore[];   // 7 rows
export const TOP_PLAYERS_TODAY: TopPlayer[]; // 5 rows
export const PRICING_INCLUDED_BENEFITS: string[];
export const PRICING_FAQ: PricingFaqItem[];  // 3 items
```

Convenciones:

- Los campos pasan de abreviados (`i`, `t`, `d`, `c`, `p`, `g`, `s`) a descriptivos, igual que en la SPEC 01.
- `RECENT_SCORES` referencia juegos por `gameId` (ids reales de `GAMES`) en lugar de repetir nombres en español de la plantilla.
- Números con `toLocaleString("es-ES")`.
- Sin `Math.random` ni fechas dinámicas: todo es estático para evitar errores de hidratación.
- El estado del formulario de contacto (`name`, `email`, `message`) vive en el componente cliente; no es un tipo compartido.

---

## Plan de implementación

Antes de empezar: releer en `node_modules/next/dist/docs/01-app/01-getting-started/` las guías `03-layouts-and-pages.md`, `04-linking-and-navigating.md` y `05-server-and-client-components.md`, y revisar si `cacheComponents: true` afecta a páginas estáticas nuevas.

1. **Datos.** Crear `lib/home.ts` con los tipos y el contenido de `home.jsx`, usando ids reales de `GAMES`. Verificación: `npm run lint` y `npx tsc --noEmit` pasan.
2. **Estilos.** Portar a `app/globals.css` los bloques que falten de `references/templates/home-about/styles.css` (HOME PAGE, ABOUT PAGE, ACTIVITY, PRICING, `.reveal`, `.btn.press`, `.terminal-success`, textarea del contacto), respetando la indentación y el `@layer` que ya use el archivo, sin duplicar lo existente. Verificación: la app compila y las pantallas actuales no cambian visualmente.
3. **Mover la Biblioteca.** Crear `app/games/page.tsx` que renderiza `Library`. Verificación: `/games` se ve igual que antes `/`; `/games/block-fall` sigue funcionando.
4. **Nav y enlaces.** Actualizar `components/nav.tsx` a cuatro enlaces (escritorio y panel móvil) con estado activo según las reglas del alcance, y reapuntar a `/games` los enlaces y redirecciones listados: `app/games/[id]/page.tsx`, `components/game-player.tsx`, `components/hall-of-fame.tsx`, `components/auth-form.tsx` (dos `router.push`) y el enlace de cerrar sesión del Nav. Verificación: en `/games` y `/games/[id]` solo "Biblioteca" está activo; "Inicio" solo en `/`.
5. **Hook de reveal.** Crear `hooks/use-reveal.ts` (cliente) que observa los elementos `.reveal` dentro del componente y les añade `in` al entrar al viewport, limpiando el observador al desmontar. Verificación: compila y no afecta a otras pantallas.
6. **Home.** Crear `components/home-silhouettes.tsx`, `components/feature-icon.tsx` y `components/home-page.tsx` (cliente por el hook de reveal), portando el JSX de `home.jsx`. Reemplazar `app/page.tsx` para que renderice la Home. CTAs: "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS" y "INSERTAR MONEDA" → `/games`; "CREAR CUENTA" y "EMPEZAR GRATIS" → `/auth`; "VER SALÓN" → `/hall-of-fame`; mini tarjetas → `/games/[id]`. Verificación: `/` muestra todas las secciones y los enlaces navegan al destino correcto.
7. **Acerca de.** Crear `app/about/page.tsx`, `components/about-page.tsx` (cliente) y `components/highlight-icon.tsx`, portando `about.jsx` con el formulario simulado. Verificación: enviar vacío sacude el formulario; enviar con datos muestra la terminal con el nombre en mayúsculas; "ENVIAR OTRO MENSAJE" reinicia el formulario.
8. **Revisión final de paridad.** Comparar Home y Acerca de con `references/templates/home-about/arcade-vault-standalone.html` en escritorio y móvil y corregir diferencias de estructura. Ejecutar `npm run lint` y `npm run build`.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Existen las rutas `/`, `/games`, `/about`, `/games/[id]`, `/games/[id]/play`, `/hall-of-fame` y `/auth`, y cada una carga sin errores en la consola del navegador.
- [ ] `/` ya no muestra la Biblioteca: muestra el hero "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y las seis secciones de la Home.
- [ ] `/games` muestra las 8 tarjetas con el mismo comportamiento de la SPEC 01 (filtro "PUZZLE" deja solo "BLOCK FALL"; buscar "zzz" muestra "NO HAY RESULTADOS"; tilt al pasar el mouse).
- [ ] La Home muestra 4 tarjetas de características, 6 mini tarjetas de juego, 3 bloques de estadísticas, 7 filas de últimas puntuaciones, 5 filas de top jugadores, la tarjeta de precios con 3 preguntas frecuentes y el CTA final.
- [ ] Cada mini tarjeta lleva a `/games/[id]` del juego correcto y muestra su título real en inglés (p. ej. `BLOCK FALL`).
- [ ] Los CTAs de la Home llevan a `/games`, `/auth` o `/hall-of-fame` según lo indicado en el plan.
- [ ] Las secciones con `.reveal` aparecen al hacer scroll y no quedan invisibles tras cargar la página.
- [ ] El Nav muestra Inicio, Biblioteca, Salón de la Fama y Acerca de, en escritorio y en el panel móvil (≤ 768 px).
- [ ] "Inicio" está activo solo en `/`; "Biblioteca" en `/games`, `/games/[id]` y `/games/[id]/play`; "Salón de la Fama" en `/hall-of-fame`; "Acerca de" en `/about`.
- [ ] "VOLVER AL VAULT" (Detalle), "SALIR" (Reproductor), el botón del Salón, "Jugar como invitado", el envío del formulario de Auth y "Cerrar sesión" del panel móvil llevan a `/games`.
- [ ] El logo del Nav lleva a `/`.
- [ ] En `/about`, enviar con algún campo vacío sacude el formulario y no muestra la terminal; con los tres campos llenos muestra `MENSAJE RECIBIDO … GRACIAS, <NOMBRE EN MAYÚSCULAS>` y no realiza ninguna petición de red.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] Recargar `/`, `/games` y `/about` con sesión iniciada no produce advertencias de hidratación en la consola.
- [ ] No quedan archivos `.jsx`, Babel, ni variables globales en `window` en el código nuevo.
- [ ] Ninguna pantalla de la SPEC 01 cambia visualmente.

---

## Decisiones tomadas y descartadas

- **Sí:** Home en `/` y Acerca de en `/about` completas, tal como trae la carpeta. Decisión del usuario. **No:** solo Home, dejando Acerca de para otra spec.
- **Sí:** Biblioteca en `/games` (`app/games/page.tsx`), agrupada con el Detalle y el Reproductor. Decisión del usuario. **No:** mantenerla en `/` ni crear una ruta en español (`/biblioteca`), coherente con la decisión de rutas en inglés de la SPEC 01.
- **Sí:** Nav de cuatro enlaces como la plantilla; "Inicio" activo solo en `/` para que no coincida con "Biblioteca". **No:** dejar el Nav de dos enlaces.
- **Sí:** los "volver al vault" y las redirecciones de Auth van a `/games`, para no sacar al jugador de su flujo de juego. **No:** devolverlos a la landing (`/`), que obligaría a un clic extra para volver a jugar.
- **Sí:** datos de la Home tipados en `lib/home.ts`, con nombres descriptivos y actividades que referencian `GAMES` por `gameId`. Sigue la convención de `lib/*.ts` de la SPEC 01 y evita nombres de juego en español desalineados ("Caída", "Glotón"). **No:** arreglos pegados dentro del JSX.
- **Sí:** formulario de contacto simulado con la validación mínima de la plantilla (campos no vacíos). Es comportamiento de la plantilla y no requiere backend. **No:** validación avanzada ni envío real (fuera de alcance, como la validación de Auth en la SPEC 01).
- **Sí:** hook `useReveal` reutilizable en `hooks/`. La plantilla lo duplica en `home.jsx` y `about.jsx`. **No:** duplicar el `IntersectionObserver` en cada componente.
- **Sí:** portar solo las clases CSS que falten a `globals.css`. **No:** copiar `styles.css` completo (duplicaría el tema ya existente).
- **Sí:** anclar el indicador "DESLIZA" al fondo del hero (hijo directo de `.home-hero`, `bottom: 28px`, con más `padding` inferior en el hero). Decisión del usuario tras revisar la implementación: en la plantilla quedaba pegado a los botones. **No:** mantener su posición original (`bottom: -20px` dentro de `.home-hero-inner`).
- **Sí:** logo del Nav siempre en dos líneas (ARCADE / VAULT), `white-space: nowrap` en enlaces, créditos y botón de sesión, y menos espacio entre ítems (`gap` 16px, padding de enlaces 12px). Decisión del usuario: con 4 enlaces el Nav se partía en líneas en pantallas de ~1280px. **Sí:** el punto de corte de la hamburguesa sube de 840px a 1180px (el menú completo necesita ~1115px) y, a ≤480px, el botón de sesión puede envolver y los espacios se reducen para que la hamburguesa no se salga. **No:** dejar el corte en 840px, porque entre 841px y ~1115px el menú desbordaba.
- **Sí:** `proxy.ts` en la raíz con matcher `/games/:id` y `/games/:id/play`, que reescribe los ids inexistentes a una ruta no encontrada con estado 404. Con `cacheComponents`, `notFound()` dentro de la página corre tras enviar el shell y deja el estado en 200 (la doc de Next recomienda comprobar el slug en Proxy). Se mantiene `notFound()` en las páginas como respaldo. **No:** `dynamicParams = false`, que falla el build con `cacheComponents`.
- **Sí:** `minmax(0, 1fr)` en `.activity-grid` y `.contact-grid` a ≤900px, para que las columnas puedan encogerse y no desborden en móviles de 360px.
- **Sí:** mantener `Library` como componente cliente sin cambios; solo cambia dónde se monta. **No:** reescribirlo.
- **No:** footer global y créditos dinámicos (se mantienen fuera, como en la SPEC 01).

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Quedan enlaces a `/` que esperaban la Biblioteca | Buscar con `grep` `href="/"` y `router.push("/")` en `app/` y `components/` tras el paso 4; el criterio de aceptación lista todos los casos. |
| `.reveal` deja secciones invisibles si el observador falla o se ejecuta antes de montar | El hook corre en `useEffect` tras el montaje y desconecta al desmontar; verificar scroll en escritorio y móvil. |
| Clases CSS duplicadas o en conflicto con `globals.css` (p. ej. `@keyframes blink`, `pulse`, `fadeIn` ya existen) | Portar solo lo que falte y revisar cada bloque contra lo existente en el paso 2. |
| Cambios incompatibles de Next 16 (`cacheComponents`, `params` asíncrono) | Leer las guías de `node_modules/next/dist/docs/` antes de escribir las páginas. |
| `/games` colisiona con el segmento dinámico `/games/[id]` | No hay colisión (`app/games/page.tsx` convive con `app/games/[id]/`); verificar en el paso 3. |
| Nombres de clases CSS siguen abreviados (`ft-title`, `tk-p`, `pc-amount`) | Se conservan porque vienen del tema de la plantilla; renombrarlos queda fuera de alcance. |

---

## Qué **no** entra en esta spec

- Envío real del formulario de contacto, backend o API routes.
- Datos reales de actividad, ranking o estadísticas en la Home.
- Pagos o planes reales.
- Footer global, créditos dinámicos, SEO por página y pruebas automatizadas.
- Cambios en la lógica o el diseño de las pantallas de la SPEC 01.

Cada uno de estos puntos, si se aborda, va en su propia spec.
