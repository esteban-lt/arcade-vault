# SPEC 03 — Juego TRAFFIC HOP

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-11-22
> **Objective:** Crear el puzle por turnos TRAFFIC HOP como motor TypeScript sobre canvas, conectado al Reproductor de `/games/traffic-hop/play`, con su tarjeta en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

> **Game-jam (tema: Frogger).** Esta es una spec **alternativa** (03) de `specs/game-jam/frogger/`; la recomendada es la 01 (RIVER HOPPER). Solo una se promociona. Para implementarla hay que moverla a `specs/NN-traffic-hop-game.md` con el siguiente número global, cambiar `SPEC 03` por `SPEC NN` en el título y pasar `Status` a `Aprobado`.

Interpreta el tema como un puzle: la rana cruza la misma carretera y el mismo río, pero el mundo solo avanza cuando la rana actúa. Cada salto (o cada espera) mueve todos los vehículos y troncos una vez. No hay reflejos, sino planificación, y la puntuación premia llegar a la meta en el mínimo de movimientos, que el motor calcula con una búsqueda en anchura. Es la única alternativa de categoría PUZZLE: cubre un hueco del catálogo real (solo hay un puzle).

Sigue el patrón de SPEC 05 (motor sin React + registro + `GameCanvas`) y SPEC 06 (`public.games` con `accepts_scores`). No hay código de referencia: esta spec fija la jugabilidad completa y sus valores iniciales. Solo usa mecánicas del género y no reproduce ningún juego comercial.

Reutiliza `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts`, `math.ts`). No hay paso de generalización. La tarjeta simulada `frog-crossing` no se toca.

---

## Alcance

**Dentro:**

- Motor en `src/lib/games/traffic-hop/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes (`constants.ts`).
  - El tablero (`board.ts`): carriles como patrones circulares, ocupación por turno, generación de tableros y reglas de un turno.
  - El solucionador (`solver.ts`): búsqueda en anchura del mínimo de movimientos.
  - La clase `TrafficHopEngine`, con la fábrica `createTrafficHopEngine` que cumple `GameEngineFactory`.
- Entrada `"traffic-hop"` en `GAME_ENGINE_FACTORIES`. `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad:
  - Tablero de 16 columnas × 12 filas de celdas de 50 px (800×600). Fila 0 = meta, 1–4 = río (4 carriles), 5 = franja segura, 6–10 = carretera (5 carriles), 11 = salida.
  - La rana empieza en la columna 8 de la fila 11. Llegar a cualquier celda de la fila 0 completa el tablero.
  - Cada **turno** es una acción de la rana seguida de un paso del mundo. Acciones: saltar arriba, abajo, izquierda o derecha (una celda) o esperar.
  - Cada carril tiene un patrón de 16 celdas ocupadas o libres que gira de forma circular `cellsPerTurn` celdas (1 o 2) por turno en su dirección. En el río, las celdas ocupadas son troncos. En la carretera, son vehículos.
  - Resolución de un turno, en este orden:
    1. Un salto fuera de las columnas 0–15 o por debajo de la fila 11 se ignora y no gasta turno.
    2. La rana se mueve a la celda destino (o se queda, si espera).
    3. Si la fila es de meta, el tablero se completa sin avanzar el mundo.
    4. Con la distribución actual del mundo: caer en una celda de río sin tronco mata a la rana (se ahoga), y caer en una celda de carretera con vehículo la mata (atropello).
    5. El mundo avanza un turno. Si la rana está sobre un tronco, se desplaza con él `cellsPerTurn` celdas en su dirección. Si queda fuera de las columnas 0–15, muere. Si está en la carretera y ahora hay un vehículo en su celda, muere.
  - Un vehículo y la rana que se cruzan entre dos celdas durante un turno no cuentan como choque. Solo cuentan las posiciones al terminar el paso 4 y el paso 5.
  - Generación de un tablero (nivel `n`):
    - Cada carril de río lleva `max(5, 10 − floor((n − 1) / 2))` celdas de tronco en 3 tramos de longitud lo más igual posible, separados por huecos de al menos 1 celda cuya suma completa las 16 celdas. El giro del patrón es al azar.
    - Cada carril de carretera lleva `min(2 + floor((n − 1) / 2), 6)` vehículos. Cada vehículo ocupa 1 celda (70 %) o 2 celdas (30 %), con al menos 2 celdas libres entre vehículos (también en el giro circular). Se colocan en posiciones al azar con hasta 30 intentos por vehículo; si no cabe, se omite.
    - La dirección alterna de un carril al siguiente, con la del primero al azar. `cellsPerTurn` es 1 en los niveles 1 y 2, y desde el nivel 3 cada carril tiene un 30 % de ir a 2.
  - El solucionador calcula el mínimo de movimientos (`minimumMoves`) desde la salida con una búsqueda en anchura sobre (fila, columna, turno mod 16). Si el tablero no tiene solución, se vuelve a generar, hasta 50 intentos. Si ninguno la tiene, se usa el tablero de reserva (ríos con las 16 celdas de tronco y un vehículo de 1 celda por carril de carretera en la columna 0).
  - Muerte: la rana se dibuja con su marca durante 1 s, se pierde una vida y el mismo tablero se reinicia (turno 0, rana en la salida, movimientos a 0). Sin vidas, la partida termina.
  - Tablero completado: la rana se queda 0,6 s en la meta y se genera el siguiente tablero con el nivel + 1.
  - Animación: tras cada turno, el mundo y la rana se interpolan durante 0,15 s. Las pulsaciones durante la animación se descartan.
