# SPEC 12 — Skins de WALL BREAKER

> **Status:** Implementado
> **Depends on:** SPEC 08, SPEC 10, SPEC 11
> **Date:** 2026-11-22
> **Objective:** Ofrecer en WALL BREAKER cuatro skins visuales (`classic`, `neon`, `pixel-art` y la experimental `experimental`) elegibles con un selector dentro del juego y recordadas en `localStorage`, sin tocar la jugabilidad.

---

## Por qué existe esta spec

WALL BREAKER dibuja con una sola apariencia: los colores de los bloques, la paleta, la pelota y el fondo están escritos en `constants.ts`, `block.ts`, `paddle.ts`, `ball.ts` y `wall-breaker-engine.ts`. Esta spec reúne todo lo que se dibuja en un módulo de skins y añade cuatro apariencias nuevas. `classic` conserva exactamente los valores de hoy, así que por defecto no cambia nada.

Auditoría previa (2026-11-22): no existe módulo de skins, no hay selector ni persistencia, y quedan 18 usos de color o estilo de dibujo fuera de una skin (`BLOCK_FILL_COLORS`, `BLOCK_HIGHLIGHT_COLOR`, `PADDLE_COLOR`, `PADDLE_END_COLOR`, `BALL_COLOR` y el `#000` del fondo). El juego no dibuja texto en el canvas (el HUD es de React), así que no hay fuentes que mover.

**Este juego tiene 4 skins:** `classic`, `neon`, `pixel-art` y `experimental`. `experimental` la pidió el usuario expresamente; es solo visual y se documenta en Decisiones. `retro` existió en la primera versión y se retiró a petición del usuario (ver Decisiones).

Esta spec sigue el patrón de las SPEC 10 y 11 (`skins.ts`, `skin-selector.ts`, `skin-draw.ts`, `draw(context, skin)` en las entidades), con una petición del usuario: se añade la skin `experimental` (synthwave sunset), distinta de las experimentales de los demás juegos.

**Revisión (2026-11-22, SPEC 14):** el selector y la persistencia ya no son del motor. El Reproductor muestra un `<select class="skin-select">` global en su barra, lee y guarda `arcade-vault:skin:wall-breaker` con `shared/skins.ts` y llama a `setSkin(skinId)` del motor. `skin-selector.ts` y la lectura/escritura propias se eliminaron; `skins.ts` reexporta `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` desde `shared/skins.ts`. Los valores de las 4 skins y el concepto de `experimental` no cambian.

Las skins viven dentro de `src/lib/games/wall-breaker/`. `GamePlayer`, `GameCanvas`, `game-engine.ts`, `shared/`, `globals.css` y los demás juegos no se tocan.

---

## Alcance

**Dentro:**

- `skins.ts`: tipos `SkinId`, `WallBreakerSkin`, las cuatro skins; reexporta los ids y `DEFAULT_SKIN_ID` de `shared/skins.ts` (SPEC 14).
- `setSkin(skinId)` en el motor (SPEC 14); el selector y la persistencia son globales del Reproductor.
- `skin-draw.ts`: fondo (incluida la escena animada de `experimental`), cuerpo de bloque por patrón, brillo, ajuste a enteros.
- `block.ts`, `paddle.ts`, `ball.ts` y `wall-breaker-engine.ts` dibujan con la skin recibida; `constants.ts` conserva solo el tipo `BlockColor`.
- Selector global del Reproductor con "Clásico", "Neón", "Pixel art", "Experimental" (SPEC 14); el motor ya no crea DOM.
- Persistencia con la clave `arcade-vault:skin:wall-breaker` gestionada por el Reproductor (un valor guardado `retro` cae a `classic`).

**Fuera de alcance:**

- Cambios en puntuación, vidas, nivel, `GameSnapshot`, leaderboard, pausa, controles, colisiones, física, niveles o velocidad de la pelota.
- Cambios en `GamePlayer`, `GameCanvas`, `game-engine.ts`, `engine-registry.ts`, `shared/`, `globals.css`, `GAMES` y Supabase.
- Skins para otros juegos, sonido, imágenes externas, fuentes nuevas.
- Reestilizar el HUD de React o el modal de fin de partida.
- Pruebas automatizadas.

---

## Modelo de datos

