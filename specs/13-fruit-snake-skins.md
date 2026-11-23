# SPEC 13 — Skins de FRUIT SNAKE

> **Status:** Implementado
> **Depends on:** SPEC 09, SPEC 10
> **Date:** 2026-11-22
> **Objective:** Ofrecer en FRUIT SNAKE cuatro skins visuales (`classic`, `neon`, `pixel-art` y la experimental `experimental`) elegibles con un selector dentro del juego y recordadas en `localStorage`, sin tocar la jugabilidad.

---

## Por qué existe esta spec

FRUIT SNAKE dibuja con una sola apariencia: los colores están en `constants.ts` (serpiente, frutas, hoja, tallo, rejilla), el fondo `#000` está escrito en el motor y las formas de las frutas en `fruit.ts`. Esta spec reúne todo lo que se dibuja en un módulo de skins y añade cuatro apariencias nuevas. `classic` conserva exactamente los valores de hoy: por defecto no cambia nada.

> **Revisión (2026-11-22, SPEC 14):** el selector propio y la persistencia propia se sustituyen por la infraestructura global de skins (selector en la barra del reproductor, `setSkin` en el motor, `shared/skins.ts`, `skin-registry.ts`). Se corrige así la limitación conocida de que el selector tapaba una casilla del tablero. Los valores de las skins no cambian.

Este juego tiene **4 skins (`classic`, `neon`, `pixel-art` + 1 experimental)**; `retro` se retiró a petición del usuario.

Auditoría previa (2026-11-22): no existe módulo de skins, no hay selector ni persistencia, y quedan 10 colores de dibujo en `constants.ts` (`GRID_LINE_COLOR`, 4 de serpiente, `FRUIT_COLORS` x4, hoja y tallo), 1 en el motor (`#000`) y ningún `font`/`shadowBlur`. El juego no dibuja texto (el HUD es de React), así que las skins no definen fuente.

Las skins son puramente visuales y viven dentro de `src/lib/games/fruit-snake/`.

---

## Alcance

**Dentro:**

- `skins.ts`: `FruitSnakeSkin` y las cuatro skins; reexporta `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` de `../shared/skins` (SPEC 14).
- `skin-draw.ts`: tablero, elipses (con brillo, sombra, contorno o bloques), tallos y segmentos de serpiente según la skin.
- `snake.ts` y `fruit.ts` reciben la skin en `draw(context, skin)`.
- `constants.ts` conserva solo constantes de jugabilidad y disposición; los colores salen de él.
- `fruit-snake-engine.ts`: guarda la skin activa, arranca con `classic` e implementa `setSkin(skinId)`; no crea DOM ni lee `localStorage`.
- Selector "Skin" ("Clásico", "Neón", "Pixel art", "Experimental") en la barra del reproductor (infraestructura global, SPEC 14).
- Persistencia con la clave `arcade-vault:skin:fruit-snake` gestionada por la infraestructura global; un valor guardado `retro` (o cualquier otro inválido) cae a `classic`.
- `src/lib/games/skin-registry.ts`: el id `fruit-snake` se añade a la lista de juegos con skins globales.

**Fuera de alcance:**

- Cambios en puntuación, vidas, nivel, `GameSnapshot`, leaderboard, pausa, controles, velocidad o aparición de frutas.
- Cambios en `GamePlayer`, `GameCanvas`, `game-engine.ts`, `engine-registry.ts`, `shared/`, `globals.css`, `GAMES`, Supabase y otros juegos.
- Sonido, imágenes externas, fuentes nuevas, HUD de React, marco CRT, modal de fin de partida.
- Pruebas automatizadas.

---

## Modelo de datos

