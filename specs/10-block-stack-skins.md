# SPEC 10 — Skins de BLOCK STACK

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 07
> **Date:** 2026-11-22
> **Objective:** Ofrecer en BLOCK STACK cuatro skins visuales (`classic`, `neon`, `pixel-art`, `experimental`) elegibles con un selector dentro del juego y recordadas en `localStorage`, sin tocar la jugabilidad.

---

## Por qué existe esta spec

BLOCK STACK dibuja con una sola apariencia: los colores y la fuente están repartidos entre `constants.ts` y `block-stack-renderer.ts` (más el `#000` del fondo, escrito en el renderer). Esta spec reúne todo lo que se dibuja en un módulo de skins y añade tres apariencias nuevas (`neon`, `pixel-art` y `experimental`). La skin `classic` conserva exactamente los valores de hoy, así que por defecto no cambia nada.

Auditoría previa (2026-11-22): no existe módulo de skins, no hay selector ni persistencia, y quedan 28 usos de color, fuente o estilo de dibujo fuera de una skin (14 en `constants.ts`, 14 en `block-stack-renderer.ts`).

**Revisión 2026-11-22 (SPEC 14):** el selector y la persistencia de esta spec se migraron a la infraestructura global de skins (selector en la barra del Reproductor, `shared/skins.ts`, `setSkin` en el motor). Las secciones de selector y persistencia describen el estado actual; el diseño original queda indicado como sustituido. Los valores de las skins no cambian.

Las skins son puramente visuales y viven dentro de `src/lib/games/block-stack/`. `GamePlayer`, `GameCanvas`, `game-engine.ts`, `shared/`, `globals.css` y los demás juegos no se tocan.

---

## Alcance

**Dentro:**

- Módulo `src/lib/games/block-stack/skins.ts` con el tipo `BlockStackSkin` y las cuatro skins; reexporta `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` de `shared/skins` (revisión SPEC 14; la lectura y escritura en `localStorage` ya no están aquí).
- `block-stack-renderer.ts` dibuja a partir de una skin recibida; no queda ningún color, fuente ni estilo de dibujo fuera de ella.
- `constants.ts` conserva solo constantes de jugabilidad y de disposición; los colores salen de él.
- `block-stack-engine.ts` guarda la skin activa y la cambia con `setSkin(skinId)` (revisión SPEC 14).
- Selector `<select>` con opciones "Clásico", "Neón", "Pixel art", "Experimental" en la barra del Reproductor (global, SPEC 14).
- Persistencia en `localStorage` con la clave `arcade-vault:skin:block-stack`, gestionada por la infraestructura global (SPEC 14).

**Fuera de alcance:**

- Cambios en puntuación, vidas, nivel, `GameSnapshot`, leaderboard, pausa, controles o ritmo de caída.
- Cambios en `GamePlayer`, `GameCanvas`, `game-engine.ts`, `engine-registry.ts`, `shared/`, `globals.css`, `GAMES` y Supabase.
- Skins para otros juegos.
- Sonido, imágenes externas, fuentes nuevas.
- Reestilizar el HUD de React (puntuación, vidas, nivel), el marco CRT o el modal de fin de partida.
- Pruebas automatizadas.

---

## Modelo de datos