```ts
// src/lib/games/wall-breaker/skins.ts
export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_STORAGE_KEY = "arcade-vault:skin:wall-breaker";

export type BlockPattern = "solid" | "outline";
export type BallShape = "circle" | "square";

export type SynthwaveScene = {
  horizonYPixels: number;
  skyStops: readonly (readonly [number, string])[];  // gradient offsets 0..1 from the top to the horizon
  sunRadiusPixels: number;
  sunTopColor: string;
  sunBottomColor: string;
  sunBandColor: string;                              // cut-out bands of the sun
  floorTopColor: string;
  floorBottomColor: string;
  gridColor: string;
  gridScrollCyclesPerSecond: number;
};

export type WallBreakerSkin = {
  id: SkinId;
  label: string;                                     // Spanish label shown in the selector
  backgroundColor: string;
  scene: SynthwaveScene | null;
  blockColors: Readonly<Record<BlockColor, string>>; // red, yellow, cyan, magenta, hotpink, green, gray
  blockPatterns: Readonly<Record<BlockColor, BlockPattern>>;
  blockInsetPixels: number;
  blockHighlightColor: string;  blockHighlightHeightPixels: number;   // 0 = none
  blockShadeColor: string;      blockShadeHeightPixels: number;       // 0 = none
  blockOutlineWidthPixels: number;  blockOutlineFillAlpha: number;    // "outline" blocks
  paddleColor: string;  paddleEndColor: string;  paddleEndWidthPixels: number;
  ballColor: string;  ballShape: BallShape;
  ballOutlineColor: string | null;  ballOutlineWidthPixels: number;
  glowBlurPixels: number;                            // paddle and ball; 0 = no glow
  blockGlowBlurPixels: number;                       // blocks; 0 = no glow
  isPixelated: boolean;                              // imageSmoothingEnabled = false, integer coordinates
};

export const SKINS: Readonly<Record<SkinId, WallBreakerSkin>>;
export function isSkinId(value: unknown): value is SkinId;
export function readStoredSkinId(): SkinId;          // try/catch, "classic" if empty, invalid or unavailable
export function writeStoredSkinId(skinId: SkinId): void; // try/catch, silent on failure
```

Valores de las skins (todas las claves de `WallBreakerSkin`):

| Campo | classic | neon | pixel-art | experimental |
| --- | --- | --- | --- | --- |
| `label` | Clásico | Neón | Pixel art | Experimental |
| `backgroundColor` | `#000` | `#05020d` | `#14122b` | `#0d0221` |
| `scene` | `null` | `null` | `null` | sunset (ver abajo) |
| `blockColors.red` | `#d83a4a` | `#ff006e` | `#ff5964` | `#ff3d6e` |
| `.yellow` | `#e8b830` | `#f5ff00` | `#ffd23f` | `#ffe45e` |
| `.cyan` | `#3aa8e0` | `#00f5ff` | `#41d6f5` | `#2ff3ff` |
| `.magenta` | `#7a4ee0` | `#d400ff` | `#b45cff` | `#b26bff` |
| `.hotpink` | `#e05aa0` | `#ff4fd8` | `#ff9f43` | `#ff4fd8` |
| `.green` | `#3cc08a` | `#39ff14` | `#5be37d` | `#4dffb0` |
| `.gray` | `#6a6a7a` | `#9aa0c8` | `#d8d8f0` | `#c9c3e8` |
| `blockPatterns` | todos `solid` | todos `outline` | todos `solid` | todos `solid` |
| `blockInsetPixels` | 1 | 2 | 2 | 1 |
| `blockHighlightColor` / alto | `rgba(255,255,255,0.25)` / 3 | transparente / 0 | `rgba(255,255,255,0.35)` / 4 | `rgba(255,255,255,0.4)` / 5 |
| `blockShadeColor` / alto | transparente / 0 | transparente / 0 | `rgba(0,0,0,0.30)` / 4 | `rgba(13,2,33,0.35)` / 4 |
| `blockOutlineWidthPixels` | 2 | 2 | 4 | 2 |
| `blockOutlineFillAlpha` | 0.2 | 0.22 | 0.2 | 0.2 |
| `paddleColor` | `#d8d8e0` | `#00f5ff` | `#f4f4f4` | `#2ff3ff` |
| `paddleEndColor` | `#d83a4a` | `#ff006e` | `#ff5964` | `#ff4fd8` |
| `paddleEndWidthPixels` | 6 | 6 | 8 | 6 |
| `ballColor` | `#e0e0e8` | `#f5ff00` | `#ffd23f` | `#ffffff` |
| `ballShape` | circle | circle | square | circle |
| `ballOutlineColor` / ancho | `null` / 0 | `null` / 0 | `null` / 0 | `#0d0221` / 2 |
| `glowBlurPixels` | 0 | 12 | 0 | 12 |
| `blockGlowBlurPixels` | 0 | 8 | 0 | 8 |
| `isPixelated` | false | false | true | false |

