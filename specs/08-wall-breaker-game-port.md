# SPEC 08 — Port del juego de romper bloques a TypeScript (WALL BREAKER)

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-11-19
> **Objective:** Portar el juego de paleta y bloques de `references/started-games/04-arkanoid` a un motor TypeScript sobre canvas, conectado al Reproductor de `/games/wall-breaker/play`, con su tarjeta WALL BREAKER en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

El juego de paleta, pelota y bloques existe como `references/started-games/04-arkanoid/`. Son tres archivos de lógica: `game.js` (~270 líneas, globals, búsquedas en el DOM, su propio `requestAnimationFrame`), `levels.js` (5 niveles) y `assets/spritesheet.js` (carga y recorte de un spritesheet). Esta spec lo convierte en el **tercer juego real de la plataforma**. Sigue el patrón de SPEC 05: motor TypeScript sin React, registro por id y `GameCanvas` dentro de `GamePlayer`. También sigue el de SPEC 06: una fila en `public.games` con `accepts_scores = true` para que las puntuaciones lleguen al ranking.

Reutiliza el código compartido que SPEC 07 creó en `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts`, `math.ts`). No hay paso de generalización.

El original dibuja con `assets/spritesheet-breakout.png`, un pack de terceros ("Made by Petraheim — Credits Appreciated"). El port no lo copia: dibuja con formas vectoriales planas, con los mismos tamaños y colores aproximados.

La tarjeta usa un título propio de la plataforma, WALL BREAKER (`wall-breaker`), y describe el género sin nombrar el juego comercial. La tarjeta simulada `brick-buster` (BRICK BUSTER) no se toca.

---

## Alcance

**Dentro:**

- Motor en `src/lib/games/wall-breaker/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes (`constants.ts`).
  - Los cinco niveles (`levels.ts`), como datos.
  - La entrada de ratón sobre el canvas (`canvas-pointer-input.ts`).
  - La paleta (`paddle.ts`), la pelota (`ball.ts`), los bloques y sus explosiones (`block.ts`).
  - La clase `WallBreakerEngine`, con la fábrica `createWallBreakerEngine` que cumple `GameEngineFactory`.
- Entrada `"wall-breaker"` en `GAME_ENGINE_FACTORIES` (`src/lib/games/engine-registry.ts`). `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad portada de `game.js` y `levels.js`:
  - Paleta de 81×14 px en y = 560. Empieza centrada horizontalmente (x = 359,5).
  - Pelota de 16×16 px. Aparece apoyada sobre la paleta, centrada en ella, y sale ya en movimiento (no hay saque).
  - Velocidad de la pelota al aparecer: `vx = 200 × multiplicador`, `vy = −300 × multiplicador` px/s, con el multiplicador del nivel.
  - La pelota rebota en las paredes izquierda, derecha y superior: se recoloca dentro del borde y su componente se fuerza hacia dentro.
  - Rebote en la paleta: solo si la pelota baja (`vy > 0`), se solapa en horizontal con la paleta y su borde inferior está entre `y = 560` y `y = 560 + 14 + 8`. La pelota se coloca encima de la paleta y `vy` pasa a negativo. `vx` no cambia, así que el ángulo nunca varía.
  - Bloques en una rejilla de 10 columnas × 6 filas de celdas de 64×24 px, con origen en (80, 80).
  - Colisión con bloques por solapamiento de rectángulos (AABB). Como mucho un bloque por cuadro, el primero en el orden del nivel. El bloque se destruye de un golpe, suma 10 puntos e invierte `vy`.
  - Cada bloque destruido deja una explosión de 0,15 s en 4 cuadros.
  - Al destruir el último bloque de los niveles 1 a 4 se carga el siguiente nivel. Las explosiones se borran, la paleta se queda donde está y la pelota vuelve a aparecer sobre ella con la velocidad del nuevo nivel.
  - Al destruir el último bloque del nivel 5 la partida termina con victoria (`onGameOver` con la puntuación final).
  - Si la pelota baja de `y = 600` se pierde una vida. Si quedan vidas, la pelota vuelve a aparecer sobre la paleta (que no se recoloca) con la velocidad del nivel actual. Si no quedan, la partida termina.
  - Orden de cada cuadro en `playing`, igual que el original: paleta, movimiento de la pelota, paredes, paleta, bloques, explosiones, pelota perdida.