```ts
// src/lib/games/block-stack/skins.ts
import type { PieceType } from "./constants";

export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_STORAGE_KEY = "arcade-vault:skin:block-stack";

export type BlockStyle = "bevel" | "outline" | "pixel" | "crystal";

export type CrystalStyle = {
  fillAlpha: number;                  // translucent body of the block
  facetLightColor: string;            // top-left triangle
  facetShadeColor: string;            // bottom-right triangle
  edgeSaturationPercent: number;      // iridescent edge, hsl saturation
  edgeLightnessPercent: number;       // iridescent edge, hsl lightness
  edgeBaseHueDegrees: number;
  hueSpeedDegreesPerSecond: number;   // hue drift driven by the rAF clock
  hueSpreadDegrees: number;           // hue difference between the two ends of an edge gradient
  shimmerColor: string;               // refraction band
  shimmerPeriodSeconds: number;       // time the band takes to cross a block
  shimmerWidthPixels: number;
};

export type BlockStackSkin = {
  id: SkinId;
  label: string;                                  // Spanish label shown in the selector
  backgroundColor: string;                        // whole canvas
  boardBackgroundColor: string;                   // well and "next" box
  boardBorderColor: string;
  boardBorderWidthPixels: number;
  gridLineColor: string;
  gridLineWidthPixels: number;
  pieceColors: Readonly<Record<PieceType, string>>; // I, O, T, S, Z, J, L
  blockStyle: BlockStyle;
  blockInsetPixels: number;
  blockHighlightColor: string;                    // bevel: top band / pixel: top and left bands
  blockHighlightSizePixels: number;
  blockShadeColor: string | null;                 // pixel: bottom and right bands; null elsewhere
  ghostAlpha: number;
  glowBlurPixels: number;                         // shadowBlur of blocks and border; 0 = no glow
  textGlowBlurPixels: number;                     // shadowBlur of panel text; 0 = no glow
  panelLabelColor: string;
  panelValueColor: string;
  panelTextColor: string;
  fontFamily: string;                             // used when fontCssVariable is null or unresolved
  fontCssVariable: string | null;                 // CSS custom property holding the app font family
  headingFontWeight: "bold" | "normal";           // labels and the line counter
  labelFontSizePixels: number;
  valueFontSizePixels: number;
  controlFontSizePixels: number;
  isPixelated: boolean;                           // imageSmoothingEnabled = false, integer geometry
  crystal: CrystalStyle | null;                   // only for blockStyle "crystal" and its iridescent frames
};

export const SKINS: Readonly<Record<SkinId, BlockStackSkin>>; // values below
export function isSkinId(value: unknown): value is SkinId;
export function readStoredSkinId(): SkinId;       // try/catch, "classic" if empty, invalid or unavailable
export function writeStoredSkinId(skinId: SkinId): void; // try/catch, silent on failure
```

Valores de las cuatro skins (todas las claves de `BlockStackSkin`):

| Campo | classic | neon | pixel-art | experimental |
| --- | --- | --- | --- | --- |
| `label` | Clásico | Neón | Pixel art | Experimental |
| `backgroundColor` | `#000` | `#05020d` | `#14122b` | `#070b1a` |
| `boardBackgroundColor` | `#1a1a25` | `#08041a` | `#1d1b3a` | `#0d1430` |
| `boardBorderColor` | `#2a2a3a` | `#00f5ff` | `#f4f4f4` | `#9fb8ff` (degradado iridiscente) |
| `boardBorderWidthPixels` | 1 | 2 | 2 | 2 |
| `gridLineColor` | `#22222e` | `rgba(0,245,255,0.10)` | `#2a2750` | `rgba(150,180,255,0.10)` |
| `gridLineWidthPixels` | 0.5 | 1 | 1 | 1 |
| `pieceColors` 1 (I) | `#4dd0e1` | `#00f5ff` | `#41d6f5` | `#7fe9ff` |
| 2 (O) | `#ffd54f` | `#f5ff00` | `#ffd23f` | `#ffe9a8` |
| 3 (T) | `#ba68c8` | `#d400ff` | `#b45cff` | `#d6a8ff` |
| 4 (S) | `#81c784` | `#39ff14` | `#5be37d` | `#a8ffd6` |
| 5 (Z) | `#e57373` | `#ff006e` | `#ff5964` | `#ffa8c8` |
| 6 (J) | `#90caf9` | `#3d7bff` | `#4d7cff` | `#a8c4ff` |
| 7 (L) | `#ffb74d` | `#ff8a00` | `#ff9f43` | `#ffc8a0` |
| `blockStyle` | `bevel` | `outline` | `pixel` | `crystal` |
| `blockInsetPixels` | 1 | 2 | 1 | 1 |
| `blockHighlightColor` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.12)` | `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.12)` |
| `blockHighlightSizePixels` | 4 | 4 | 4 | 4 |
| `blockShadeColor` | `null` | `null` | `rgba(0,0,0,0.30)` | `null` |
| `ghostAlpha` | 0.2 | 0.35 | 0.3 | 0.3 |
| `glowBlurPixels` | 0 | 12 | 0 | 0 |
| `textGlowBlurPixels` | 0 | 6 | 0 | 0 |
| `panelLabelColor` | `#555570` | `#00f5ff` | `#ff9f43` | `#9fb8ff` |
| `panelValueColor` | `#7aa2f7` | `#f5ff00` | `#ffd23f` | `#e9f4ff` |
| `panelTextColor` | `#888888` | `#c8c8ff` | `#d8d8f0` | `#aab6dd` |
| `fontFamily` | `"Courier New", monospace` | `"Courier New", monospace` | `monospace` | `"Courier New", monospace` |
| `fontCssVariable` | `null` | `null` | `--font-press-start` | `null` |
| `headingFontWeight` | bold | bold | normal | bold |
| `labelFontSizePixels` | 12 | 12 | 10 | 12 |
| `valueFontSizePixels` | 32 | 32 | 24 | 32 |
| `controlFontSizePixels` | 14 | 14 | 8 | 14 |
| `isPixelated` | false | false | true | false |
| `crystal` | `null` | `null` | `null` | `CrystalStyle` (ver abajo) |

