# SPEC 11 — Skins de ASTEROIDS

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 10
> **Date:** 2026-11-22
> **Objective:** Ofrecer en ASTEROIDS cuatro skins visuales (`classic`, `neon`, `pixel-art`, `experimental`) elegibles con un selector dentro del juego y recordadas en `localStorage`, sin tocar la jugabilidad.

---

## Por qué existe esta spec

ASTEROIDS dibuja con una sola apariencia: los colores, la fuente y el grosor de línea están escritos dentro de `ship.ts`, `asteroid.ts`, `bullet.ts`, `particle.ts`, `power-up.ts` y `asteroids-engine.ts`. Esta spec reúne todo lo que se dibuja en un módulo de skins y añade tres apariencias nuevas (`neon`, `pixel-art` y `experimental`). `classic` conserva exactamente los valores de hoy, así que por defecto no cambia nada.

Auditoría previa (2026-11-22): no existe módulo de skins, no hay selector ni persistencia, y quedan 21 usos de color, fuente o estilo de dibujo fuera de una skin repartidos en 6 archivos.

Revisión (2026-11-22, a petición del usuario): el conjunto de skins pasa a ser exactamente `classic`, `neon`, `pixel-art` y `experimental`. Se elimina `retro` por completo (id, opción, paleta y código de líneas de exploración) y se añade `experimental` con el concepto plano técnico (blueprint). Una skin `retro` guardada en `localStorage` ya no es válida y cae a `classic`.

Las skins son puramente visuales y viven dentro de `src/lib/games/asteroids/`. `GamePlayer`, `GameCanvas`, `game-engine.ts`, `shared/`, `globals.css` y los demás juegos no se tocan.

---

## Alcance

**Dentro:**

- `skins.ts`: tipos `SkinId` y `AsteroidsSkin`, las cuatro skins, `DEFAULT_SKIN_ID`, lectura y escritura en `localStorage`.
- `skin-selector.ts`: crea y retira el `<select>`.
- `skin-draw.ts`: utilidades de dibujo que dependen de la skin (trazo vectorial o en bloques, coordenadas de mundo, fuente, rejilla de plano, línea de rumbo y marcas de cota).
- `ship.ts`, `asteroid.ts`, `bullet.ts`, `particle.ts`, `power-up.ts` y `asteroids-engine.ts` dibujan con la skin recibida; no queda ningún color, fuente ni estilo de dibujo fuera de ella.
- `<select>` con etiqueta "Skin" y opciones "Clásico", "Neón", "Pixel art", "Experimental" dentro de `canvas.parentElement`.
- Persistencia con la clave `arcade-vault:skin:asteroids`.

**Fuera de alcance:**

- Cambios en puntuación, vidas, nivel, `GameSnapshot`, leaderboard, pausa, controles, colisiones, física o generación de asteroides.
- Cambios en `GamePlayer`, `GameCanvas`, `game-engine.ts`, `engine-registry.ts`, `shared/`, `globals.css`, `GAMES` y Supabase.
- Skins para otros juegos, sonido, imágenes externas, fuentes nuevas.
- Reestilizar el HUD de React o el modal de fin de partida.
- Pruebas automatizadas.

---

## Modelo de datos

```ts
// src/lib/games/asteroids/skins.ts
export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_STORAGE_KEY = "arcade-vault:skin:asteroids";

export type BulletShape = "circle" | "square" | "cross";

export type AsteroidsSkin = {
  id: SkinId;
  label: string;                                   // Spanish label shown in the selector
  backgroundColor: string;                         // whole canvas
  shipColor: string;
  shipLineWidthPixels: number;
  shipFlameColor: string;
  asteroidColors: Readonly<Record<AsteroidSize, string>>; // 1 = small, 3 = large
  asteroidLineWidthPixels: number;
  bulletColor: string;
  bulletShape: BulletShape;
  bulletSizePixels: number;                        // circle: radius / square: side
  particleColor: string;                           // fades out with globalAlpha
  powerUpColor: string;                            // pickup and the "3x" indicator
  powerUpLineWidthPixels: number;
  glowBlurPixels: number;                          // shadowBlur of lines and text; 0 = no glow
  fontFamily: string;                              // used when fontCssVariable is null or unresolved
  fontCssVariable: string | null;                  // CSS custom property holding the app font family
  powerUpFontWeight: "bold" | "normal";
  powerUpFontSizePixels: number;
  indicatorFontSizePixels: number;
  isPixelated: boolean;                            // imageSmoothingEnabled = false, shapes drawn as grid blocks
  pixelSizePixels: number;                         // block side when isPixelated (1 otherwise)
  asteroidDashPatterns: Readonly<Record<AsteroidSize, readonly number[]>>; // [] = solid line
  powerUpDashPattern: readonly number[];
  blueprint: BlueprintStyle | null;                // drafting-paper decoration; null = none
};

export type BlueprintStyle = {
  gridColor: string;
  majorGridColor: string;
  gridSpacingPixels: number;
  majorGridEvery: number;                          // every Nth line uses majorGridColor
  annotationColor: string;
  annotationLineWidthPixels: number;
  headingLengthPixels: number;                     // dashed line ahead of the ship nose
  headingDashPattern: readonly number[];
  dimensionMarkSizePixels: number;                 // center cross arm and dimension end tick
};

export const SKINS: Readonly<Record<SkinId, AsteroidsSkin>>;
export function isSkinId(value: unknown): value is SkinId;
export function readStoredSkinId(): SkinId;        // try/catch, "classic" if empty, invalid or unavailable
export function writeStoredSkinId(skinId: SkinId): void; // try/catch, silent on failure
```