- Los cinco niveles de `levels.js`, con sus patrones, colores y multiplicadores:
  1. Rejilla completa de 10×6 (60 bloques), ×1,00.
  2. Pirámide (40 bloques), ×1,10.
  3. Tablero de ajedrez (30 bloques), ×1,21.
  4. Filas con huecos (39 bloques), ×1,33.
  5. Marco con cruz central (39 bloques), ×1,46.
- Controles:
  - `ArrowLeft`/`ArrowRight` (`KeyboardEvent.code`), mantenidas: mueven la paleta a 400 px/s, sin salir del canvas.
  - Ratón sobre el canvas: la paleta se centra en la x del cursor, convertida a coordenadas lógicas de 800 px y limitada a los bordes.
  - Mientras la partida está en curso, las flechas no desplazan la página.
  - `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - 10 puntos por bloque destruido. El máximo posible es 208 bloques × 10 = 2.080 puntos.
  - `lives` empieza en 3 y baja en 1 con cada pelota perdida. Al llegar a 0 la partida termina.
  - `level` = número del nivel actual, de 1 a 5.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT. El juego ocupa el canvas entero, como el original.
- Estilo vectorial plano sobre fondo negro, con los tonos del spritesheet original (valores en el modelo de datos).
- Indicadores propios del juego dibujados en el canvas: ninguno. El motor no dibuja puntuación, vidas, nivel, PAUSA, GAME OVER ni el mensaje de victoria.
- Nueva tarjeta `wall-breaker` (WALL BREAKER) al final de `GAMES`, con su portada `cover-wall-breaker` en `globals.css`.
- Migración en Supabase que inserta `wall-breaker` en `public.games` con `accepts_scores = true`. Así sus puntuaciones se guardan y aparecen en el ranking, el Salón de la Fama y las estadísticas.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas (`deltaSeconds`, no `dt`; `context`, no `ctx`).

**Fuera de alcance (para otras specs):**

- El spritesheet del original y cualquier imagen externa.
- Los sonidos de rebote y de rotura de bloque.
- El selector de nivel 1–5 del overlay de pausa del original.
- Mecánicas que no existen en el original: ángulo de rebote según el punto de impacto, saque manual, power-ups, bloques de varios golpes, más de 5 niveles o ciclo de niveles.
- Usar el nombre comercial del juego en la tarjeta o en la UI.
- Reestilizar el juego con los colores neón de la plataforma.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `brick-buster`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/wall-breaker/constants.ts
// Values ported unchanged from references/started-games/04-arkanoid/game.js and assets/spritesheet.js,
// except the colors (new: vector drawing replaces the third-party spritesheet).
export const GAME_KEY_CODES = ["ArrowLeft", "ArrowRight"] as const;
export const INITIAL_LIVES = 3;

export const PADDLE_WIDTH_PIXELS = 81;
export const PADDLE_HEIGHT_PIXELS = 14;
export const PADDLE_TOP_PIXELS = 560;
export const PADDLE_SPEED_PIXELS_PER_SECOND = 400;
export const PADDLE_BOUNCE_TOLERANCE_PIXELS = 8;   // extra depth below the paddle that still counts as a hit

export const BALL_SIZE_PIXELS = 16;
export const BASE_BALL_HORIZONTAL_VELOCITY_PIXELS_PER_SECOND = 200;
export const BASE_BALL_VERTICAL_VELOCITY_PIXELS_PER_SECOND = -300;

export const BLOCK_COLUMNS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_WIDTH_PIXELS = 64;
export const BLOCK_HEIGHT_PIXELS = 24;
export const BLOCKS_ORIGIN_LEFT_PIXELS = 80;       // (CANVAS_WIDTH − 10 × 64) / 2
export const BLOCKS_ORIGIN_TOP_PIXELS = 80;

export const POINTS_PER_BLOCK = 10;

export const EXPLOSION_DURATION_SECONDS = 0.15;
export const EXPLOSION_FRAME_ALPHAS = [1, 0.75, 0.5, 0.25] as const;   // one per frame
export const EXPLOSION_FRAME_SCALES = [1, 0.8, 0.6, 0.4] as const;     // size relative to the block, centered

// Drawing (flat vector, tones of the original spritesheet)
export type BlockColor = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
export const BLOCK_FILL_COLORS: Record<BlockColor, string> = {
  red: "#d83a4a", yellow: "#e8b830", cyan: "#3aa8e0", magenta: "#7a4ee0",
  hotpink: "#e05aa0", green: "#3cc08a", gray: "#6a6a7a",
};
export const BLOCK_INSET_PIXELS = 1;
export const BLOCK_HIGHLIGHT_HEIGHT_PIXELS = 3;
export const BLOCK_HIGHLIGHT_COLOR = "rgba(255,255,255,0.25)";
export const PADDLE_COLOR = "#d8d8e0";
export const PADDLE_END_COLOR = "#d83a4a";
export const PADDLE_END_WIDTH_PIXELS = 6;
export const BALL_COLOR = "#e0e0e8";
```