Escena de `experimental` (`SynthwaveScene`): `horizonYPixels` 400; `skyStops` `[0, #0d0221]`, `[0.4, #2b0a52]`, `[0.67, #9a1f86]`; `sunRadiusPixels` 120; `sunTopColor` `#ffe45e`; `sunBottomColor` `#ff2a8a`; `sunBandColor` `#8a1d84`; `floorTopColor` `#1a0536`; `floorBottomColor` `#3a0a5c`; `gridColor` `#ff2fd0`; `gridScrollCyclesPerSecond` 0.35.

**Obsoleto (SPEC 14):** el selector ya no lo crea el motor; ahora es el `<select class="skin-select">` global del Reproductor. Descripción original: misma firma y convenciones que en las SPEC 10 y 11: un `<label>` "Skin" con un `<select>` (`aria-label="Skin"`, valores = `SkinId`, textos = `label`, las 4 opciones), estilo en línea con `var(--pixel)`, `var(--ink-dim)`, `var(--bg-2)`, `var(--cyan)` y `var(--line)`. Posición: esquina superior derecha (`right: 10px; top: 10px; z-index: 4`), porque la paleta se mueve por la parte inferior y los bloques empiezan en y = 80. En `change` llama a `onSkinChange` y después a `blur()`. No registra ninguna tecla; no usa `P` ni `Escape`.

Las entidades pasan a recibir la skin: `draw(context, skin)` en `Block`, `Explosion`, `Paddle` y `Ball`. El motor guarda un reloj visual (`clockSeconds`, de la marca de tiempo de `requestAnimationFrame`) que solo usa el fondo animado; no interviene en la física.

---

## Disposición del dibujo

Geometría, colisiones y jugabilidad no cambian. Orden: fondo (y escena), bloques vivos, explosiones, paleta, pelota.

- **classic:** idéntico al de hoy: fondo negro, bloques planos con franja clara de 3 px, paleta gris con extremos rojos, pelota gris claro.
- **neon:** fondo casi negro; cada bloque es un contorno de 2 px de su color con relleno al 22 % y brillo `shadowBlur` de 8 px; paleta cian con extremos magenta y pelota amarilla con brillo de 12 px.
- **pixel-art:** `imageSmoothingEnabled = false`; coordenadas enteras. Bloques con margen de 2 px, franja clara de 4 px arriba y sombra de 4 px abajo; paleta con extremos de 8 px; pelota cuadrada de 16 px. No hay texto en el canvas, así que `Press Start 2P` no se usa en el dibujo (el selector sí usa la fuente de la app).
- **experimental (sunset synthwave):** ver Decisión. Cielo en degradado morado a magenta, sol de 120 px de radio con 5 bandas recortadas que engrosan hacia el horizonte (y = 400), suelo con rejilla en perspectiva cuyas líneas horizontales avanzan hacia el jugador (0.35 ciclos por segundo). Bloques sólidos con brillo de 8 px, franja clara de 5 px y sombra de 4 px; paleta cian con extremos rosa; pelota blanca con borde oscuro de 2 px para que se lea sobre el sol.
- **Contraste:** en las cuatro skins bloques, paleta y pelota contrastan con el fondo y entre sí; los bloques (y 80 a 224) nunca se solapan con el sol (empieza en y = 280) y la rejilla se dibuja con opacidad baja y detrás de todo.

---

## Plan de implementación

1. **Módulo de skins.** Crear `skins.ts` con tipos y las cuatro skins (la persistencia es global, SPEC 14). La app sigue igual: nadie lo usa aún.
2. **Dibujo con skin.** Crear `skin-draw.ts`; cambiar `draw` de `Block`, `Explosion`, `Paddle`, `Ball` y del motor; quitar los colores de `constants.ts`. El motor usa `SKINS[skinId]` con `classic`: se ve igual que antes.
3. **Selector y persistencia.** El motor implementa `setSkin(skinId)` (empieza en `DEFAULT_SKIN_ID`, no lee `localStorage` ni crea el `<select>`); el bucle redibuja cada cuadro, también en pausa y tras el fin de partida, así que el cambio se ve al instante. Cambiar de skin no reinicia la partida.

Verificación al final: `npx tsc --noEmit` y `npm run lint`.

---

## Criterios de aceptación

