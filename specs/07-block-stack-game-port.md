# SPEC 07 — Port del juego de bloques que caen a TypeScript (BLOCK STACK)

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-11-19
> **Objective:** Portar el juego de bloques de `references/started-games/03-tetris` a un motor TypeScript sobre canvas, conectado al Reproductor de `/games/block-stack/play`, con su tarjeta BLOCK STACK en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

El juego de piezas que caen existe como `references/started-games/03-tetris/`. Son tres archivos: `game.js` (~305 líneas, `'use strict'`, globals, búsquedas en el DOM), `index.html` y `style.css`. Esta spec lo convierte en el **segundo juego real de la plataforma**. Sigue el patrón de SPEC 05: motor TypeScript sin React, registro por id y `GameCanvas` dentro de `GamePlayer`. También sigue el de SPEC 06: una fila en `public.games` con `accepts_scores = true` para que las puntuaciones lleguen al ranking.

Como es el segundo juego real, primero extrae a `src/lib/games/shared/` el código que hoy solo vive en `asteroids/`: tamaño del canvas, `KeyboardInput` y utilidades matemáticas.

La tarjeta usa un título propio de la plataforma, BLOCK STACK (`block-stack`), y describe el género sin nombrar el juego comercial. La tarjeta simulada `block-fall` (BLOCK FALL) no se toca.

---

## Alcance

**Dentro:**

- `src/lib/games/shared/` con tres archivos movidos desde `asteroids/`, sin cambiar el comportamiento de Asteroids:
  - `canvas.ts`: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MAXIMUM_FRAME_SECONDS`.
  - `keyboard-input.ts`: recibe las teclas del juego por constructor.
  - `math.ts`.
- Asteroids y `GameCanvas` importan esos archivos desde `shared/`.
- Motor en `src/lib/games/block-stack/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes.
  - El tablero (`board.ts`) y las piezas (`piece.ts`), como funciones puras.
  - El repetidor de teclas mantenidas (`held-key-repeater.ts`).
  - El dibujo (`block-stack-renderer.ts`).
  - La clase `BlockStackEngine`, con la fábrica `createBlockStackEngine` que cumple `GameEngineFactory`.
- Entrada `"block-stack"` en `GAME_ENGINE_FACTORIES` (`src/lib/games/engine-registry.ts`). `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad portada de `game.js`:
  - Tablero de 10 columnas × 20 filas, con celdas de 30 px.
  - Las 7 piezas de cuatro bloques del original: I, O, T, S, Z, J, L. Cada nueva pieza se sortea con la misma probabilidad entre las 7 usando `Math.random()`. La 8.ª pieza del original ("tuerca") **no** se porta.
  - Cada pieza aparece en la fila 0, en la columna `floor(10 / 2) − floor(anchoDeSuMatriz / 2)`. La I aparece en la columna 3 y las demás en la 4.
  - Rotación solo en sentido horario (transponer e invertir filas). Si la pieza rotada choca, se prueban en orden los desplazamientos horizontales `0, −1, +1, −2, +2`. Si ninguno cabe, la pieza no rota.
  - Caída automática cada `max(0,1, 1 − (nivel − 1) × 0,09)` s. El tiempo se acumula con `deltaSeconds` y el acumulador vuelve a 0 en cada caída.
  - No hay retardo de bloqueo. Si la pieza no puede bajar al caer (por gravedad o por soft drop), se fija en el acto.
  - Al fijar una pieza se eliminan las filas completas, las de encima bajan y aparece la siguiente pieza.
  - Pieza fantasma: la silueta de la pieza actual en la fila donde aterrizaría, con alpha 0,2.
  - Si la pieza nueva choca al aparecer, la partida termina.
- Repetición de teclas mantenidas (sustituye al auto-repeat del sistema operativo, del que dependía el original):
  - Afecta a `ArrowLeft`, `ArrowRight` y `ArrowDown`.
  - La acción se ejecuta al pulsar. Si la tecla sigue mantenida, se repite a los 0,17 s y después cada 0,05 s.
  - Los temporizadores avanzan con `deltaSeconds`, así que no avanzan en pausa.
- Controles (`KeyboardEvent.code`):
  - `ArrowLeft`/`ArrowRight`: mover una columna. Se repiten si se mantienen.
  - `ArrowDown`: soft drop, una fila. Se repite si se mantiene.
  - `ArrowUp` o `KeyX`: rotar. Una vez por pulsación.
  - `Space`: hard drop. Una vez por pulsación.
  - Mientras la partida está en curso, esas teclas no desplazan la página.
  - `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - Puntos por líneas eliminadas a la vez: `[0, 100, 300, 500, 800][líneas] × nivel`, con el nivel anterior a la subida.
  - Soft drop: +1 punto por fila bajada.
  - Hard drop: +2 puntos por fila recorrida.
  - `lives` vale 1 durante la partida y pasa a 0 cuando la pieza nueva no cabe.
  - `level` = `floor(líneasTotales / 10) + 1`.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT.
  - El tablero de 300×600 va centrado: columna 0 en x = 250, fila 0 en y = 0.
  - Quedan 250 px libres a cada lado.
  - Estilo fiel al original sobre fondo negro.