- Controles (`KeyboardEvent.code`), todos de una pulsación:
  - `ArrowUp` o `KeyW`: saltar arriba.
  - `ArrowDown` o `KeyS`: saltar abajo.
  - `ArrowLeft` o `KeyA`: saltar a la izquierda.
  - `ArrowRight` o `KeyD`: saltar a la derecha.
  - `Space`: esperar un turno.
  - Mientras la partida está en curso, esas teclas no desplazan la página. `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - Al completar un tablero: `(500 + max(0, 500 − 25 × movimientos extra)) × nivel`, con movimientos extra = movimientos usados − mínimo. Va de 500 × nivel a 1.000 × nivel.
  - `lives` = vidas restantes (3 al empezar). `level` = número del tablero actual, desde 1, sin máximo (la dificultad se estabiliza en el nivel 11).
  - Puntuación acotada a 9.999.999.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT. Estilo vectorial plano.
- Indicadores propios del juego dibujados en el canvas: el texto `MOVIMIENTOS: n   ÓPTIMO: m` en la fila 0. El motor no dibuja puntuación, vidas, nivel, PAUSA ni GAME OVER.
- Nueva tarjeta `traffic-hop` (TRAFFIC HOP) al final de `GAMES`, con su portada `cover-traffic-hop` en `globals.css`.
- Migración en Supabase que inserta `traffic-hop` en `public.games` con `accepts_scores = true`.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Deshacer movimientos, reiniciar el tablero a mano y saltar de tablero.
- Tortugas que se hunden, obstáculos fijos, mosca y casillas de meta separadas.
- Tableros diseñados a mano o con semilla compartida.
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `frog-crossing`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/traffic-hop/constants.ts
export const GAME_KEY_CODES = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyS", "KeyA", "KeyD", "Space",
] as const;
export const INITIAL_LIVES = 3;
export const MAXIMUM_SCORE = 9_999_999;

export const BOARD_COLUMNS = 16;
export const BOARD_ROWS = 12;
export const CELL_SIZE_PIXELS = 50;
export const GOAL_ROW = 0;
export const RIVER_FIRST_ROW = 1;
export const RIVER_LAST_ROW = 4;
export const MEDIAN_ROW = 5;
export const ROAD_FIRST_ROW = 6;
export const ROAD_LAST_ROW = 10;
export const START_ROW = 11;
export const START_COLUMN = 8;

export const TURN_ANIMATION_SECONDS = 0.15;
export const DEATH_PAUSE_SECONDS = 1;
export const BOARD_COMPLETE_PAUSE_SECONDS = 0.6;
export const MAXIMUM_GENERATION_ATTEMPTS = 50;

export const LEVEL_STEP_FOR_DIFFICULTY = 2;          // difficulty grows every 2 levels
export const MAXIMUM_DIFFICULTY_LEVEL = 11;          // difficulty stops growing here
export const INITIAL_LOG_CELLS_PER_RIVER_LANE = 10;
export const MINIMUM_LOG_CELLS_PER_RIVER_LANE = 5;
export const LOG_RUNS_PER_RIVER_LANE = 3;
export const INITIAL_VEHICLES_PER_ROAD_LANE = 2;
export const MAXIMUM_VEHICLES_PER_ROAD_LANE = 6;
export const TRUCK_PROBABILITY = 0.3;                // a truck occupies 2 cells
export const MINIMUM_CELLS_BETWEEN_VEHICLES = 2;
export const VEHICLE_PLACEMENT_ATTEMPTS = 30;
export const FAST_LANE_FIRST_LEVEL = 3;
export const FAST_LANE_PROBABILITY = 0.3;            // cellsPerTurn = 2

export const BASE_POINTS_PER_BOARD = 500;
export const PAR_BONUS_POINTS = 500;
export const EXTRA_MOVE_PENALTY_POINTS = 25;

// Drawing (flat vector on black)
export const GOAL_COLOR = "#0f3d1a";
export const RIVER_COLOR = "#0b2a6b";
export const SAFE_STRIP_COLOR = "#3a2a5a";
export const ROAD_COLOR = "#262626";
export const ROAD_MARKING_COLOR = "#cfcfcf";
export const LOG_COLOR = "#8a5a2b";
export const LOG_GRAIN_COLOR = "#6b4220";
export const CAR_COLOR = "#e03a3a";
export const TRUCK_COLOR = "#d0a030";
export const FROG_COLOR = "#6ee05a";
export const FROG_EYE_COLOR = "#000";
export const FROG_DEATH_COLOR = "#e04848";
export const FROG_DROWN_COLOR = "#7ac0ff";
export const MOVES_TEXT_COLOR = "#ffffff";
export const MOVES_TEXT_FONT = "16px monospace";
```