```ts
// src/lib/games/block-stack/block-stack-engine.ts (revisión SPEC 14)
setSkin(skinId: SkinId): void; // stores the skin; the loop draws it on the next frame
```

Selector y persistencia (revisión SPEC 14): el `<select class="skin-select">` está en la barra del Reproductor (`GamePlayer`), con su `blur()` tras cambiar y sin usar `P` ni `Escape`. La clave `arcade-vault:skin:block-stack` y su `try/catch` viven en `src/lib/games/shared/skins.ts`. El motor no crea DOM ni toca `localStorage`. Versión original (sustituida): `skin-selector.ts` con `createSkinSelector`, en la esquina inferior derecha del canvas.

```ts
// src/lib/games/block-stack/block-stack-renderer.ts
export function drawBlockStack(
  context: CanvasRenderingContext2D,
  state: BlockStackDrawState,
  skin: BlockStackSkin,
): void;
```

---

## Disposición del dibujo

La disposición (posiciones del pozo, paneles, textos y casillas de 30 px) no cambia en ninguna skin. Solo cambia cómo se pinta. Orden: fondo, pozo, sombra de la pieza, pieza, panel izquierdo, panel derecho. Las skins animadas leen `clockSeconds` (reloj de `requestAnimationFrame`, en segundos) que el motor añade a `BlockStackDrawState`.

- **classic:** idéntico al de hoy (bloque de 28 px con franja superior de 4 px).
- **neon:** cada bloque es un contorno de 2 px con el color de la pieza, relleno del mismo color al 35 % de opacidad y `shadowBlur` de 12 px con ese color. Borde del pozo y de la caja "siguiente" en cian con `shadowBlur` de 12. Texto del panel con `shadowBlur` de 6 en su color.
- **experimental (cristal holográfico):** cada bloque es un cristal translúcido: cuerpo con el color de la pieza al 50 % de opacidad, triángulo claro arriba a la izquierda (`rgba(255,255,255,0.35)`), triángulo oscuro abajo a la derecha (`rgba(10,20,60,0.30)`), borde de 1,5 px con degradado iridiscente (`hsl` con saturación 90 %, luminosidad 75 %, tono base 190°, que deriva 30°/s con el reloj y se abre 90° entre extremos, desfasado por casilla) y una franja de refracción diagonal de 6 px (`rgba(255,255,255,0.45)`) que cruza el bloque cada 3 s, desfasada por casilla para dar un brillo en ondas. El borde del pozo y de la caja "siguiente" usan el mismo degradado iridiscente. Sin `shadowBlur` (rendimiento): solo rellenos, un recorte rectangular y un degradado por casilla ocupada.
  `CrystalStyle` de la skin: `fillAlpha` 0.5, `facetLightColor` `rgba(255,255,255,0.35)`, `facetShadeColor` `rgba(10,20,60,0.30)`, `edgeSaturationPercent` 90, `edgeLightnessPercent` 75, `edgeBaseHueDegrees` 190, `hueSpeedDegreesPerSecond` 30, `hueSpreadDegrees` 90, `shimmerColor` `rgba(255,255,255,0.45)`, `shimmerPeriodSeconds` 3, `shimmerWidthPixels` 6.