```ts
// src/lib/games/wall-breaker/levels.ts
// Ported unchanged from references/started-games/04-arkanoid/levels.js.
type LevelBlock = { column: number; row: number; color: BlockColor };
type LevelDefinition = { ballSpeedMultiplier: number; blocks: readonly LevelBlock[] };
export const LEVEL_DEFINITIONS: readonly LevelDefinition[]; // 5 entries, built once at module load (immutable data)
```

Patrones de `levels.js` (fila 0 arriba, columna 0 a la izquierda):

| Nivel | Bloques | Regla | Colores por fila (0–5) | Multiplicador |
| --- | --- | --- | --- | --- |
| 1 | 60 | Todas las celdas | red, yellow, cyan, magenta, hotpink, green | 1,00 |
| 2 | 40 | Columnas `inicio[fila]`–`fin[fila]` con inicio `[4, 3, 2, 1, 0, 0]` y fin `[5, 6, 7, 8, 9, 9]` | gray, cyan, hotpink, yellow, magenta, green | 1,10 |
| 3 | 30 | `(columna + fila) % 2 === 0` | yellow en filas 0–2, magenta en filas 3–5 | 1,21 |
| 4 | 39 | Todas menos los huecos por fila `[2,5,8]`, `[0,4,7,9]`, `[1,3,6]`, `[2,5,8,9]`, `[0,4,7]`, `[1,3,6,9]` | cyan, magenta, green, yellow, hotpink, red | 1,33 |
| 5 | 39 | Marco (columna 0 o 9, fila 0 o 5) o cruz (columna 4 o fila 2) | cyan en el marco, hotpink en la cruz fuera del marco | 1,46 |

El orden de los bloques de cada nivel es el del original: por filas de arriba abajo y, dentro de cada fila, de izquierda a derecha. Ese orden decide qué bloque se rompe cuando la pelota toca dos a la vez.

```ts
// src/lib/games/wall-breaker/ entities (internal shapes)
type Rectangle = { x: number; y: number; width: number; height: number };
// Paddle: Rectangle; update(deltaSeconds, input, pointerTargetX | null); draw(context)
// Ball: Rectangle + { horizontalVelocity, verticalVelocity }; resetOnPaddle(paddle, multiplier); draw(context)
// Block: Rectangle + { color: BlockColor; isDestroyed: boolean }; draw(context)
// Explosion: Rectangle + { color: BlockColor; elapsedSeconds: number; isDead: boolean }; update(deltaSeconds); draw(context)
```

```ts
// src/lib/games/wall-breaker/canvas-pointer-input.ts
// new CanvasPointerInput(canvas: HTMLCanvasElement)
// attach() / detach(): "mousemove" listener on the canvas only.
// consumeTargetX(): number | null — last cursor x in logical pixels
//   ((clientX − rect.left) × CANVAS_WIDTH / rect.width) since the previous call, or null.
```

```ts
// src/lib/games/wall-breaker/wall-breaker-engine.ts (internal state, not exported)
type WallBreakerPhase = "playing" | "game-over";
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "wall-breaker",
  title: "WALL BREAKER",
  shortDescription: "Desvía la pelota con la paleta y derriba muros de bloques.",
  longDescription:
    "Mueve la paleta con las flechas o el ratón y mantén la pelota en juego para romper cada bloque del muro. Son cinco muros con patrones distintos, y en cada uno la pelota va un 10 % más rápida. Tienes tres vidas para limpiarlos todos.",
  category: "ARCADE",
  coverClassName: "cover-wall-breaker",
  accentColor: "magenta",
}
```

```sql
-- supabase/migrations/<timestamp>_add_wall_breaker_game.sql
insert into public.games (id, title, accepts_scores) values ('wall-breaker', 'WALL BREAKER', true);
```

Dibujo (800×600, fondo `#000`, en este orden):