```ts
// src/lib/games/traffic-hop/ types
export type LaneKind = "river" | "road";
export type TurnAction = "up" | "down" | "left" | "right" | "wait";
export type Lane = {
  row: number;
  kind: LaneKind;
  direction: 1 | -1;                 // 1 = to the right
  cellsPerTurn: 1 | 2;
  occupiedCells: boolean[];          // length 16; logs on rivers, vehicles on roads
};
export type BoardLayout = { lanes: Lane[]; minimumMoves: number };
export type TurnOutcome =
  | { kind: "ignored" }
  | { kind: "moved"; column: number; row: number }
  | { kind: "reached-goal"; column: number }
  | { kind: "died"; cause: "water" | "vehicle" | "off-screen"; column: number; row: number };
```

```ts
// src/lib/games/traffic-hop/board.ts (internal shape)
// isOccupied(lane, column, turnIndex) = lane.occupiedCells[positiveModulo(column − lane.direction × lane.cellsPerTurn × turnIndex, 16)]
// resolveTurn(layout, frogColumn, frogRow, turnIndex, action): TurnOutcome — steps 1–5 of the scope
// generateBoardLayout(level): BoardLayout — random patterns + solver, up to 50 attempts, then fallback layout
// src/lib/games/traffic-hop/solver.ts
// findMinimumMoves(lanes): number | null — BFS over (row, column, turnIndex mod 16) using resolveTurn rules; null when unreachable
// TrafficHopEngine state: layout, frogColumn, frogRow, turnIndex, movesUsed, score, lives, level,
//   animationSeconds, animationFrom, pendingOutcome, phaseSeconds, phase
```

```ts
// src/lib/games/traffic-hop/traffic-hop-engine.ts (internal state, not exported)
type TrafficHopPhase = "playing" | "animating" | "dying" | "board-complete" | "game-over";
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
  "fruit-snake": createFruitSnakeEngine,
  "traffic-hop": createTrafficHopEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "traffic-hop",
  title: "TRAFFIC HOP",
  shortDescription: "Planifica cada salto: el tráfico solo se mueve cuando tú lo haces.",
  longDescription:
    "Cruza una carretera de cinco carriles y un río de cuatro con la rana, pero el mundo solo avanza un paso cada vez que saltas o esperas. Elige el camino más corto: cada movimiento extra resta puntos. Los tableros se vuelven más densos y rápidos y tienes tres vidas.",
  category: "PUZZLE",
  coverClassName: "cover-traffic-hop",
  accentColor: "cyan",
}
```