Valores de las cuatro skins (todas las claves de `AsteroidsSkin`):

| Campo | classic | neon | pixel-art | experimental |
| --- | --- | --- | --- | --- |
| `label` | Clásico | Neón | Pixel art | Experimental |
| `backgroundColor` | `#000` | `#05020d` | `#14122b` | `#0a2a5e` |
| `shipColor` | `#fff` | `#00f5ff` | `#41d6f5` | `#f2fbff` |
| `shipLineWidthPixels` | 1.5 | 2 | 4 | 1.5 |
| `shipFlameColor` | `rgba(255, 130, 0, 0.85)` | `#ff8a00` | `#ff9f43` | `#7fe3ff` |
| `asteroidColors` 3 (grande) | `#fff` | `#ff006e` | `#b45cff` | `#f2fbff` |
| 2 (mediano) | `#fff` | `#d400ff` | `#ff9f43` | `#bfe9ff` |
| 1 (pequeño) | `#fff` | `#f5ff00` | `#ff5964` | `#8fd3ff` |
| `asteroidLineWidthPixels` | 1.5 | 2 | 4 | 1.5 |
| `bulletColor` | `#fff` | `#f5ff00` | `#ffd23f` | `#ffffff` |
| `bulletShape` | circle | circle | square | cross |
| `bulletSizePixels` | 2 | 3 | 4 | 4 |
| `particleColor` | `#fff` | `#ff8a00` | `#f4f4f4` | `#bfe9ff` |
| `powerUpColor` | `#0ff` | `#39ff14` | `#5be37d` | `#ffe27a` |
| `powerUpLineWidthPixels` | 2 | 2 | 4 | 1.5 |
| `glowBlurPixels` | 0 | 12 | 0 | 0 |
| `fontFamily` | `monospace` | `monospace` | `monospace` | `monospace` |
| `fontCssVariable` | `null` | `null` | `--font-press-start` | `null` |
| `powerUpFontWeight` | bold | bold | normal | bold |
| `powerUpFontSizePixels` | 12 | 12 | 8 | 11 |
| `indicatorFontSizePixels` | 15 | 15 | 10 | 14 |
| `isPixelated` | false | false | true | false |
| `pixelSizePixels` | 1 | 1 | 4 | 1 |
| `asteroidDashPatterns` 3 / 2 / 1 | `[]` / `[]` / `[]` | `[]` / `[]` / `[]` | `[]` / `[]` / `[]` | `[]` / `[10, 4]` / `[2, 3]` |
| `powerUpDashPattern` | `[]` | `[]` | `[]` | `[4, 3]` |
| `blueprint` | `null` | `null` | `null` | ver abajo |

`blueprint` de `experimental`: `gridColor` `rgba(180, 220, 255, 0.10)`, `majorGridColor` `rgba(180, 220, 255, 0.22)`, `gridSpacingPixels` 40, `majorGridEvery` 5, `annotationColor` `rgba(191, 233, 255, 0.55)`, `annotationLineWidthPixels` 1, `headingLengthPixels` 90, `headingDashPattern` `[6, 5]`, `dimensionMarkSizePixels` 4.

El selector (`skin-selector.ts`) tiene la misma firma y las mismas convenciones que el de la SPEC 10: un `<label>` "Skin" con un `<select>` (`aria-label="Skin"`, valores = `SkinId`, textos = `label`), estilo en línea con `var(--pixel)`, `var(--ink-dim)`, `var(--bg-2)`, `var(--cyan)` y `var(--line)`, esquina inferior derecha (`right: 10px; bottom: 10px; z-index: 4`) de `canvas.parentElement`. En `change` llama a `onSkinChange` y después a `blur()`. No registra ninguna tecla; no usa `P` ni `Escape`.

