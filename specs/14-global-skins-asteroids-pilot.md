# SPEC 14 — Skins globales (piloto en ASTEROIDS)

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 10, SPEC 11
> **Date:** 2026-11-22
> **Objective:** Mover a una base compartida la infraestructura de skins (ids, etiquetas, persistencia, selector y cableado con el player) y comprobar el diseño migrando solo ASTEROIDS, con un selector de skin en la barra del player que funciona en juego y en pausa.

---

## Por qué existe esta spec

Las SPEC 10–13 dejaron 4 juegos con las mismas 4 skins (`classic`, `neon`, `pixel-art`, `experimental`). El código común estaba copiado cuatro veces:

- `skin-selector.ts`: 37 líneas idénticas en los 4 juegos (solo cambiaba `bottom:10px` por `top:10px` en WALL BREAKER).
- `isSkinId`, `readStoredSkinId` y `writeStoredSkinId`: idénticas desde `isSkinId` hasta el final de cada `skins.ts`; solo cambiaba la clave de `localStorage`.
- `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` y el método `setUpSkinSelector()` de cada engine (~15 líneas).

Además, el selector flotaba sobre el canvas: en FRUIT SNAKE tapaba una casilla del tablero y, mientras se jugaba, el `<select>` competía con las flechas por el foco.

Esta spec fue un **piloto**: solo ASTEROIDS migró primero. BLOCK STACK, WALL BREAKER y FRUIT SNAKE migraron después con el mismo patrón (se actualizaron sus specs 10, 12 y 13).

Lo que se comparte es solo lo que es idéntico. Cada juego conserva su tipo de skin (`AsteroidsSkin`, etc.), su `skin-draw.ts` y su skin `experimental`, que debe ser única por juego.

Revisión (2026-11-22, a petición del usuario, tras probar el piloto): se retira de la página de detalle el selector con muestras de color y el selector del player pasa a ser un `<select>` sin etiqueta "Skin", con estilo propio y siempre habilitado (en juego y en pausa).

---

## Alcance

**Dentro:**

- `src/lib/games/shared/skins.ts` (nuevo): `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID`, `SKIN_LABELS`, `isSkinId`, `readStoredSkinId(gameId)`, `writeStoredSkinId(gameId, skinId)` y `SKIN_BASE_TOKENS`.
- `src/lib/games/skin-registry.ts` (nuevo): qué juegos usan el selector global (`hasGlobalSkins`).
- `src/lib/use-stored-skin.ts` (nuevo): hook cliente que lee y escribe la skin guardada de un juego.
- `src/lib/games/game-engine.ts`: método opcional `setSkin?(skinId)` en `GameEngine`.
- `src/components/game-canvas.tsx`: prop `skinId`; llama a `setSkin` al cambiar, sin recrear el engine.
- `src/components/game-player.tsx`: `<select>` de skin en la barra del player, fuera del canvas.
- `src/app/globals.css`: clase `.skin-select` en `@layer components`.
- `src/lib/games/asteroids/`: `skins.ts` usa el módulo compartido, el engine implementa `setSkin`, se borran `skin-selector.ts` y `setUpSkinSelector()`.

**Fuera de alcance:**

- Migrar BLOCK STACK, WALL BREAKER y FRUIT SNAKE (spec posterior).
- Cambiar los tipos de skin por juego, sus `skin-draw.ts`, las paletas o las skins `experimental`.
- Mover `snapToGrid`, `resolveFont` u otros helpers de dibujo: solo están verificados en ASTEROIDS, así que quedan donde están.
- Selector en la página de detalle (probado y retirado), miniaturas por skin, cambios en las portadas de las tarjetas, efecto CRT opcional.
- Cambios en jugabilidad, `GameSnapshot`, leaderboard, Supabase y pausa (`P`/`Esc`).
- Pruebas automatizadas (el proyecto no tiene framework).

---

## Modelo de datos

```ts
// src/lib/games/shared/skins.ts
export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_LABELS: Readonly<Record<SkinId, string>> = {
  classic: "Clásico",
  neon: "Neón",
  "pixel-art": "Pixel art",
  experimental: "Experimental",
};

export function skinStorageKey(gameId: string): string; // "arcade-vault:skin:" + gameId
export function isSkinId(value: unknown): value is SkinId;
export function readStoredSkinId(gameId: string): SkinId; // try/catch, fallback DEFAULT_SKIN_ID
export function writeStoredSkinId(gameId: string, skinId: SkinId): void; // try/catch, silent on failure

// Only values that are identical in the 4 games today.
export const SKIN_BASE_TOKENS = {
  neon: { backgroundColor: "#05020d", glowBlurPixels: 12 },
  "pixel-art": { backgroundColor: "#14122b", fontCssVariable: "--font-press-start" },
} as const;
```