- Indicadores propios del juego dibujados en el canvas:
  - Panel izquierdo: el contador "LÍNEAS" y la lista de controles.
  - Panel derecho: la vista "SIGUIENTE" con la próxima pieza.
  - El motor no dibuja puntuación, vidas, nivel, PAUSA ni GAME OVER.
- Nueva tarjeta `block-stack` (BLOCK STACK) al final de `GAMES`, con su portada `cover-block-stack` en `globals.css`.
- Migración en Supabase que inserta `block-stack` en `public.games` con `accepts_scores = true`. Así sus puntuaciones se guardan y aparecen en el ranking, el Salón de la Fama y las estadísticas.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas (`dropAccumulatedSeconds`, no `dropAccum`).

**Fuera de alcance (para otras specs):**

- La 8.ª pieza "tuerca" del original.
- Mecánicas que no existen en el original: retardo de bloqueo, rotación antihoraria, guardar pieza, bolsa de 7 piezas, más de una pieza en la vista previa.
- El tema claro y su botón.
- Usar el nombre comercial del juego en la tarjeta o en la UI.
- Reestilizar el juego con los colores neón de la plataforma.
- Un tope de puntuación en el motor.
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `block-fall`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/shared/canvas.ts — moved from asteroids/constants.ts
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MAXIMUM_FRAME_SECONDS = 0.05;

// src/lib/games/shared/keyboard-input.ts — moved from asteroids/
// new KeyboardInput(gameKeyCodes: readonly string[])
// Asteroids passes ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].
```

```ts
// src/lib/games/block-stack/constants.ts
// Values ported unchanged from references/started-games/03-tetris/game.js,
// except the "nut" piece (removed) and the key repeat (new: the original relied on OS auto-repeat).
export const GAME_KEY_CODES = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyX"] as const;
export const REPEATING_KEY_CODES = ["ArrowLeft", "ArrowRight", "ArrowDown"] as const;
export const INITIAL_LIVES = 1;

export const BOARD_COLUMNS = 10;
export const BOARD_ROWS = 20;
export const CELL_SIZE_PIXELS = 30;
export const BOARD_LEFT_PIXELS = 250;          // (CANVAS_WIDTH − 10 × 30) / 2
export const BOARD_TOP_PIXELS = 0;             // 20 × 30 = CANVAS_HEIGHT

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7; // I, O, T, S, Z, J, L
export const PIECE_SHAPES: Record<PieceType, number[][]> = {
  1: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  2: [[2,2],[2,2]],                             // O
  3: [[0,3,0],[3,3,3],[0,0,0]],                 // T
  4: [[0,4,4],[4,4,0],[0,0,0]],                 // S
  5: [[5,5,0],[0,5,5],[0,0,0]],                 // Z
  6: [[6,0,0],[6,6,6],[0,0,0]],                 // J
  7: [[0,0,7],[7,7,7],[0,0,0]],                 // L
};
export const PIECE_COLORS: Record<PieceType, string> = {
  1: "#4dd0e1", 2: "#ffd54f", 3: "#ba68c8", 4: "#81c784",
  5: "#e57373", 6: "#90caf9", 7: "#ffb74d",
};