```ts
// src/lib/games/fruit-snake/skins.ts
export type SkinId = "classic" | "neon" | "pixel-art" | "experimental";
export const SKIN_IDS: readonly SkinId[] = ["classic", "neon", "pixel-art", "experimental"];
export const DEFAULT_SKIN_ID: SkinId = "classic";
export const SKIN_STORAGE_KEY = "arcade-vault:skin:fruit-snake";

export type SegmentStyle = "flat" | "outline" | "pixel" | "sticker";
export type EyeShape = "square" | "round";

export type FruitSnakeSkin = {
  id: SkinId;
  label: string;
  backgroundColor: string;
  gridLineColor: string;
  snakeBodyColor: string;
  snakeBodyAlternateColor: string | null;  // odd body segments; null = all the same
  snakeHeadColor: string;
  snakeCrashedHeadColor: string;
  snakeEyeColor: string;
  eyeShape: EyeShape;
  segmentStyle: SegmentStyle;
  segmentCornerRadiusPixels: number;       // sticker only
  segmentOutlineWidthPixels: number;       // outline only
  fruitColors: Readonly<Record<FruitKind, string>>;
  fruitLeafColor: string;
  fruitStemColor: string;
  outlineColor: string | null;             // sticker: ink stroke on segments and fruit
  outlineWidthPixels: number;
  shadowColor: string | null;              // hard offset shadow, no blur
  shadowOffsetPixels: number;
  highlightColor: string | null;           // pixel: top and left bands
  shadeColor: string | null;               // pixel: bottom and right bands
  glowBlurPixels: number;                  // shadowBlur; 0 = none
  isPixelated: boolean;                    // imageSmoothingEnabled = false, shapes made of blocks
  pixelSizePixels: number;                 // 2 (divides the 20 px cell)
};
```

Valores:

| Campo | classic | neon | pixel-art | experimental |
| --- | --- | --- | --- | --- |
| `label` | Clásico | Neón | Pixel art | Experimental |
| `backgroundColor` | `#000` | `#05020d` | `#14122b` | `#f4ead5` |
| `gridLineColor` | `rgba(255,255,255,0.04)` | `rgba(0,245,255,0.10)` | `#1d1b3a` | `rgba(43,27,23,0.07)` |
| `snakeBodyColor` | `#2fbf5a` | `#39ff14` | `#5be37d` | `#f4a259` |
| `snakeBodyAlternateColor` | `null` | `null` | `null` | `#f6c85f` |
| `snakeHeadColor` | `#7be08f` | `#00f5ff` | `#41d6f5` | `#2a9d8f` |
| `snakeCrashedHeadColor` | `#e04848` | `#ff006e` | `#ff5964` | `#d00000` |
| `snakeEyeColor` | `#000` | `#ffffff` | `#14122b` | `#2b1b17` |
| `eyeShape` | square | square | square | round |
| `segmentStyle` | flat | outline | pixel | sticker |
| `segmentCornerRadiusPixels` | 0 | 0 | 0 | 6 |
| `segmentOutlineWidthPixels` | 0 | 2 | 0 | 0 |
| `fruitColors` apple | `#e03a3a` | `#ff006e` | `#ff5964` | `#e63946` |
| cherry | `#c8203a` | `#ff8a00` | `#ff9f43` | `#9d174d` |
| lemon | `#f0d040` | `#f5ff00` | `#ffd23f` | `#ffd23f` |
| grape | `#8a4fd0` | `#d400ff` | `#b45cff` | `#7b4fbf` |
| `fruitLeafColor` | `#3cc05a` | `#39ff14` | `#5be37d` | `#2a9d8f` |
| `fruitStemColor` | `#6a8a3a` | `#c8c8ff` | `#c98a4b` | `#5a3e2b` |
| `outlineColor` | `null` | `null` | `null` | `#2b1b17` |
| `outlineWidthPixels` | 0 | 0 | 0 | 2 |
| `shadowColor` | `null` | `null` | `null` | `rgba(43,27,23,0.30)` |
| `shadowOffsetPixels` | 0 | 0 | 0 | 2 |
| `highlightColor` | `null` | `null` | `rgba(255,255,255,0.35)` | `null` |
| `shadeColor` | `null` | `null` | `rgba(0,0,0,0.30)` | `null` |
| `glowBlurPixels` | 0 | 12 | 0 | 0 |
| `isPixelated` | false | false | true | false |
| `pixelSizePixels` | 2 | 2 | 2 | 2 |

`SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` vienen de `../shared/skins` y se reexportan desde `skins.ts`. La lectura y escritura en `localStorage` (clave `arcade-vault:skin:fruit-snake`, `try/catch`, `classic` si está vacío, es inválido o no hay almacenamiento) las hace la infraestructura global (SPEC 14), no el juego.