```ts
// src/lib/games/game-engine.ts
export type GameEngine = {
  // ...existing members
  // Optional: engines without it handle their own skin. Changing the skin only affects
  // drawing, never score, lives, level or game logic.
  setSkin?: (skinId: SkinId) => void;
};
```

```ts
// src/lib/games/skin-registry.ts (one id per line)
export function hasGlobalSkins(gameId: string): boolean; // true for "asteroids"
```

```ts
// src/lib/use-stored-skin.ts ("use client")
export function useStoredSkin(gameId: string): {
  skinId: SkinId;                         // DEFAULT_SKIN_ID until the client has read storage
  setSkinId: (skinId: SkinId) => void;    // writes storage and updates every subscriber
  isReady: boolean;                       // false on the server and during hydration
};
```

Implementación del hook: `useSyncExternalStore` con `getServerSnapshot` que devuelve `DEFAULT_SKIN_ID`, suscripción al evento `storage` y a un evento propio `arcade-vault:skin-change` que `setSkinId` emite tras escribir. `isReady` sale de un segundo `useSyncExternalStore` (`() => true` en cliente, `() => false` en servidor).

---

## Disposición de la interfaz

**Player (`GamePlayer`):** dentro de `.hud-actions`, antes del botón PAUSA, solo si `hasGlobalSkins(gameId)`:

```
[ Experimental ⌄ ]   [PAUSA] [FIN] [SALIR]
```

- `<select class="skin-select" aria-label="Skin">` sin etiqueta visible, con las opciones de `SKIN_LABELS` en el orden de `SKIN_IDS`.
- Siempre habilitado: se puede cambiar en juego y en pausa.
- Al cambiar: `setSkinId(valor)` y `blur()` para devolver el teclado al juego.
- `GameCanvas` se monta solo cuando `isReady` es `true` si el juego usa skins globales, para que la primera imagen use ya la skin guardada.
- Con el modal de fin de partida abierto el selector queda detrás del fondo (no se cambia skin en game over).

**Estilos (`globals.css`, `@layer components`), clase `.skin-select`:** `appearance: none`, fondo `var(--bg-2)` con una flecha SVG cian a la derecha, `color: var(--cyan)`, borde `1px solid var(--line)`, fuente `var(--pixel)` de 9 px en mayúsculas con `letter-spacing: 0.08em`, `padding: 11px 32px 11px 14px`. En `:hover` y `:focus-visible`: `border-color: var(--cyan)` y `box-shadow: 0 0 8px rgba(0, 245, 255, 0.35)`.

---

## Plan de implementación

1. **Módulo compartido.** Crear `shared/skins.ts` con el contenido del modelo de datos.
2. **ASTEROIDS usa el módulo compartido.** `asteroids/skins.ts` importa y reexporta lo común, usa `SKIN_BASE_TOKENS` y `SKIN_LABELS`, y borra sus copias de `readStoredSkinId` y `writeStoredSkinId`.
3. **Registro y hook.** Crear `skin-registry.ts` y `use-stored-skin.ts`.
4. **Contrato y canvas.** Añadir `setSkin?` a `GameEngine`; `GameCanvas` recibe `skinId` y llama a `setSkin` en un efecto declarado después del que crea el engine; el engine de ASTEROIDS implementa `setSkin`; `GamePlayer` usa `useStoredSkin` y monta el canvas solo con `isReady`.
5. **Selector del player.** Añadir el `<select>` en `.hud-actions` y `.skin-select` en `globals.css`.
6. **Quitar el selector interno de ASTEROIDS.** Borrar `skin-selector.ts`, `setUpSkinSelector()` y sus llamadas; el engine ya no lee `localStorage`.
7. **Cierre.** Marcar la spec como `Implementado`.

---

## Criterios de aceptación

**Infraestructura**