- **Bloques vivos:** rectángulo de su celda reducido en 1 px por lado (62×22), relleno con `BLOCK_FILL_COLORS[color]`. Encima, una franja superior de 3 px con `rgba(255,255,255,0.25)`.
- **Explosiones:** el cuadro actual es `min(floor(elapsedSeconds / 0,15 × 4), 3)`. Se dibuja el rectángulo del bloque escalado por `EXPLOSION_FRAME_SCALES[cuadro]` y centrado en el bloque, con su color y `globalAlpha = EXPLOSION_FRAME_ALPHAS[cuadro]`.
- **Paleta:** rectángulo de 81×14 `#d8d8e0`, con 6 px `#d83a4a` en cada extremo.
- **Pelota:** círculo `#e0e0e8` de radio 8, centrado en su caja de 16×16. La colisión sigue siendo con la caja.

Convenciones:

- Coordenadas con origen arriba a la izquierda. Posiciones en píxeles lógicos (esquina superior izquierda de cada caja), velocidades en px/s y tiempos en segundos (`deltaSeconds` con tope `MAXIMUM_FRAME_SECONDS`).
- Entidades con `update(deltaSeconds)` / `draw(context)`. Las explosiones se eliminan cuando `isDead` (`elapsedSeconds ≥ 0,15`).
- La paleta en cada cuadro de `playing`: primero el destino del ratón (si `consumeTargetX()` devuelve un valor), después las flechas mantenidas.
- En pausa no avanza nada: ni la pelota, ni la paleta, ni las explosiones. Los movimientos del ratón hechos en pausa se descartan (`consumeTargetX()` se llama y se ignora), así que la paleta no salta al reanudar.
- En `game-over` solo terminan de animarse las explosiones. La paleta y la pelota se quedan quietas.
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo:
  - `score` = puntuación del original.
  - `lives` = vidas del original: 3 al empezar y 0 al perder la última. Con victoria o con el botón FIN se quedan como estaban.
  - `level` = nivel actual, 1–5.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Constantes.**
   - Crear `src/lib/games/wall-breaker/constants.ts` con los valores del modelo de datos y el comentario de port.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Niveles.**
   - Crear `levels.ts` con `LEVEL_DEFINITIONS`: los cinco niveles de la tabla del modelo de datos, en el orden de bloques del original.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan, y los niveles tienen 60, 40, 30, 39 y 39 bloques.
3. **Entrada de ratón.**
   - Crear `canvas-pointer-input.ts` con `CanvasPointerInput`, como se describe en el modelo de datos.
   - `detach()` quita el listener y borra el destino pendiente.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Paleta y pelota.**
   - Crear `paddle.ts`: posición inicial centrada, `update` con destino del ratón y flechas a 400 px/s, límites del canvas y dibujo.
   - Crear `ball.ts`: `resetOnPaddle` (centrada sobre la paleta, velocidades base × multiplicador), movimiento, rebote en paredes y dibujo.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Bloques y explosiones.**
   - Crear `block.ts` con la creación de bloques de un nivel (celda → píxeles con el origen (80, 80)), el dibujo del bloque y la clase de la explosión de 4 cuadros.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
6. **Motor.**
   - Crear `wall-breaker-engine.ts` con `WallBreakerEngine` y `createWallBreakerEngine`, siguiendo las reglas de ciclo de vida de la guía:
     - Estado: paleta, pelota, bloques, explosiones, puntuación, vidas, nivel, fase, `KeyboardInput` con `GAME_KEY_CODES` y `CanvasPointerInput`.
     - Bucle con `requestAnimationFrame` idempotente.
     - Cada cuadro en `playing`, en el orden del alcance: paleta, pelota, paredes, rebote en paleta, un bloque como máximo, explosiones, pelota perdida.
     - Último bloque: siguiente nivel en los niveles 1–4; `finishGame()` en el nivel 5, sin procesar el resto del cuadro.
     - Pelota perdida: restar una vida; `resetOnPaddle` si quedan, `finishGame()` si no.
     - En pausa: descartar el destino del ratón y no avanzar nada.
     - `startNewGame()` reinicia todo: puntuación 0, 3 vidas, nivel 1, paleta centrada, bloques del nivel 1, explosiones vacías, pelota sobre la paleta. Vuelve a enganchar teclado y ratón.
     - `finishGame()` y `destroy()` desenganchan teclado y ratón.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