```sql
-- supabase/migrations/<timestamp>_add_traffic_hop_game.sql
insert into public.games (id, title, accepts_scores) values ('traffic-hop', 'TRAFFIC HOP', true);
```

Dibujo (800×600, fondo `#000`; la fila `r` ocupa y = 50 × r … 50 × r + 50):

- **Fila 0:** rectángulo `GOAL_COLOR` con el texto `MOVIMIENTOS: n   ÓPTIMO: m` (`MOVES_TEXT_FONT`, `MOVES_TEXT_COLOR`, alineado a la izquierda en x = 16, centrado en vertical).
- **Filas 1–4:** `RIVER_COLOR`. Cada celda de tronco es un rectángulo de 50×40 `LOG_COLOR`, centrado en la fila, con una raya de 2 px `LOG_GRAIN_COLOR` en el centro.
- **Fila 5 y fila 11:** `SAFE_STRIP_COLOR`.
- **Filas 6–10:** `ROAD_COLOR` con línea discontinua de 2 px `ROAD_MARKING_COLOR` (trazos de 30 y huecos de 30) entre carriles.
- **Vehículos:** cada tramo de celdas consecutivas ocupadas es un vehículo: rectángulo de (50 × longitud − 6) × 34, desplazado 3 px, `CAR_COLOR` si ocupa 1 celda y `TRUCK_COLOR` si ocupa 2, con dos ventanas de 10×8 `#000` hacia donde va.
- **Interpolación:** durante la animación, las celdas se dibujan desplazadas `dirección × cellsPerTurn × 50 × progreso` px (progreso entre 0 y 1) y, si se salen por un borde, se dibujan también 800 px al otro lado.
- **Rana:** rectángulo redondeado de 34×34 radio 10 `FROG_COLOR` con dos ojos de 6×6 `FROG_EYE_COLOR` hacia donde mira, interpolada entre su posición anterior y la nueva. Muerta: X de 4 px `FROG_DEATH_COLOR` o, si murió en el agua, dos anillos `FROG_DROWN_COLOR` de radios 12 y 20.

Convenciones:

- Coordenadas con origen arriba a la izquierda. Las celdas usan (columna, fila). Una celda se dibuja en (columna × 50, fila × 50).
- Juego por turnos: el estado solo cambia al resolverse una acción. El tiempo (`deltaSeconds`, con tope `MAXIMUM_FRAME_SECONDS`) solo anima la interpolación y las pausas de muerte y de tablero completado.
- Cada turno se resuelve por completo al pulsar la tecla (el resultado queda en `pendingOutcome`) y después se anima. Las pulsaciones llegadas durante la animación o las pausas se descartan.
- En pausa no avanza nada y las pulsaciones hechas en pausa se descartan (`consumePress` de las 9 teclas).
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo: `lives` baja en el instante de la muerte; con el botón FIN se queda como estaba. `level` = número del tablero. `score` según el alcance.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Constantes y tipos.**
   - Crear `src/lib/games/traffic-hop/constants.ts` con los valores del modelo de datos y los tipos `LaneKind`, `TurnAction`, `Lane`, `BoardLayout` y `TurnOutcome`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Reglas del tablero.**
   - Crear `board.ts` con `isOccupied` y `resolveTurn` (los 5 pasos del turno) y el dibujo de carriles, troncos y vehículos con interpolación.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Solucionador y generación.**
   - Crear `solver.ts` (`findMinimumMoves`, búsqueda en anchura sobre fila, columna y turno mod 16 con las reglas de `resolveTurn`) y añadir `generateBoardLayout` a `board.ts` (patrones de río y carretera, direcciones, velocidades, reintentos y tablero de reserva).
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor: ciclo de vida y escena.**
   - Crear `traffic-hop-engine.ts` con `TrafficHopEngine` y `createTrafficHopEngine`, siguiendo las reglas de ciclo de vida de la guía: bucle idempotente, `KeyboardInput` con `GAME_KEY_CODES`, `startNewGame()` (nivel 1, 3 vidas, tablero nuevo), `finishGame()`, `destroy()`, `GameSnapshot` y dibujo de la escena, la rana y el texto de movimientos.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Motor: turnos, muertes y tableros.**
   - Añadir lectura de pulsaciones, resolución de turnos con `resolveTurn`, animación de 0,15 s, fase `dying` (vida perdida y reinicio del mismo tablero), fase `board-complete`, cálculo de puntos con tope y siguiente tablero.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