- [ ] Con `localStorage` vacío, `/games/wall-breaker/play` se ve idéntico a antes (skin `classic`).
- [ ] El `<select>` global "Skin" del Reproductor lista "Clásico", "Neón", "Pixel art" y "Experimental".
- [ ] Cambiar de skin repinta al instante sin reiniciar la partida; puntuación, vidas, nivel, bloques restantes y posición de pelota y paleta no cambian.
- [ ] Tras elegir una skin y recargar, se conserva (los 4 ids). Con un valor inválido o con `localStorage` bloqueado se usa `classic` sin errores.
- [ ] Tras cambiar de skin con el ratón, las flechas siguen moviendo la paleta; `P` y `Esc` siguen pausando.
- [ ] Un valor guardado `retro` (de una versión anterior) se trata como inválido y se usa `classic`; no queda código de `retro` ni de líneas de exploración.
- [ ] `experimental` muestra el atardecer con sol y rejilla animada, sin bajada de fluidez apreciable.
- [ ] En las cuatro skins se ven bloques, paleta y pelota.
- [ ] El motor no crea ningún `<select>`; `wall-breaker` figura en `skin-registry.ts`.
- [ ] No queda ningún color ni estilo de dibujo fuera de `skins.ts` y `skin-draw.ts` en la carpeta del juego.
- [ ] `npx tsc --noEmit` y `npm run lint` terminan sin errores propios.
- [ ] Ningún otro juego ni archivo fuera de `src/lib/games/wall-breaker/` y esta spec cambia.

---

## Decisiones tomadas y descartadas

- **Sí:** la spec queda `Aprobado` (y luego `Implementado`) porque el usuario invocó al agente para este juego; esa invocación es la aprobación.
- **Sí:** 4 skins en este juego (`classic`, `neon`, `pixel-art`, `experimental`). El selector las lista todas y la persistencia acepta los 4 ids con respaldo a `classic`.
- **Sí:** retirar `retro` por petición del usuario (2026-11-22), que fijó el conjunto en 4 skins. Se eliminan su id, opción, paleta azul hielo, los patrones de bloque `stripes` y `dots` y las líneas de exploración (`scanlines`, `drawScanlines`), que solo la servían. Un `retro` guardado en `localStorage` cae a `classic`. `experimental` (synthwave sunset) se mantiene tal cual.
- **Sí:** `classic` conserva los valores actuales. **No:** retocar sus colores.
- **Sí:** `experimental` = sunset synthwave (cielo en degradado, sol con bandas, suelo con rejilla en perspectiva animada). **No:** glitch/holográfico, que obligaría a desplazar el canvas por franjas y a veces ocultaría bloques; **No:** partículas ni estelas nuevas, para no gastar rendimiento. Coste por cuadro: 3 degradados, un arco y unas 27 líneas.
- **Sí:** el reloj de la animación sale de la marca de `requestAnimationFrame` y no entra en la lógica. En pausa el fondo sigue moviéndose; es solo decorativo.
- **Sí:** el brillo (`shadowBlur`) se activa y se apaga en cada elemento; solo bloques, paleta y pelota.
- **Sí:** el selector va en la barra del Reproductor (SPEC 14), por lo que ya no tapa el canvas.
- **Sí:** `blur()` tras cambiar. **No:** asignar teclas; `P` y `Esc` son del Reproductor.
- **Sí:** clave `arcade-vault:skin:wall-breaker`, con `try/catch`, gestionada por `shared/skins.ts` y el Reproductor. **No:** leer durante el render.
- **Sí (2026-11-22, SPEC 14):** migrar a la infraestructura global: `skins.ts` reexporta ids de `shared/skins.ts` y usa `SKIN_LABELS` y `SKIN_BASE_TOKENS` (fondo y brillo de neon, fondo de pixel-art); el motor implementa `setSkin`, y se borra `skin-selector.ts`. El valor de cada skin no cambia. No hizo falta redibujar en `setSkin`: el bucle pinta siempre.
- **Sí:** el juego no dibuja texto, así que no hay campos de fuente en la skin.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un `<select>` enfocado captura las flechas | `blur()` en `change`; `KeyboardInput` ya hace `preventDefault` en las teclas del juego. |
| `shadowBlur` en hasta 60 bloques por cuadro | Radios pequeños (8 px y 4 px) y sin brillo en las explosiones. |
| La escena de `experimental` cuesta por cuadro | Sin imágenes ni sombras; unas 27 líneas y 3 degradados. |
| Pelota poco visible sobre el sol | Borde oscuro de 2 px y bloques fuera de la zona del sol. |
| `localStorage` bloqueado o con valor inválido | `try/catch` y respaldo a `classic`. |
| Selector duplicado al reiniciar o con Strict Mode | Se crea en `start()` solo si no existe y se retira en `destroy()`. |

---

## Qué **no** entra en esta spec

- Cambios de jugabilidad, puntuación, `GameSnapshot` o leaderboard.
- Skins de otros juegos.
- Imágenes, sonido o fuentes nuevas.
- Reestilizar el HUD de React o los modales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