7. **Tarjeta del catálogo.**
   - Añadir `wall-breaker` al final de `GAMES`.
   - Añadir `.cover-wall-breaker` en `globals.css`, junto a `.cover-block-stack`:
     - Fondo `radial-gradient(circle at 50% 40%, #1a0f2a, #000)`.
     - Un `::after` con un SVG en data URI (`#` escapado como `%23`).
     - El SVG dibuja tres filas de bloques en los colores de `BLOCK_FILL_COLORS` con dos huecos rotos, la paleta abajo (gris con extremos rojos) y la pelota a media altura con una estela de tres círculos que se desvanecen.
   - Hasta el paso 8 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta WALL BREAKER junto a BRICK BUSTER, `/games/wall-breaker` carga y `npm run build` pasa.
8. **Registro.**
   - Añadir `"wall-breaker": createWallBreakerEngine` en `engine-registry.ts`.
   - Verificación: `/games/wall-breaker/play` se juega de verdad. `/games/asteroids/play`, `/games/block-stack/play` y `/games/brick-buster/play` no cambian.
9. **Leaderboard.**
   - Aplicar con `apply_migration` (`add_wall_breaker_game`) el `insert` del modelo de datos.
   - Guardar el mismo SQL en `supabase/migrations/<timestamp>_add_wall_breaker_game.sql`, con el timestamp de `list_migrations`.
   - Revisar `get_advisors` (seguridad y rendimiento).
   - Verificación: `public.games` tiene `wall-breaker` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/wall-breaker`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/wall-breaker/play` arranca directamente:
  - Muro del nivel 1: 10×6 bloques desde (80, 80), con filas red, yellow, cyan, magenta, hotpink, green.
  - Paleta centrada en y = 560 y la pelota sobre ella, ya subiendo en diagonal hacia la derecha.
  - HUD en 0 / 3 vidas / 01.
- [ ] `ArrowLeft`/`ArrowRight` mantenidas mueven la paleta a 400 px/s (el ancho del canvas en unos 1,8 s) sin salir de los bordes.
- [ ] Al mover el ratón sobre el canvas la paleta se centra en el cursor, también con el canvas escalado (≤ 480 px), y no sale de los bordes.
- [ ] La pelota rebota en las paredes izquierda, derecha y superior, y en la paleta solo cuando baja. Su ángulo no cambia en ningún rebote.
- [ ] Cada bloque tocado desaparece al primer golpe, suma exactamente 10 puntos, invierte la dirección vertical de la pelota y deja una explosión que se encoge y se desvanece en 0,15 s.
- [ ] Al vaciar un muro se carga el siguiente con la pelota de nuevo sobre la paleta. El HUD muestra el nivel 02, 03, 04 o 05, y la pelota va ×1,10, ×1,21, ×1,33 o ×1,46 respecto al nivel 1.
- [ ] Los muros 2–5 tienen la forma de la tabla del modelo de datos: pirámide (40), ajedrez (30), filas con huecos (39) y marco con cruz (39).
- [ ] Si la pelota cae por debajo de la paleta, las vidas bajan en 1 y la pelota reaparece sobre la paleta, que no se mueve de sitio.
- [ ] Al vaciar el muro del nivel 5 se abre el modal "FIN DEL JUEGO" con 2.080 puntos (si no se perdió ningún bloque) y las vidas que quedaban.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA, GAME OVER ni mensaje de victoria, ni carga ninguna imagen.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego (`ArrowLeft`, `ArrowRight`) funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA":
  - La pelota, la paleta y las explosiones se congelan.
  - Mover el ratón o pulsar las flechas no mueve la paleta.
  - Al reanudar no hay saltos.
- [ ] Al perder la última vida el HUD muestra "—" en vidas y se abre el modal "FIN DEL JUEGO" con la puntuación real. El motor deja de procesar teclas y ratón, y se puede escribir en el modal.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle (la pelota va igual de rápida que en la primera partida):
  - Puntuación 0, 3 vidas y nivel 1.
  - Muro del nivel 1 completo, paleta centrada y pelota sobre ella.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor y quita los listeners. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'wall-breaker'`. La marca aparece en `/games/wall-breaker` y en `/hall-of-fame?game=wall-breaker`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `wall-breaker` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] `/games/asteroids/play` y `/games/block-stack/play` funcionan igual que antes, y `/games/brick-buster/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta WALL BREAKER (ARCADE, acento magenta) al final, y la tarjeta BRICK BUSTER conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con el HUD, la pausa y el modal del Reproductor (patrón de SPEC 05). **No:** el Score/Nivel/vidas, los overlays de GAME OVER y de victoria ni la pausa propia del original dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600, que el original ya usaba, sin paneles laterales. **No:** un tamaño de canvas propio del juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas: la fila nueva basta.