6. **Tarjeta del catálogo.**
   - Añadir `traffic-hop` al final de `GAMES`.
   - Añadir `.cover-traffic-hop` en `globals.css`: fondo `linear-gradient(#0b2a6b 0 50%, #262626 50% 100%)` y un `::after` con un SVG en data URI (`#` como `%23`) que dibuja una rejilla tenue, un tronco `#8a5a2b`, un coche `#e03a3a` y una rana `#6ee05a`.
   - Hasta el paso 7 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta TRAFFIC HOP, `/games/traffic-hop` carga y `npm run build` pasa.
7. **Registro.**
   - Añadir `"traffic-hop": createTrafficHopEngine` en `engine-registry.ts`.
   - Verificación: `/games/traffic-hop/play` se juega de verdad. Los demás juegos reales y la simulación de `frog-crossing` no cambian.
8. **Leaderboard.**
   - Aplicar con `apply_migration` (`add_traffic_hop_game`) el `insert` del modelo de datos y guardar el mismo SQL en `supabase/migrations/<timestamp>_add_traffic_hop_game.sql`.
   - Revisar `get_advisors`.
   - Verificación: `public.games` tiene `traffic-hop` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/traffic-hop`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/traffic-hop/play` arranca directamente: tablero de 16×12 con rana en la columna 8 de la fila 11, texto `MOVIMIENTOS: 0   ÓPTIMO: m` (m ≥ 11) y HUD en 0 / 3 vidas / 01.