Selector (revisado por SPEC 14): el motor no crea ningún `<select>`. Lo muestra el reproductor en su barra, fuera del canvas ("Clásico", "Neón", "Pixel art", "Experimental"), lo conserva habilitado y llama a `engine.setSkin(skinId)`. Ya no tapa ninguna casilla del tablero.

---

## Disposición del dibujo

La disposición (cuadrícula 40×30 de casillas de 20 px, segmentos de 18 px, ojos de 3 px) no cambia. Orden: fondo y rejilla, fruta, serpiente (cola primero, cabeza encima, luego ojos)

- **classic:** idéntico al de hoy.
- **neon:** fondo casi negro. Segmentos en contorno de 2 px con relleno al 35 % y `shadowBlur` 12; cabeza cian, cuerpo verde, choque magenta. Frutas rellenas con brillo del mismo color. Rejilla cian tenue.
- **pixel-art:** `imageSmoothingEnabled = false`; segmentos con bandas de 2 px (clara arriba/izquierda, oscura abajo/derecha); frutas, hoja y tallos formados por bloques de 2 px alineados a la rejilla (cada bloque cuyo centro cae dentro de la elipse); ojos en coordenadas enteras. No se dibuja texto, así que no se usa fuente.
- **experimental (recortes de papel / pegatinas):** papel crema con rejilla de tinta muy tenue. La serpiente es una oruga de segmentos redondeados (radio 6) con rayas alternas naranja/amarillo, cabeza verde azulado y ojos redondos; todo con contorno de tinta de 2 px y sombra dura desplazada 2 px (sin desenfoque). Las frutas son pegatinas: relleno plano, contorno de tinta de 2 px y la misma sombra dura. Sin `shadowBlur`: solo rellenos y trazos, por lo que es tan barato como `classic`.
- **Contraste:** en todas las skins la serpiente, cada fruta y el tablero se distinguen; la cabeza chocada se distingue de la cabeza normal.

---

## Plan de implementación

1. **Módulo de skins.** Crear `skins.ts` con tipos, cuatro skins, `isSkinId`, lectura y escritura. Nadie lo usa aún; la app sigue igual.
2. **Dibujo con skin.** Crear `skin-draw.ts`; `snake.draw` y `fruit.draw` reciben la skin; quitar de `constants.ts` los colores; el motor dibuja con `SKINS[DEFAULT_SKIN_ID]`. `classic` se ve igual.
3. **Skin global (revisado por SPEC 14).** El motor implementa `setSkin(skinId)` y el juego se añade a `skin-registry.ts`; el selector y la persistencia los gestiona el reproductor. Sin reinicio ni cambios en puntuación, vidas, nivel o lógica. (Originalmente: selector propio `skin-selector.ts` creado en `start()`.)

---

## Criterios de aceptación

- [ ] Con `localStorage` vacío, `/games/fruit-snake/play` se ve idéntico a antes.
- [ ] El `<select>` "Skin" lista las 4 opciones: "Clásico", "Neón", "Pixel art", "Experimental".
- [ ] Cambiar de skin repinta al instante sin reiniciar la partida; puntuación, nivel y serpiente no cambian.
- [ ] Tras elegir una skin y recargar se conserva (también `experimental`). Con valor inválido (incluido un `retro` guardado antes) o `localStorage` bloqueado se usa `classic` sin errores.
- [ ] Tras cambiar de skin con el ratón, flechas y WASD siguen controlando; `P` y `Esc` siguen pausando.
- [ ] `pixel-art` no muestra suavizado; `experimental` muestra papel crema, contornos de tinta y sombras duras.
- [ ] Al salir de la página el `<select>` desaparece y no se duplica con Strict Mode ni al jugar de nuevo.
- [ ] No queda color de dibujo fuera de `skins.ts` en la carpeta del juego.
- [ ] `npx tsc --noEmit` y `npm run lint` sin errores propios.
- [ ] Ningún archivo fuera de `src/lib/games/fruit-snake/`, esta spec y la memoria del agente cambia.

---

## Decisiones tomadas y descartadas