- **Sí:** reutilizar `shared/` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MAXIMUM_FRAME_SECONDS`, `KeyboardInput`) creado en SPEC 07. **No:** copiar código compartido en `wall-breaker/`.
- **Sí:** port fiel de la jugabilidad de `game.js` y `levels.js`: tamaños, velocidades, multiplicadores, puntos, vidas, cinco muros y orden de cada cuadro. **No:** mecánicas nuevas.
- **Sí:** el rebote en la paleta solo invierte `vy` y el ángulo nunca cambia, como el original. Decisión del usuario. **No:** ángulo según el punto de impacto (otra spec de jugabilidad).
- **Sí:** dibujo vectorial plano con tonos aproximados al spritesheet (rojo `#d83a4a`, amarillo `#e8b830`, etc.). Decisión del usuario. El PNG es un pack de terceros que pide créditos y el catálogo no usa imágenes externas. **No:** copiar el spritesheet a `public/`. **No:** reestilizar en neón.
- **Sí:** explosión vectorial de 4 cuadros en 0,15 s que encoge (100/80/60/40 %) y desvanece (100/75/50/25 %) el bloque. Decisión del usuario. Conserva la duración y el número de cuadros del original. El bloque gris explota en gris (el original reutilizaba los cuadros rojos). **No:** fragmentos. **No:** quitar la explosión.
- **Sí:** teclado y ratón. Decisión del usuario. El motor escucha `mousemove` solo en su propio canvas, convierte la x a coordenadas lógicas y desengancha el listener al terminar o destruirse. **No:** solo teclado. **No:** cambiar `GameCanvas` para que gestione el ratón.
- **Sí:** el ratón solo mueve la paleta dentro de `update`, así que respeta la pausa. El original movía la paleta en el propio evento, incluso en pausa. **No:** mover la paleta desde el listener.
- **Sí:** vaciar el nivel 5 termina la partida con `onGameOver` y la puntuación final (máximo 2.080). Decisión del usuario. **No:** volver al nivel 1 en bucle, que el original no hace.
- **Sí:** tarjeta nueva `wall-breaker` con título WALL BREAKER, categoría ARCADE y acento magenta. Decisión del usuario. Se distingue de BRICK BUSTER (cian) y de BLOCK STACK (amarillo), su vecina al final del catálogo. **No:** convertir la simulación `brick-buster`. **No:** el nombre comercial del juego.
- **Sí:** `lives` = las 3 vidas del original y `level` = nivel actual 1–5. Encajan sin cambiar el contrato.
- **Sí:** fuera de alcance los sonidos, el selector de nivel 1–5 del original, táctil/mando/teclas configurables y power-ups o bloques duros. La pregunta llegó sin respuesta y se aplicaron los valores por defecto del port; se pueden revisar antes de aprobar la spec.
- **Sí:** tope `MAXIMUM_FRAME_SECONDS` en `deltaSeconds`. El original no lo tenía y la pelota podía atravesar bloques al volver a la pestaña.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners (teclado y ratón) | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`, que desengancha `KeyboardInput` y `CanvasPointerInput`. Criterios explícitos. |
| Las flechas desplazan la página o activan el botón enfocado | Ambas en `GAME_KEY_CODES` con `preventDefault`; se verifica con PAUSA enfocado. |
| Al reanudar o volver a la pestaña el primer `deltaSeconds` es enorme | Marca de tiempo reiniciada en pausa y tope de 0,05 s. A ×1,46 la pelota baja como mucho 21,9 px por cuadro: menos que el alto de un bloque (24) y que la ventana de rebote de la paleta (22). |
| La x del ratón no coincide con la paleta con el canvas escalado por CSS | La conversión usa `getBoundingClientRect()` en cada evento; criterio a ≤ 480 px. |
| El rebote fijo y la colisión AABB del original producen trayectorias repetitivas o rebotes raros al tocar un bloque de lado | Comportamiento heredado; se acepta como port fiel. Cambiarlo sería una spec de jugabilidad aparte. |
| Puntuación por encima de 9.999.999 | Imposible: el máximo es 2.080. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- El spritesheet del original, los sonidos y el selector de nivel de su pausa.
- Mecánicas nuevas: ángulo según el impacto, saque manual, power-ups, bloques duros, más niveles o ciclo de niveles.
- El nombre comercial del juego en la UI y el restyle neón.
- Controles táctiles, mando, teclas configurables y nitidez en alta densidad.
- Cambios en `GameSnapshot`, `GamePlayer`, `GameCanvas` o el leaderboard.
- Convertir `brick-buster`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