- [x] Existe `shared/skins.ts` con las exportaciones del modelo de datos, y `readStoredSkinId`/`writeStoredSkinId` usan la clave `arcade-vault:skin:<gameId>`.
- [x] Con `localStorage` bloqueado o con un valor inválido (incluido `retro`), `readStoredSkinId` devuelve `classic` sin lanzar errores.
- [x] `GameEngine.setSkin` es opcional: los juegos aún no migrados compilan y funcionan sin tocarlos.
- [x] En `src/lib/games/asteroids/` no queda `skin-selector.ts`, ni `setUpSkinSelector`, ni acceso directo a `localStorage`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.

**Player**

- [x] En `/games/asteroids/play` la barra del player muestra el `<select>` con Clásico, Neón, Pixel art y Experimental, fuera del canvas y sin etiqueta "Skin".
- [ ] El `<select>` funciona en juego y en pausa; el canvas se redibuja de inmediato y la partida no se reinicia (puntuación, vidas, nivel y posiciones no cambian).
- [ ] Tras cambiar de skin, las flechas y el disparo siguen controlando la nave.
- [ ] La skin elegida persiste al recargar y al pulsar "JUGAR DE NUEVO".
- [ ] Los juegos no migrados no muestran el `<select>` del player y siguen con el suyo dentro del canvas.
- [ ] La primera imagen del canvas de ASTEROIDS ya usa la skin guardada.

**Detalle**

- [x] `/games/asteroids` no muestra ningún selector de skin y su portada no cambia.

---

## Decisiones tomadas y descartadas

**Decisión (a petición del usuario, 2026-11-22):** hacerlo primero como piloto en ASTEROIDS y replicarlo después. Descartada la migración completa: si el diseño falla, se rehace una sola carpeta.

**Decisión: infraestructura compartida, dibujo por juego.** Se extrae solo lo idéntico en los 4 juegos (selector, ids, persistencia, cableado) y dos tokens base. Descartado un tipo de skin común (los campos por entidad difieren) y extraer `skin-draw.ts` (las escenas `experimental` son únicas por diseño).

**Decisión: `setSkin?` opcional en el contrato.** Permite migrar juego a juego sin romper a los demás.

**Decisión (a petición del usuario, tras probar): selector en el player, sin etiqueta, siempre habilitado.** Se probó un `<select>` con etiqueta "Skin" activo solo en pausa; se descartó por verse recargado y por impedir cambiar de skin durante la partida. Sigue fuera del canvas, así que no tapa casillas ni compite por el foco al elegir (se hace `blur()` tras cambiar).

**Decisión (a petición del usuario, tras probar): sin selector en la página de detalle.** Se probó un selector con muestras de color antes de jugar; se retiró porque no aportaba y el del player basta. Por eso el registro pasó de guardar muestras de color a `hasGlobalSkins(gameId)`.

**Decisión: registro separado del registro de engines.** `skin-registry.ts` no importa engines. Descartado derivar el soporte de `GAME_ENGINE_FACTORIES`: esa lista incluye juegos que aún no migran.

**Decisión: `useSyncExternalStore` para leer la skin guardada.** Mantiene estable la hidratación y sincroniza pestañas. Descartado `useState` más `useEffect`: dejaría un cuadro con la skin equivocada.

**Decisión: la misma clave de `localStorage` que los demás juegos.** El formato `arcade-vault:skin:<gameId>` no cambia, así que la elección guardada se conserva.

**Decisión: la guía `.md`, `/add-game` y `skin-designer` se actualizan fuera de esta spec,** una vez probado el piloto (hecho: `.claude/skills/add-game/skins-guide.md`).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Next mantiene viva una página oculta y recrea el engine al volver. | El engine recibe la skin por `setSkin` al montar, así que la recreación toma la skin vigente del hook. |
| La skin solo se redibuja al instante porque el bucle de ASTEROIDS pinta cada cuadro, también en pausa; otros engines podrían no hacerlo. | Cada migración exige que `setSkin` redibuje si el bucle no corre (ver `skins-guide.md`). |
| Con el `<select>` abierto durante la partida, las flechas actúan sobre el desplegable hasta elegir o cerrar. | Se hace `blur()` al elegir una opción; es un límite aceptado. |
| Doble origen de la skin mientras convivan juegos migrados y sin migrar. | Solo los juegos de `skin-registry.ts` muestran el selector del player. |

---

## Qué no entra

- Migrar BLOCK STACK, WALL BREAKER y FRUIT SNAKE.
- Mover helpers de dibujo a `shared/`.
- Selector en el modal de fin de partida o en la página de detalle.
- Miniaturas de skin y efecto CRT opcional.
- Nuevas skins o cambios de paleta.