- **Sí:** la spec queda `Aprobado` (luego `Implementado`) porque el usuario invocó al agente para este juego; esa invocación es la aprobación. El número 13 lo fijó el usuario.
- **Sí:** `classic` conserva los valores actuales. **No:** retocar sus colores.
- **Sí:** estructura y selector idénticos a block-stack y asteroids; paletas de `neon` y `pixel-art` reutilizadas (cian `#00f5ff`, magenta `#ff006e`, amarillo `#f5ff00`, verde `#39ff14`, naranja `#ff8a00`, morado `#d400ff`; `#14122b`, `#41d6f5`, `#ffd23f`, `#ff9f43`, `#ff5964`, `#b45cff`, `#5be37d`).
- **Sí (decisión del usuario, 2026-11-22):** el conjunto pasa a exactamente 4 skins; se elimina `retro` por completo (id, opción, paleta rosa/rojo, scanlines y el campo `scanlines`, que solo usaba esa skin). Un `retro` guardado en `localStorage` cae a `classic`. `experimental` (recortes de papel) se mantiene sin cambios y sigue siendo único frente a las de otros juegos (cristal holográfico, synthwave, plano técnico). **No:** reutilizar el id `retro` ni dejar código muerto de scanlines.
- **Sí (decisión del usuario):** cuarta skin `experimental`, en modo experimental. Concepto elegido: recortes de papel / pegatinas sobre papel crema (único tema claro del conjunto, con oruga rayada y sombras duras). **No:** atardecer synthwave con rejilla (idea de wall-breaker) ni bioluminiscencia (se parecería demasiado a `neon` por el brillo). Se mantiene legible (alto contraste tinta sobre crema) y barata (sin `shadowBlur`, sin imágenes).
- **Sí:** `experimental` es un id adicional dentro del mismo tipo `SkinId`, y `readStoredSkinId` lo acepta. **No:** un mecanismo aparte.
- **Sí:** sin fuente en las skins, porque el juego no dibuja texto. **No:** añadir `fontFamily` sin uso.
- **Sí:** `blur()` tras cambiar. **No:** asignar teclas, `P` o `Escape`.
- **Sí:** clave `arcade-vault:skin:<game-id>`, lectura en `start()` con `try/catch`. **No:** leer durante el render.
- **Sí (revisión 2026-11-22, SPEC 14):** el juego migra a la infraestructura global de skins. `skins.ts` reexporta `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID` e `isSkinId` desde `../shared/skins` y usa `SKIN_LABELS` y `SKIN_BASE_TOKENS` (fondo y brillo de `neon`, fondo de `pixel-art`); el motor implementa `setSkin(skinId)`, arranca con `classic` y no lee `localStorage` ni crea DOM; el selector y la persistencia (clave `arcade-vault:skin:fruit-snake`) los gestiona el reproductor, y el id se registra en `skin-registry.ts`. Se elimina `skin-selector.ts`. El bucle redibuja cada cuadro, también en pausa y tras el fin de partida, así que `setSkin` solo asigna la skin. Los valores de las 4 skins y el concepto de `experimental` (recortes de papel) no cambian. **No:** mantener el selector propio.
- **Sí:** trabajo en la rama actual, sin crear ni cambiar ramas, por indicación del usuario (otros agentes trabajan en paralelo); sin commits.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `shadowBlur` en `neon` con serpientes largas (hasta 1200 segmentos) | Un solo `save/restore` por segmento y blur de 12 px; la serpiente real rara vez supera unos cientos de segmentos. |
| El selector tapa una casilla de la esquina inferior derecha | Resuelto por SPEC 14: el selector vive en la barra del reproductor, fuera del canvas, y ya no tapa ninguna casilla. |
| Un `<select>` enfocado captura las flechas | `blur()` en `change` y `preventDefault` de `KeyboardInput`. |
| Bloques de 2 px dejan uvas diminutas en `pixel-art` | Radio de 3,5 px produce bloques de 4×4 a 6×6 px, aún legibles; la fruta se distingue por color y silueta. |
| `localStorage` bloqueado o inválido | `try/catch` y respaldo a `classic`. |
| Selector duplicado con Strict Mode | Resuelto por SPEC 14: el motor ya no crea DOM; el selector es único y lo gestiona el reproductor. |

---

## Qué **no** entra en esta spec

- Cambios de jugabilidad, puntuación, `GameSnapshot` o leaderboard.
- Skins de otros juegos.
- Imágenes, sonido o fuentes nuevas.
- Reestilizar el HUD de React, el marco CRT o los modales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