export const ROTATION_KICK_OFFSETS = [0, -1, 1, -2, 2] as const;

export const INITIAL_DROP_INTERVAL_SECONDS = 1;
export const DROP_INTERVAL_DECREASE_PER_LEVEL_SECONDS = 0.09;
export const MINIMUM_DROP_INTERVAL_SECONDS = 0.1;
export const LINES_PER_LEVEL = 10;

export const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800] as const; // × level
export const SOFT_DROP_POINTS_PER_ROW = 1;
export const HARD_DROP_POINTS_PER_ROW = 2;

export const KEY_REPEAT_DELAY_SECONDS = 0.17;
export const KEY_REPEAT_INTERVAL_SECONDS = 0.05;

// Drawing (dark theme of style.css)
export const BOARD_BACKGROUND_COLOR = "#1a1a25";
export const BOARD_BORDER_COLOR = "#2a2a3a";
export const GRID_LINE_COLOR = "#22222e";
export const GRID_LINE_WIDTH_PIXELS = 0.5;
export const BLOCK_INSET_PIXELS = 1;
export const BLOCK_HIGHLIGHT_HEIGHT_PIXELS = 4;
export const BLOCK_HIGHLIGHT_COLOR = "rgba(255,255,255,0.12)";
export const GHOST_PIECE_ALPHA = 0.2;
export const PANEL_LABEL_COLOR = "#555570";
export const PANEL_VALUE_COLOR = "#7aa2f7";
export const PANEL_TEXT_COLOR = "#888888";
export const NEXT_PREVIEW_SIZE_CELLS = 4;      // 4 × 30 = 120 px box
```

```ts
// src/lib/games/block-stack/board.ts and piece.ts (pure functions, no drawing)
type Board = number[][];   // BOARD_ROWS × BOARD_COLUMNS; 0 = empty, 1–7 = PieceType of the locked block
type FallingPiece = { type: PieceType; shape: number[][]; column: number; row: number };
```

```ts
// src/lib/games/block-stack/block-stack-engine.ts (internal state, not exported)
type BlockStackPhase = "playing" | "game-over";
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "block-stack",
  title: "BLOCK STACK",
  shortDescription: "Gira y encaja bloques que caen para limpiar líneas.",
  longDescription:
    "Siete piezas de cuatro bloques caen sobre un pozo de 10×20. Muévelas, gíralas o suéltalas de golpe para completar filas, guiado por la sombra que marca dónde aterrizarán. Cada 10 líneas sube el nivel y la caída se acelera.",
  category: "PUZZLE",
  coverClassName: "cover-block-stack",
  accentColor: "yellow",
}
```

```sql
-- supabase/migrations/<timestamp>_add_block_stack_game.sql
insert into public.games (id, title, accepts_scores) values ('block-stack', 'BLOCK STACK', true);
```

Distribución del canvas (800×600, fondo `#000`):

- **Tablero:**
  - Rectángulo de x 250–550, y 0–600, relleno de `#1a1a25` y con un borde de 1 px `#2a2a3a`.
  - Rejilla interior de 0,5 px `#22222e`.
  - Cada bloque se dibuja como un cuadrado de 28 px (1 px de margen por lado), con una franja superior de 4 px `rgba(255,255,255,0.12)`.
- **Panel izquierdo** (x = 40), en `"Courier New", monospace`:
  - Etiqueta "LÍNEAS" (negrita 12 px, `#555570`) en y = 48.
  - Valor (negrita 32 px, `#7aa2f7`) en y = 88.
  - Etiqueta "CONTROLES" (negrita 12 px, `#555570`) en y = 160.
  - Debajo, en 14 px `#888888`, a partir de y = 192 y cada 26 px: "← →  mover", "↑ / X  rotar", "↓  bajar", "ESPACIO  caída", "P / ESC  pausa".