- **pixel-art:** `imageSmoothingEnabled = false` y todas las coordenadas enteras. Cada bloque de 28 px lleva dos bandas de 4 px: clara arriba y a la izquierda, oscura abajo y a la derecha. La rejilla y los bordes se pintan con `fillRect` (nunca con trazos). Texto en `Press Start 2P`, tomado de la variable CSS `--font-press-start` con `getComputedStyle(document.documentElement)`; si no se resuelve, `monospace`.
- **Sombra de la pieza (ghost):** se dibuja con `ghostAlpha` de la skin; el brillo se escala por la misma opacidad.
- **Contraste:** en todas las skins la pieza activa, los bloques fijados y el contador de líneas se distinguen del fondo del pozo; el texto de controles es la parte menos prominente, pero legible.

---

## Plan de implementación

1. **Módulo de skins.**
   - Crear `skins.ts` con los tipos, las cuatro skins con los valores de la tabla, `isSkinId`, `readStoredSkinId` y `writeStoredSkinId`.
   - La app sigue igual: nadie lo usa aún. Verificación al final: `npx tsc --noEmit` y `npm run lint`.
2. **Renderer con skin.**
   - Mover a `skins.ts` los colores y estilos de dibujo de `constants.ts` y del renderer; quitarlos de `constants.ts` (`PIECE_COLORS` y el bloque "Drawing").
   - `drawBlockStack` recibe la skin: fondo, rejilla, bloques por `blockStyle`, brillo, texto con la fuente de la skin y suavizado.
   - El motor pasa `SKINS[DEFAULT_SKIN_ID]` aún: `classic` se ve igual que antes.
3. **Selector y persistencia (revisado por SPEC 14).**
   - El motor implementa `setSkin(skinId)` y arranca en `DEFAULT_SKIN_ID`; el selector, la lectura y la escritura en `localStorage` son del Reproductor (`GamePlayer`, `shared/skins.ts`). Se registra `block-stack` en `skin-registry.ts`.
   - (Versión original, sustituida: `skin-selector.ts` creado por el motor en `start()` y retirado en `destroy()`.)
   - Cambiar de skin no reinicia la partida ni toca puntuación, vidas, nivel o lógica.

---

## Criterios de aceptación

- [ ] Con `localStorage` vacío, `/games/block-stack/play` se ve idéntico a antes (skin `classic`).
- [ ] (Revisión SPEC 14) La barra del Reproductor muestra el `<select>` de skin con "Clásico", "Neón", "Pixel art" y "Experimental"; el canvas ya no contiene ningún selector.
- [ ] Cambiar de skin repinta al instante sin reiniciar la partida; puntuación, vidas, nivel y pieza en juego no cambian.
- [ ] Tras elegir una skin y recargar, se conserva. Con un valor inválido en `localStorage`, o con `localStorage` bloqueado, se usa `classic` sin errores.
- [ ] Tras cambiar de skin con el ratón, las flechas, `Espacio` y `X` siguen controlando el juego; `P` y `Esc` siguen pausando.
- [ ] `neon` muestra fondo casi negro, colores saturados y brillo; `pixel-art` muestra bordes duros y texto en `Press Start 2P`; `experimental` muestra cristales translúcidos con borde iridiscente y un brillo que se desplaza.
- [ ] Un valor `retro` guardado en `localStorage` (de la versión anterior) se trata como inválido y se usa `classic`.
- [ ] En las cuatro skins se distinguen la pieza activa, los bloques fijados, la sombra y el contador de líneas.
- [ ] La skin elegida se conserva al pulsar "JUGAR DE NUEVO" y no se duplica ningún selector con React Strict Mode.
- [ ] No queda ningún color ni fuente de dibujo fuera de `skins.ts` en la carpeta del juego.
- [ ] `npx tsc --noEmit` y `npm run lint` terminan sin errores.
- [ ] Ningún otro juego ni archivo fuera de `src/lib/games/block-stack/` y esta spec cambia.