Las entidades pasan a recibir la skin: `draw(context, skin)` en `Ship`, `Asteroid`, `Bullet`, `Particle` y `PowerUp`. `skin-draw.ts` exporta `toWorldPoint`, `snapToGrid`, `strokePath` (con patrón de trazos opcional), `resolveFont`, `drawBlueprintGrid`, `drawHeadingLine` y `drawDimensionMarks`. Las formas se calculan en coordenadas de mundo (sin `translate` ni `rotate` del contexto) para poder trazarlas igual en modo vectorial y en bloques.

---

## Disposición del dibujo

La geometría (nave, polígonos irregulares, rombo del premio, indicador "3x" en (14, 26)) y la jugabilidad no cambian. Orden: fondo, rejilla de plano (solo `experimental`), partículas, asteroides, premios, disparos, nave, indicador.

- **classic:** idéntico al de hoy: todo blanco, premio y texto cian, llama naranja translúcida.
- **neon:** fondo casi negro, trazos de 2 px con `shadowBlur` de 12 px del color de cada elemento. Nave cian, asteroides magenta/violeta/amarillo según tamaño, disparos amarillos, premio verde.
- **pixel-art:** `imageSmoothingEnabled = false`. Nave, asteroides y rombo se pintan como bloques de 4 px sobre una rejilla (cada segmento se muestrea y cada muestra se ajusta con `Math.floor`). Disparos cuadrados de 4 px, partículas de 4 px, texto en `Press Start 2P` leído de `--font-press-start` con `getComputedStyle(document.documentElement)`; si no se resuelve, `monospace`.
- **experimental (plano técnico / blueprint):** papel azul profundo `#0a2a5e` con una rejilla de dibujo de 1 px cada 40 px (cada 5ª línea más marcada), trazos finos de 1.5 px blanco-cian sin brillo (`glowBlurPixels` 0) y fuente `monospace`. Los roles se separan por forma y estilo de línea: nave en trazo continuo `#f2fbff` con una línea de rumbo discontinua (`[6, 5]`, 90 px) delante de la proa y llama `#7fe3ff`; rocas grandes en línea continua `#f2fbff` con cruz de centro y una cota (línea horizontal con topes de 4 px) bajo la roca; medianas en línea discontinua `[10, 4]` `#bfe9ff` con cruz de centro; pequeñas punteadas `[2, 3]` `#8fd3ff`; disparos en forma de cruz `+` blanca de 4 px de brazo; premio en rombo discontinuo `[4, 3]` amarillo tiza `#ffe27a` (único tono cálido) con el "3x" y el indicador del mismo color; partículas `#bfe9ff`. La rejilla se dibuja con 35 trazos por cuadro, sin `shadowBlur`, por lo que el rendimiento no se resiente.
- **Contraste:** en las cuatro skins la nave, las rocas, los disparos y el premio se distinguen entre sí (por tono; en `classic` y `experimental`, por forma, estilo de línea, tamaño y brillo) y contrastan con el fondo; el indicador "3x" usa el color del premio.

---

## Plan de implementación

1. **Módulo de skins.** Crear `skins.ts` con tipos, las cuatro skins y la persistencia. La app sigue igual: nadie lo usa aún.
2. **Entidades con skin.** Crear `skin-draw.ts`; cambiar `draw` de las cinco entidades y del motor para usar la skin; mover a `skins.ts` todos los colores, fuentes y estilos. El motor usa `SKINS[skinId]` con `classic`: se ve igual que antes.
3. **Selector y persistencia.** Crear `skin-selector.ts`; el motor lee la skin guardada y crea el selector en `start()`, lo retira en `destroy()` y al cambiar guarda la skin y la usa en el siguiente cuadro. Cambiar de skin no reinicia la partida ni toca puntuación, vidas, nivel o lógica.

Verificación al final: `npx tsc --noEmit` y `npm run lint`.

---

## Criterios de aceptación