- **Panel derecho** (x = 580):
  - Etiqueta "SIGUIENTE" (negrita 12 px, `#555570`) en y = 48.
  - Debajo, una caja de 120×120 en (580, 64), con relleno `#1a1a25` y borde `#2a2a3a`.
  - La próxima pieza va dentro de la caja, con celdas de 30 px y centrada con el desplazamiento `floor((4 − ancho) / 2)`, `floor((4 − alto) / 2)` del original.

Convenciones:

- Coordenadas con origen arriba a la izquierda. El tablero se indexa como `board[fila][columna]` y se dibuja en píxeles lógicos con `BOARD_LEFT_PIXELS + columna × 30`, `BOARD_TOP_PIXELS + fila × 30`.
- Es un juego de rejilla. La gravedad y la repetición de teclas acumulan `deltaSeconds` (tope `MAXIMUM_FRAME_SECONDS`) en temporizadores, nunca cuentan cuadros.
- Orden de cada cuadro en `playing`: primero las teclas (mover, rotar, soft drop, hard drop) y después la gravedad.
- `HeldKeyRepeater` solo arranca la repetición de una tecla tras una pulsación procesada (`consumePress`). Una tecla mantenida desde una pulsación descartada en pausa no repite hasta que se vuelva a pulsar.
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo:
  - `score` = puntuación del original.
  - `lives` = 1 en juego y 0 cuando la pieza nueva no cabe. Con el botón FIN se queda en 1.
  - `level` = `floor(líneas / 10) + 1`, sin tope.
  - Las líneas totales no van en el snapshot: solo se dibujan en el canvas.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Código compartido.**
   - Crear `src/lib/games/shared/canvas.ts` con `CANVAS_WIDTH`, `CANVAS_HEIGHT` y `MAXIMUM_FRAME_SECONDS`, y quitarlos de `asteroids/constants.ts`.
   - Mover `asteroids/keyboard-input.ts` a `shared/keyboard-input.ts`. El `Set` fijo de teclas pasa a ser el parámetro de constructor `gameKeyCodes: readonly string[]`. Asteroids pasa sus cinco teclas desde un `GAME_KEY_CODES` en `asteroids/constants.ts`.
   - Mover `asteroids/math.ts` a `shared/math.ts`.
   - Actualizar los imports de Asteroids y el de `src/components/game-canvas.tsx`.
   - Verificación: `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan, y `/games/asteroids/play` se juega igual que antes.
2. **Constantes.**
   - Crear `src/lib/games/block-stack/constants.ts` con los valores del modelo de datos y el comentario de port.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Tablero.**
   - Crear `board.ts` con estas funciones puras:
     - `createEmptyBoard()`.
     - `collidesWithBoard(board, shape, column, row)`: fuera de los laterales o del fondo, o encima de un bloque. Las filas negativas no chocan con bloques.
     - `mergePieceIntoBoard(board, piece)`.
     - `clearCompleteRows(board)`: elimina de abajo arriba las filas completas, inserta filas vacías arriba y devuelve cuántas eliminó.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Piezas.**
   - Crear `piece.ts` con estas funciones:
     - `createRandomPiece()`: tipo uniforme en 1–7, copia de la matriz y columna de aparición del original, fila 0.
     - `rotateShapeClockwise(shape)`.
     - `tryRotatePiece(board, piece)`: aplica `ROTATION_KICK_OFFSETS` en orden.
     - `findLandingRow(board, piece)`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Repetición de teclas.**
   - Crear `held-key-repeater.ts` con la clase `HeldKeyRepeater`. Recibe `KeyboardInput` y `REPEATING_KEY_CODES`.
   - Expone `update(deltaSeconds): string[]`, que devuelve las teclas cuya acción toca ejecutar en este cuadro:
     - La pulsación inicial.
     - La primera repetición a los `KEY_REPEAT_DELAY_SECONDS` mientras la tecla siga mantenida.
     - Las siguientes, cada `KEY_REPEAT_INTERVAL_SECONDS`.
   - Expone también `reset()`.
   - Al soltar la tecla, su temporizador se descarta.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
6. **Dibujo.**
   - Crear `block-stack-renderer.ts` con funciones que reciben el `context` y el estado y dibujan según la distribución del modelo de datos:
     - El fondo negro.
     - El tablero con su rejilla y los bloques fijados.
     - La pieza fantasma.
     - La pieza actual.
     - El panel izquierdo ("LÍNEAS" y controles).
     - El panel derecho ("SIGUIENTE").
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
7. **Motor.**
   - Crear `block-stack-engine.ts` con `BlockStackEngine` y `createBlockStackEngine`, siguiendo las reglas de ciclo de vida de la guía:
     - Estado: tablero, pieza actual, siguiente, puntuación, líneas, nivel, vidas, fase, acumulador de caída y repetidor.
     - Bucle con `requestAnimationFrame` idempotente.
     - Teclas: `consumePress` para rotar y hard drop, `HeldKeyRepeater` para mover y soft drop.
     - Gravedad con el intervalo por nivel.
     - Al fijar: fusionar, limpiar filas, puntuar con el nivel previo, recalcular nivel e intervalo, y hacer aparecer la siguiente pieza.
     - Si la pieza nueva no cabe: `lives = 0` y `finishGame()`.
     - En pausa: descartar las pulsaciones de las seis teclas y no avanzar ningún temporizador.
     - `startNewGame()` reinicia todo, incluido `HeldKeyRepeater.reset()`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
8. **Tarjeta del catálogo.**
   - Añadir `block-stack` al final de `GAMES`.
   - Añadir `.cover-block-stack` en `globals.css`, junto a `.cover-asteroids`:
     - Fondo `radial-gradient(circle at 50% 40%, #1a1a25, #000)`.
     - Un `::after` con un SVG en data URI (`#` escapado como `%23`).
     - El SVG dibuja un pozo con tres filas inferiores irregulares de bloques en los colores de `PIECE_COLORS`, una pieza T flotando arriba y su silueta fantasma (alpha 0,2) en el hueco donde aterrizaría.
   - Hasta el paso 9 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta BLOCK STACK junto a BLOCK FALL, `/games/block-stack` carga y `npm run build` pasa.
9. **Registro.**
   - Añadir `"block-stack": createBlockStackEngine` en `engine-registry.ts`.
   - Verificación: `/games/block-stack/play` se juega de verdad. `/games/asteroids/play` y `/games/block-fall/play` no cambian.
10. **Leaderboard.**
    - Aplicar con `apply_migration` (`add_block_stack_game`) el `insert` del modelo de datos.
    - Guardar el mismo SQL en `supabase/migrations/<timestamp>_add_block_stack_game.sql`, con el timestamp de `list_migrations`.
    - Revisar `get_advisors` (seguridad y rendimiento).
    - Verificación: `public.games` tiene `block-stack` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/block-stack`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/block-stack/play` arranca directamente:
  - Tablero vacío de 10×20 centrado (x 250–550) con su rejilla, sobre negro.
  - Una pieza en la fila superior y la siguiente en la caja "SIGUIENTE".
  - "LÍNEAS 0" y la lista de controles a la izquierda.
  - HUD en 0 / ♥ / 01.
- [ ] Solo aparecen las 7 piezas I, O, T, S, Z, J, L, con los colores de `PIECE_COLORS`. La "tuerca" de 3×3 nunca aparece.
- [ ] `ArrowLeft`/`ArrowRight` mueven la pieza una columna por pulsación. Mantenidas, repiten a los 0,17 s y luego cada 0,05 s. Ni las paredes ni los bloques fijados se atraviesan.
- [ ] `ArrowUp` o `KeyX` rotan la pieza 90° en sentido horario una vez por pulsación: mantenerlas no la hace girar sin parar. Pegada a una pared, la rotación prueba desplazamientos de 1 y 2 columnas. Si no cabe, la pieza no gira.
- [ ] `ArrowDown` baja la pieza una fila y suma 1 punto. Mantenida, repite igual que el movimiento lateral. Si la pieza no puede bajar, se fija en el acto.
- [ ] `Space` deja caer la pieza hasta la posición de la silueta fantasma, suma 2 puntos por fila recorrida y la fija. Mantener `Space` no suelta más piezas.
- [ ] La silueta fantasma se ve con alpha 0,2 en la fila donde aterrizaría la pieza y sigue sus movimientos y rotaciones.
- [ ] En el nivel 1 la pieza cae una fila por segundo. El intervalo es `max(0,1, 1 − (nivel − 1) × 0,09)` s: 0,91 s en el nivel 2 y 0,1 s desde el nivel 11.
- [ ] Eliminar 1, 2, 3 o 4 filas a la vez suma 100, 300, 500 u 800 puntos multiplicados por el nivel anterior a la eliminación. Las filas de encima bajan.
- [ ] El contador "LÍNEAS" del canvas suma las filas eliminadas. Cada 10 líneas el nivel del HUD sube en 1.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA ni GAME OVER.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Space`, `KeyX`) funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA":
  - La pieza no cae.
  - Las teclas mantenidas no repiten.
  - Las pulsaciones hechas en pausa se ignoran.
  - Al reanudar no hay saltos.
- [ ] Cuando la pieza nueva no cabe al aparecer, el HUD muestra "—" en vidas y se abre el modal "FIN DEL JUEGO" con la puntuación real. El motor deja de procesar teclas y se puede escribir con espacios en el modal.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle (la caída es igual de rápida que en la primera partida):
  - Puntuación 0, 1 vida, nivel 1 y "LÍNEAS 0".
  - Tablero vacío y piezas nuevas.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'block-stack'`. La marca aparece en `/games/block-stack` y en `/hall-of-fame?game=block-stack`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `block-stack` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] `/games/asteroids/play` funciona igual que antes (mismas teclas, sin scroll), y `/games/block-fall/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta BLOCK STACK (PUZZLE, acento amarillo) al final, y la tarjeta BLOCK FALL conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con el HUD, la pausa y el modal del Reproductor (patrón de SPEC 05). **No:** el SCORE/LEVEL, el overlay de PAUSA/GAME OVER ni el botón de reinicio del original dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 con el tablero de 300×600 centrado en x = 250, que llena el alto exacto. **No:** un canvas de 300×600 propio del juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas: la fila nueva basta.
- **Sí:** extraer a `shared/` el código de Asteroids que necesita cualquier juego, como primer paso aislado. **No:** copiar `keyboard-input.ts` y `math.ts` en `block-stack/`.
- **Sí:** port fiel de la jugabilidad de `game.js`: tablero, rotación con desplazamientos, fijado inmediato, puntos, velocidad y niveles. **No:** mecánicas que el original no tiene (retardo de bloqueo, rotación antihoraria, guardar pieza, bolsa de 7). Decisión del usuario.
- **Sí:** solo 7 piezas. Decisión del usuario. **No:** la 8.ª pieza "tuerca" de 3×3 con hueco, que estaba en el código pero no en el README del original.
- **Sí:** tarjeta nueva `block-stack` con título BLOCK STACK. Decisión del usuario, tras descartar TETRIS: es una marca comercial y la plataforma usa títulos propios. Además, el `id` es la clave de `scores`, y renombrarlo después exigiría migrar puntuaciones. **No:** convertir la simulación `block-fall`, que se queda como está.
- **Sí:** categoría PUZZLE y acento amarillo. Decisión del usuario; se distingue de BLOCK FALL (magenta) y de ASTEROIDS (cian), su vecina en el catálogo. **No:** magenta ni cian.
- **Sí:** repetición de teclas mantenidas dentro del motor (`HeldKeyRepeater`) para `ArrowLeft`, `ArrowRight` y `ArrowDown`: 0,17 s de espera y 0,05 s de intervalo. Decisión del usuario. El `KeyboardInput` compartido ignora el auto-repeat, y estos temporizadores respetan la pausa y no dependen del sistema operativo. **No:** una celda por pulsación (se juega peor que el original). **No:** ampliar `KeyboardInput` para contar los `keydown` repetidos, que tocaría código compartido con Asteroids.
- **Sí:** rotar y hard drop son de una sola pulsación. En el original el auto-repeat del sistema operativo también los repetía, pero la repetición acordada solo cubre mover y bajar. **No:** soltar piezas en ráfaga manteniendo `Space`.
- **Sí:** en el canvas se dibujan "SIGUIENTE", "LÍNEAS" y la lista de controles. Decisión del usuario; son datos propios del juego que el HUD no muestra. **No:** añadir las líneas al `GameSnapshot`: el contrato es común a todos los juegos.
- **Sí:** estilo fiel al original (paleta de piezas, tablero `#1a1a25`, rejilla `#22222e`, fantasma con alpha 0,2) sobre negro. Decisión del usuario. **No:** reestilizar en neón. **No:** el tema claro y su botón.
- **Sí:** `lives` = 1 en juego y 0 al no caber la pieza nueva. El juego no tiene vidas, y así el HUD muestra "—" al perder, como Asteroids. **No:** cambiar el contrato para juegos sin vidas.
- **Sí:** `level` = `floor(líneas / 10) + 1`, el del original. **No:** la fórmula por puntos de la simulación.
- **Sí:** sin tope de puntuación en el motor. Decisión del usuario. Superar 9.999.999 exige del orden de 1.000 líneas a 0,1 s por fila. Si ocurre, `saveScoreAction` devuelve `invalid`. **No:** recortar la puntuación dentro del motor.
- **Sí:** `Math.random()` sin semilla, sorteo uniforme como el original. **No:** azar determinista.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Mover el código compartido cambia el comportamiento de Asteroids | Paso 1 aislado, sin cambios de lógica. Asteroids pasa exactamente sus cinco teclas al constructor, y se verifica jugándolo antes de seguir. |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`; criterios explícitos. |
| Las teclas del juego desplazan la página o activan el botón enfocado | Las seis teclas están en `GAME_KEY_CODES` con `preventDefault`; se verifica con PAUSA enfocado. |
| Al reanudar o volver a la pestaña el primer `deltaSeconds` es enorme | Marca de tiempo reiniciada en pausa y tope `MAXIMUM_FRAME_SECONDS`. Con 0,05 s de tope, la gravedad nunca baja más de una fila por cuadro. |
| La repetición de teclas se siente distinta del auto-repeat del sistema | Valores fijados en constantes (0,17 s / 0,05 s). Reajustarlos sería una spec de balance aparte. |
| Mantener `ArrowDown` fija la pieza al tocar fondo y sigue bajando la siguiente | Comportamiento heredado del original (fijado inmediato y auto-repeat). Se acepta como port fiel. |
| Una puntuación que supere 9.999.999 no se puede guardar | Prácticamente inalcanzable (~1.000 líneas). El rechazo ya lo cubre `saveScoreAction` (`invalid`) con el check de la base de datos. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- La pieza "tuerca" y cualquier mecánica que el original no tenga: retardo de bloqueo, rotación antihoraria, guardar pieza, bolsa de 7, vista previa múltiple.
- El nombre comercial del juego en la UI.
- El tema claro, el restyle neón y la nitidez en alta densidad.
- Un tope de puntuación en el motor.
- Sonido, controles táctiles, mando y teclas configurables.
- Cambios en `GameSnapshot`, `GamePlayer` o el leaderboard.
- Convertir `block-fall`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