---

## Decisiones tomadas y descartadas

- **Sí:** la spec queda `Aprobado` porque el usuario invocó al agente para este juego; esa invocación es la aprobación.
- **Sí:** `classic` conserva los valores actuales, tal cual. **No:** retocar sus colores.
- **Sí:** selector `<select>` creado por el motor en `canvas.parentElement`, sin tocar `GamePlayer`. **No:** un componente React nuevo.
- **Sí:** esquina inferior derecha para el selector, porque el diseño la deja vacía. **No:** arriba a la derecha, que taparía "SIGUIENTE".
- **Sí:** `blur()` tras cambiar. **No:** asignar ninguna tecla al selector; `P` y `Esc` son del Reproductor.
- **Sí:** clave `arcade-vault:skin:<game-id>`, lectura en `start()` (tras montar) con `try/catch`. **No:** leer durante el render.
- **Sí (cambio a petición del usuario, 2026-11-22):** el conjunto de skins pasa a ser exactamente `classic`, `neon`, `pixel-art` y `experimental`; se elimina `retro` por completo (id, opción, paleta y código de scanlines). Un `retro` guardado cae a `classic`.
- **Sí:** `experimental` es un cristal holográfico (piezas facetadas translúcidas, bordes iridiscentes, destello animado con el reloj de rAF), distinto de los conceptos de otros juegos (synthwave en wall-breaker, recortes de papel en fruit-snake, plano técnico en asteroids). **No:** `shadowBlur` en los bloques, por rendimiento.
- **Sí:** el motor pasa `clockSeconds` al renderer; la animación es solo visual y no depende del estado del juego.
- **Sí:** fuente de `pixel-art` leída de la variable CSS ya cargada por la app. **No:** cargar otra fuente.
- **Sí:** la disposición de paneles no cambia entre skins, solo el estilo.
- **Sí (revisión 2026-11-22, SPEC 14):** el selector y la persistencia pasan a la infraestructura global. `skins.ts` importa y reexporta `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` de `../shared/skins` y usa `SKIN_LABELS` y `SKIN_BASE_TOKENS` (fondo y brillo de neon, fondo y fuente de pixel-art; valores idénticos a los anteriores). El motor implementa `setSkin(skinId)`, arranca en `DEFAULT_SKIN_ID`, ya no lee `localStorage` ni crea el `<select>`; se eliminan `skin-selector.ts` y las funciones propias de lectura y escritura. `block-stack` se añade a `skin-registry.ts`. No hace falta repintar en `setSkin`: el bucle dibuja en cada cuadro, también en pausa y tras el fin de partida. El selector deja de estar en la esquina inferior derecha del canvas y pasa a la barra del Reproductor. Los valores de las 4 skins y el concepto de `experimental` (cristal holográfico) no cambian.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un `<select>` enfocado captura las flechas | `blur()` en `change`; además `KeyboardInput` ya llama a `preventDefault` en las teclas del juego, por lo que el `<select>` no cambia de valor con ellas. |
| `shadowBlur` en 200 casillas por cuadro es costoso | Solo se pinta en las casillas ocupadas y el pozo sigue siendo de 10×20. |
| `Press Start 2P` aún no cargada al primer cuadro | Se redibuja cada cuadro; usa `monospace` hasta que esté disponible. |
| El ancho de `Press Start 2P` desborda el panel | Tamaños de 8, 10 y 24 px: la línea más larga (14 caracteres a 8 px) mide 112 px frente a 210 px disponibles. |
| `localStorage` bloqueado o con valor inválido | `try/catch` y respaldo a `classic`. |
| Selector duplicado al reiniciar o con Strict Mode | (Revisión SPEC 14) El selector es de `GamePlayer`, no del motor; el motor solo expone `setSkin`. |

---

## Qué **no** entra en esta spec

- Cambios de jugabilidad, puntuación, `GameSnapshot` o leaderboard.
- Skins de otros juegos.
- Imágenes, sonido o fuentes nuevas.
- Reestilizar el HUD de React, el marco CRT o los modales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