- [ ] Con `localStorage` vacío, `/games/asteroids/play` se ve idéntico a antes (skin `classic`).
- [ ] Existe un `<select>` "Skin" con "Clásico", "Neón", "Pixel art" y "Experimental" en la esquina inferior derecha del marco.
- [ ] Cambiar de skin repinta al instante sin reiniciar la partida; puntuación, vidas, nivel y posición de nave y rocas no cambian.
- [ ] Tras elegir una skin y recargar, se conserva. Con un valor inválido (incluido un `retro` guardado antes) o con `localStorage` bloqueado se usa `classic` sin errores.
- [ ] Tras cambiar de skin con el ratón, las flechas y `Espacio` siguen controlando la nave; `P` y `Esc` siguen pausando.
- [ ] `neon` muestra fondo casi negro, colores saturados y brillo; `pixel-art` muestra formas en bloques y texto en `Press Start 2P`; `experimental` muestra papel azul con rejilla, trazos finos blanco-cian, rocas continuas/discontinuas/punteadas, línea de rumbo de la nave y disparos en cruz.
- [ ] En las cuatro skins se distinguen nave, rocas, disparos, premio y el indicador "3x".
- [ ] El `<select>` desaparece al salir y no se duplica con React Strict Mode ni al pulsar "JUGAR DE NUEVO".
- [ ] No queda ningún color ni fuente de dibujo fuera de `skins.ts` en la carpeta del juego.
- [ ] `npx tsc --noEmit` y `npm run lint` terminan sin errores.
- [ ] Ningún otro juego ni archivo fuera de `src/lib/games/asteroids/` y esta spec cambia.

---

## Decisiones tomadas y descartadas

- **Sí:** la spec queda `Aprobado` porque el usuario invocó al agente para este juego; esa invocación es la aprobación.
- **Sí:** `classic` conserva los valores actuales. **No:** retocar sus colores.
- **Sí:** selector `<select>` creado por el motor en `canvas.parentElement`; esquina inferior derecha, libre en este juego. **No:** un componente React nuevo.
- **Sí:** `blur()` tras cambiar. **No:** asignar teclas; `P` y `Esc` son del Reproductor.
- **Sí:** clave `arcade-vault:skin:asteroids`, lectura en `start()` con `try/catch`. **No:** leer durante el render.
- **Sí:** a petición del usuario (2026-11-22) el conjunto pasa a `classic`, `neon`, `pixel-art` y `experimental`; se elimina `retro` (id, opción, paleta, campo `scanlines` y `drawScanlines`). **No:** conservar `retro` ni sus scanlines.
- **Sí:** un `retro` guardado en `localStorage` cae a `classic` porque `isSkinId` ya no lo reconoce. **No:** migrarlo a otra skin.
- **Sí:** `experimental` = plano técnico (blueprint), concepto único respecto a los de otros juegos (cristal holográfico, atardecer synthwave, recortes de papel). Los roles se separan por forma y estilo de línea (continua, discontinua, punteada, cruz, rombo discontinuo) más un único tono cálido para el premio. **No:** reutilizar conceptos de otros juegos ni usar `shadowBlur`.
- **Sí:** rejilla, línea de rumbo y cotas dibujadas con trazos simples por cuadro (sin `Path2D` ni lienzo auxiliar). **No:** animaciones ni sombras costosas.
- **Sí:** formas en coordenadas de mundo para poder trazarlas en bloques. **No:** `rotate` del contexto, que no permite ajustar a rejilla.
- **Sí:** el brillo no se aplica a las partículas (hasta ~75 por explosión) para cuidar el rendimiento. **No:** `shadowBlur` en cada partícula.
- **Sí:** el tamaño dibujado del disparo sale de la skin; el radio de colisión (`BULLET_RADIUS`) queda en el juego. **No:** cambiar colisiones.
- **Sí:** fuente de `pixel-art` leída de la variable CSS ya cargada. **No:** cargar otra fuente.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un `<select>` enfocado captura las flechas | `blur()` en `change`; `KeyboardInput` ya hace `preventDefault` en las teclas del juego. |
| `shadowBlur` en ~15 polígonos por cuadro | Solo trazos de entidades vivas; sin brillo en partículas. |
| Trazo en bloques con muchas muestras | Una muestra por 4 px de segmento: un asteroide grande genera ~80 `fillRect`. |
| `Press Start 2P` aún no cargada al primer cuadro | Se redibuja cada cuadro; usa `monospace` hasta que esté disponible. |
| Los pixeles de `pixel-art` no coinciden exactamente con el área de colisión | Es solo visual; la colisión no cambia. |
| `localStorage` bloqueado o con valor inválido | `try/catch` y respaldo a `classic`. |
| Selector duplicado al reiniciar o con Strict Mode | Se crea en `start()` (idempotente) y se retira en `destroy()`. |

---

## Qué **no** entra en esta spec

- Cambios de jugabilidad, puntuación, `GameSnapshot` o leaderboard.
- Skins de otros juegos.
- Imágenes, sonido o fuentes nuevas.
- Reestilizar el HUD de React o los modales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