- [ ] Cada pulsación de dirección o `Space` avanza un turno: la rana salta una celda (o espera) y todos los carriles giran `cellsPerTurn` celdas. No ocurre nada si no se pulsa ninguna tecla.
- [ ] Un salto fuera de las columnas 0–15 o por debajo de la salida no gasta turno ni cuenta movimiento.
- [ ] Las pulsaciones durante los 0,15 s de animación se descartan.
- [ ] Saltar al agua, a un vehículo, o quedar frente a un vehículo tras el paso del mundo mata a la rana: marca 1 s, vida perdida en el HUD y mismo tablero desde el turno 0 con movimientos a 0.
- [ ] Sobre un tronco, la rana se desplaza con él cada turno. Salir por un borde la mata.
- [ ] Entrar en la fila 0 completa el tablero. Con el mínimo de movimientos suma `1.000 × nivel`. Con 4 movimientos extra suma `900 × nivel`. Con 20 o más movimientos extra suma `500 × nivel`.
- [ ] El tablero siguiente sube el nivel en 1. En los niveles 1 y 2 todos los carriles van a 1 celda por turno; desde el nivel 3 hay carriles a 2.
- [ ] Todo tablero generado tiene solución y el `ÓPTIMO` mostrado es alcanzable jugando.
- [ ] La puntuación nunca supera 9.999.999.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA ni GAME OVER, y no carga ninguna imagen.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego (flechas, `KeyW`, `KeyA`, `KeyS`, `KeyD` y `Space`) funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA"; las pulsaciones hechas en pausa no mueven a la rana al reanudar y la animación no salta.
- [ ] Perder la última vida abre el modal "FIN DEL JUEGO" con la puntuación real; el motor deja de procesar teclas y se puede escribir en el modal.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle: puntuación 0, 3 vidas, nivel 1 y un tablero nuevo con la rana en la salida.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor y quita los listeners. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'traffic-hop'`. La marca aparece en `/games/traffic-hop` y en `/hall-of-fame?game=traffic-hop`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `traffic-hop` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] Los demás juegos reales funcionan igual que antes, y `/games/frog-crossing/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta TRAFFIC HOP (PUZZLE, acento cyan) al final, y la tarjeta FROG CROSSING conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con HUD, pausa y modal del Reproductor (patrón de SPEC 05). **No:** HUD o GAME OVER dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 con 16×12 celdas de 50 px. **No:** un tamaño de canvas por juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas.
- **Sí:** reutilizar `shared/`. **No:** copiar código compartido.
- **Sí:** valores iniciales de balance fijados en esta spec. **No:** dejarlos para la implementación.
- **Decisión de game-jam (tema: Frogger):** reinterpretar el género como puzle por turnos. Es la propuesta más distinta, pero cambia el tipo de juego (no hay reflejos), por eso no es la recomendada. Cubre la categoría PUZZLE, que solo tiene un juego real.
- **Decisión de game-jam (tema: Frogger):** el mundo avanza solo con cada acción, incluida la espera con `Space`. Descartado: tráfico en tiempo real con pausa al pensar, que no tendría sentido de puntuación por movimientos.
- **Decisión de game-jam (tema: Frogger):** todos los patrones son circulares de 16 celdas y las velocidades son 1 o 2 celdas por turno, así el mundo se repite cada 16 turnos y la búsqueda en anchura es de 16 × 12 × 16 = 3.072 estados como máximo. Descartado: velocidades de 3 o más, que no dividen 16 y alargan el periodo.
- **Decisión de game-jam (tema: Frogger):** validar cada tablero con el solucionador y mostrar el `ÓPTIMO`. Es lo que hace comparable la puntuación. Descartado: tableros sin validar (podrían ser imposibles) y ocultar el óptimo.
- **Decisión de game-jam (tema: Frogger):** tablero de reserva con ríos de 16 celdas de tronco y un vehículo de 1 celda por carril de carretera, resoluble por construcción para que la generación no pueda bloquearse.
- **Decisión de game-jam (tema: Frogger):** 3 vidas; morir reinicia el mismo tablero para que el óptimo y el reto no cambien. `level` = número del tablero, sin máximo; la dificultad se estabiliza en el nivel 11.
- **Decisión de game-jam (tema: Frogger):** puntuación `(500 + max(0, 500 − 25 × extra)) × nivel`, con tope 9.999.999 (alcanzarlo exigiría unos 140 tableros seguidos).
- **Decisión de game-jam (tema: Frogger):** `Space` es una tecla del juego (esperar). No se usan `P` ni `Escape`.
- **Decisión de game-jam (tema: Frogger):** tarjeta nueva `traffic-hop` con título TRAFFIC HOP, categoría PUZZLE y acento cyan (hueco real de PUZZLE; `cyan` solo lo usa ASTEROIDS). Descartado: reutilizar `frog-crossing`, que sigue como simulación.
- **Decisión de game-jam (tema: Frogger):** estilo plano sobre negro, como los demás juegos reales. **No:** neón.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`. |
| Las teclas, en especial `Space`, desplazan la página o activan el botón enfocado | Las 9 teclas en `GAME_KEY_CODES` con `preventDefault`; se verifica con PAUSA enfocado. |
| Un tablero generado no tiene solución | Búsqueda en anchura por tablero, hasta 50 intentos y tablero de reserva resoluble. |
| El solucionador y `resolveTurn` divergen | El solucionador reutiliza `resolveTurn`; no tiene reglas propias. |
| Al reanudar la animación da un salto | Marca de tiempo reiniciada en pausa y tope `MAXIMUM_FRAME_SECONDS`. |
| El jugador pierde turnos al pulsar durante la animación | Las pulsaciones se descartan; la animación dura solo 0,15 s. |
| Puntuación por encima de 9.999.999 | Tope `MAXIMUM_SCORE`. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- Deshacer, reiniciar el tablero a mano y saltar de tablero.
- Tortugas, obstáculos fijos, mosca y casillas de meta separadas.
- Tableros diseñados a mano o con semilla compartida.
- Sonido.
- Controles táctiles, mando, teclas configurables y nitidez en alta densidad.
- Cambios en `GameSnapshot`, `GamePlayer`, `GameCanvas` o el leaderboard.
- Convertir `frog-crossing`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
