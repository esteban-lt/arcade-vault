# SPEC 01 — Juego RIVER HOPPER

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-11-22
> **Objective:** Crear el juego de cruzar carretera y río RIVER HOPPER como motor TypeScript sobre canvas, conectado al Reproductor de `/games/river-hopper/play`, con su tarjeta en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

> **Game-jam (tema: Frogger).** Esta es la spec **recomendada** (01) de `specs/game-jam/frogger/`. Las specs 02 y 03 son alternativas. Solo una se promociona. Para implementarla hay que moverla a `specs/NN-river-hopper-game.md` con el siguiente número global, cambiar `SPEC 01` por `SPEC NN` en el título y pasar `Status` a `Aprobado`.

El catálogo tiene una tarjeta simulada de rana (`frog-crossing`, FROG CROSSING), pero ningún juego real de cruce de carriles. Esta spec añade RIVER HOPPER como **quinto juego real de la plataforma**: una rana cruza cuatro carriles de tráfico, una franja segura y cinco carriles de río con troncos y tortugas, hasta llegar a una de las cinco casillas de meta. Sigue el patrón de SPEC 05: motor TypeScript sin React, registro por id y `GameCanvas` dentro de `GamePlayer`. También sigue el de SPEC 06: una fila en `public.games` con `accepts_scores = true`.

No hay código de referencia: esta spec fija la jugabilidad completa y sus valores iniciales. Solo toma del género las mecánicas (cruzar tráfico, subirse a plataformas móviles, casillas de meta). No reproduce ningún juego comercial concreto: nombre, personajes, arte y niveles son propios, y el dibujo es vectorial plano.

Reutiliza el código compartido de `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts`, `math.ts`). No hay paso de generalización.

La tarjeta simulada `frog-crossing` no se toca.

---

## Alcance

**Dentro:**

- Motor en `src/lib/games/river-hopper/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes y la tabla de carriles (`constants.ts`).
  - Los carriles (`lane.ts`): objetos que se desplazan en bucle, deslizamiento de tortugas y pruebas de solape.
  - La rana (`frog.ts`): posición, salto, orientación y dibujo.
  - Las casillas de meta y la mosca (`goal-bays.ts`).
  - La clase `RiverHopperEngine`, con la fábrica `createRiverHopperEngine` que cumple `GameEngineFactory`.
- Entrada `"river-hopper"` en `GAME_ENGINE_FACTORIES` (`src/lib/games/engine-registry.ts`). `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad:
  - Tablero de 16 columnas × 12 filas de celdas de 50 px. Ocupa el canvas entero de 800×600. La fila 0 es arriba.
  - Filas: 0 = metas, 1–5 = río (5 carriles), 6 = franja segura, 7–10 = carretera (4 carriles), 11 = salida.
  - La rana empieza en el centro de la salida: x = 400, fila 11, mirando arriba. La partida empieza sin pantalla de inicio.
  - Salto: una pulsación mueve la rana 50 px (una fila arriba/abajo o 50 px a izquierda/derecha). Tras saltar hay un enfriamiento de 0,08 s en el que se ignoran pulsaciones. La rana no sale por abajo ni por los lados de la salida: un salto que la dejaría fuera del rango x ∈ [25, 775] o por debajo de la fila 11 se ignora.
  - La posición horizontal de la rana es continua (píxeles), porque en el río se desplaza con la plataforma.
  - Carretera: cada carril tiene vehículos que cruzan en bucle en una dirección. La rana muere si su caja de colisión (28×28 centrada) solapa un vehículo (caja de la altura de 34 px centrada en la fila).
  - Río: la rana muere si su centro no está sobre ningún tronco o tortuga visible al terminar cada cuadro. Sobre una plataforma se desplaza con ella. Muere si su centro sale de x ∈ [0, 800].
  - Tortugas que se hunden: los carriles marcados `canDive` alternan 4 s en superficie, 1 s de aviso (más pequeñas y más oscuras, aún seguras) y 1,5 s sumergidas (no se puede pisar). Cada grupo tiene un desfase de 2,5 s × su índice.
  - Casillas de meta: cinco huecos de 70 px de ancho centrados en x = 80, 240, 400, 560 y 720. Al llegar a la fila 0 con el centro dentro de un hueco libre, la rana se queda ahí y reaparece en la salida. Llegar a la fila 0 fuera de un hueco, o a un hueco ya ocupado, mata a la rana.
  - Tiempo: cada intento (cada aparición de la rana) dura 30 s. Al agotarse, la rana muere.
  - Mosca: aparece 6 s tras empezar la partida o tras completar un tablero, y luego cada 10 s después de desaparecer, en un hueco libre al azar durante 5 s. Si la rana entra en ese hueco, suma un bonus.
  - Muerte: la rana se dibuja con su marca durante 1 s (la partida sigue moviendo el mundo) y se pierde una vida. Si quedan vidas, reaparece en la salida con 30 s. Si no, la partida termina.
  - Tablero completo: con las cinco casillas ocupadas, suman puntos, el nivel sube, las casillas se vacían y las velocidades aumentan un 15 % por nivel hasta el doble.
- Controles (`KeyboardEvent.code`), todos de una pulsación:
  - `ArrowUp` o `KeyW`: saltar arriba.
  - `ArrowDown` o `KeyS`: saltar abajo.
  - `ArrowLeft` o `KeyA`: saltar a la izquierda.
  - `ArrowRight` o `KeyD`: saltar a la derecha.
  - Mientras la partida está en curso, esas teclas no desplazan la página. `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - 10 puntos por cada fila nueva alcanzada en el intento (más arriba que cualquiera anterior de ese intento).
  - Casilla ocupada: 50 + 10 × segundos restantes (redondeados hacia arriba). Mosca: +200.
  - Tablero completo: +1.000.
  - `lives` = vidas restantes (3 al empezar). `level` = 1 + tableros completados.
  - La puntuación se limita a 9.999.999.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT. El tablero ocupa el canvas entero, sin paneles laterales. Estilo vectorial plano.
- Indicadores propios del juego dibujados en el canvas: la barra de tiempo del intento y las ranas de las casillas ocupadas. El motor no dibuja puntuación, vidas, nivel, PAUSA ni GAME OVER.
- Nueva tarjeta `river-hopper` (RIVER HOPPER) al final de `GAMES`, con su portada `cover-river-hopper` en `globals.css`.
- Migración en Supabase que inserta `river-hopper` en `public.games` con `accepts_scores = true`.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas (`deltaSeconds`, no `dt`; `context`, no `ctx`).

**Fuera de alcance (para otras specs):**

- Cocodrilos, serpientes, nutrias, rana hembra o cualquier enemigo extra.
- Vidas extra por puntos.
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Reestilizar el juego con los colores neón de la plataforma.
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `frog-crossing`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/river-hopper/constants.ts
export const GAME_KEY_CODES = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyS", "KeyA", "KeyD",
] as const;
export const INITIAL_LIVES = 3;
export const MAXIMUM_SCORE = 9_999_999;

export const BOARD_COLUMNS = 16;
export const BOARD_ROWS = 12;
export const CELL_SIZE_PIXELS = 50;                  // 16 × 50 = 800, 12 × 50 = 600
export const GOAL_ROW = 0;
export const RIVER_FIRST_ROW = 1;
export const RIVER_LAST_ROW = 5;
export const MEDIAN_ROW = 6;
export const ROAD_FIRST_ROW = 7;
export const ROAD_LAST_ROW = 10;
export const START_ROW = 11;

export const START_X_PIXELS = 400;
export const FROG_MINIMUM_X_PIXELS = 25;
export const FROG_MAXIMUM_X_PIXELS = 775;
export const FROG_HOP_DISTANCE_PIXELS = 50;
export const FROG_HOP_COOLDOWN_SECONDS = 0.08;
export const FROG_DRAW_SIZE_PIXELS = 34;
export const FROG_HITBOX_SIZE_PIXELS = 28;
export const VEHICLE_HEIGHT_PIXELS = 34;

export const LANE_LOOP_LENGTH_PIXELS = 960;          // 800 visible + 80 margin on each side
export const LANE_WRAP_MARGIN_PIXELS = 80;           // objects are at most 160 px wide

export const GOAL_BAY_CENTER_X_PIXELS = [80, 240, 400, 560, 720] as const;
export const GOAL_BAY_WIDTH_PIXELS = 70;

export const ATTEMPT_TIME_LIMIT_SECONDS = 30;
export const DEATH_PAUSE_SECONDS = 1;
export const SPEED_MULTIPLIER_PER_LEVEL = 0.15;
export const MAXIMUM_SPEED_MULTIPLIER = 2;

export const TURTLE_SURFACE_SECONDS = 4;
export const TURTLE_WARNING_SECONDS = 1;
export const TURTLE_SUBMERGED_SECONDS = 1.5;         // cycle = 6,5 s
export const TURTLE_DIVE_PHASE_OFFSET_SECONDS = 2.5; // × group index

export const FLY_FIRST_APPEARANCE_SECONDS = 6;
export const FLY_INTERVAL_SECONDS = 10;
export const FLY_VISIBLE_SECONDS = 5;

export const POINTS_PER_NEW_ROW = 10;
export const POINTS_PER_GOAL_BAY = 50;
export const POINTS_PER_REMAINING_SECOND = 10;
export const POINTS_PER_FLY = 200;
export const POINTS_PER_COMPLETED_BOARD = 1000;

// Drawing (flat vector on black)
export const GOAL_HEDGE_COLOR = "#0f3d1a";
export const GOAL_BAY_COLOR = "#0a1f5c";
export const RIVER_COLOR = "#0b2a6b";
export const SAFE_STRIP_COLOR = "#3a2a5a";
export const ROAD_COLOR = "#262626";
export const ROAD_MARKING_COLOR = "#cfcfcf";
export const LOG_COLOR = "#8a5a2b";
export const LOG_GRAIN_COLOR = "#6b4220";
export const TURTLE_COLOR = "#2fa05a";
export const TURTLE_WARNING_COLOR = "#1f7a8a";
export const FROG_COLOR = "#6ee05a";
export const FROG_EYE_COLOR = "#000";
export const FROG_DEATH_COLOR = "#e04848";
export const FROG_DROWN_COLOR = "#7ac0ff";
export const FLY_COLOR = "#f5f5f5";
export const TIME_BAR_COLORS = { safe: "#3cc05a", warning: "#f0d040", danger: "#e04848" };
export const TIME_BAR_WARNING_SECONDS = 10;
export const TIME_BAR_DANGER_SECONDS = 5;
```

```ts
// src/lib/games/river-hopper/ types and lane table
export type LaneKind = "log" | "turtle" | "car" | "truck" | "racer";
export type LaneDirection = "left" | "right";
export type LaneDefinition = {
  row: number;
  kind: LaneKind;
  direction: LaneDirection;
  speedPixelsPerSecond: number;     // at level 1
  objectWidthPixels: number;
  objectCount: number;              // objects per 960 px loop, evenly spaced
  initialOffsetPixels: number;
  canDive: boolean;                 // only meaningful for "turtle"
};
export type DeathCause = "vehicle" | "water" | "timeout" | "hedge" | "off-screen";

export const LANE_DEFINITIONS: LaneDefinition[] = [
  { row: 1,  kind: "log",    direction: "left",  speedPixelsPerSecond: 80,  objectWidthPixels: 150, objectCount: 3, initialOffsetPixels: 0,   canDive: false },
  { row: 2,  kind: "log",    direction: "right", speedPixelsPerSecond: 110, objectWidthPixels: 260, objectCount: 2, initialOffsetPixels: 120, canDive: false },
  { row: 3,  kind: "turtle", direction: "left",  speedPixelsPerSecond: 90,  objectWidthPixels: 100, objectCount: 4, initialOffsetPixels: 40,  canDive: true  },
  { row: 4,  kind: "log",    direction: "right", speedPixelsPerSecond: 60,  objectWidthPixels: 200, objectCount: 2, initialOffsetPixels: 200, canDive: false },
  { row: 5,  kind: "turtle", direction: "left",  speedPixelsPerSecond: 70,  objectWidthPixels: 150, objectCount: 3, initialOffsetPixels: 80,  canDive: false },
  { row: 7,  kind: "racer",  direction: "left",  speedPixelsPerSecond: 160, objectWidthPixels: 50,  objectCount: 3, initialOffsetPixels: 0,   canDive: false },
  { row: 8,  kind: "car",    direction: "right", speedPixelsPerSecond: 110, objectWidthPixels: 60,  objectCount: 4, initialOffsetPixels: 90,  canDive: false },
  { row: 9,  kind: "truck",  direction: "left",  speedPixelsPerSecond: 60,  objectWidthPixels: 110, objectCount: 2, initialOffsetPixels: 150, canDive: false },
  { row: 10, kind: "car",    direction: "right", speedPixelsPerSecond: 80,  objectWidthPixels: 60,  objectCount: 3, initialOffsetPixels: 30,  canDive: false },
];
```

```ts
// src/lib/games/river-hopper/ internal shapes
// Lane: scrollOffsetPixels (signed, accumulates direction × speed × multiplier × deltaSeconds).
//   objectLeftPixels(index) = positiveModulo(index × (960 / objectCount) + initialOffsetPixels + scrollOffsetPixels, 960) − 80
//   platformUnder(centerX, elapsedSeconds): the log/turtle group whose [left, left + width] contains centerX and is not submerged, or null.
//   overlapsHitbox(frogBox): true for road lanes when a vehicle box intersects the frog box.
//   turtle state of group i: cycleSeconds = (elapsedSeconds + i × 2.5) mod 6.5 → [0,4) "surface", [4,5) "warning", [5,6.5) "submerged".
// Frog: centerX (px), row, facing: "up" | "down" | "left" | "right", hopCooldownSeconds, bestRow, deathCause: DeathCause | null
// GoalBays: filled: boolean[5]; flyBayIndex: number | null; flyTimerSeconds
```

```ts
// src/lib/games/river-hopper/river-hopper-engine.ts (internal state, not exported)
type RiverHopperPhase = "playing" | "dying" | "game-over";
// state: lanes, frog, goalBays, score, lives, level, boardsCompleted, attemptSecondsRemaining,
//        worldElapsedSeconds, deathPauseSeconds, phase
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
  "fruit-snake": createFruitSnakeEngine,
  "river-hopper": createRiverHopperEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "river-hopper",
  title: "RIVER HOPPER",
  shortDescription: "Cruza la carretera y el río hasta llegar a casa.",
  longDescription:
    "Salta con las flechas o WASD entre coches y camiones, súbete a troncos y tortugas que se hunden y ocupa las cinco casillas de meta antes de que se acabe el tiempo. Cada tablero completo sube el nivel y acelera el tráfico, y tienes tres vidas.",
  category: "ARCADE",
  coverClassName: "cover-river-hopper",
  accentColor: "yellow",
}
```

```sql
-- supabase/migrations/<timestamp>_add_river_hopper_game.sql
insert into public.games (id, title, accepts_scores) values ('river-hopper', 'RIVER HOPPER', true);
```

Dibujo (800×600, fondo `#000`, en este orden; la fila `r` ocupa y = 50 × r … 50 × r + 50):

- **Fila 0:** rectángulo `GOAL_HEDGE_COLOR` y, sobre él, los cinco huecos (rectángulos de 70×50 `GOAL_BAY_COLOR` centrados en su x). Una casilla ocupada lleva una rana de `FROG_COLOR` (34×34, mirando arriba).
- **Filas 1–5:** rectángulo `RIVER_COLOR`.
- **Fila 6 y fila 11:** rectángulo `SAFE_STRIP_COLOR`.
- **Filas 7–10:** rectángulo `ROAD_COLOR` con líneas discontinuas de 2 px `ROAD_MARKING_COLOR` (trazos de 30 px y huecos de 30 px) en la frontera entre carriles.
- **Troncos:** rectángulo redondeado (radio 8) de `LOG_COLOR` de la altura de 40 px centrado en la fila, con dos rayas de 2 px `LOG_GRAIN_COLOR` a lo largo.
- **Tortugas:** una por cada 50 px de ancho del grupo, círculo de radio 18 `TURTLE_COLOR` con un caparazón (círculo de radio 10 un 15 % más oscuro). En aviso: radio 13 y `TURTLE_WARNING_COLOR`. Sumergidas: solo un anillo de 1 px de radio 18 con `rgba(255,255,255,0.15)`.
- **Vehículos:** rectángulos de la altura de 34 px centrados en la fila. Coche `#e03a3a`, camión `#d0a030` y deportivo `#30b0e0`, con dos ventanas de 10×8 `#000` en el lado hacia el que van.
- **Mosca:** círculo de radio 5 `FLY_COLOR` con dos alas (elipses de semiejes 6×3 `rgba(255,255,255,0.5)`) centrado en el hueco.
- **Rana:** cuerpo (rectángulo redondeado de 34×34, radio 10) de `FROG_COLOR` y dos ojos de 6×6 `FROG_EYE_COLOR` en el lado hacia el que mira, a 6 px del borde y separados 14 px. Durante el enfriamiento del salto se dibuja un 15 % más grande. Muerta: una X de 4 px `FROG_DEATH_COLOR` de 34×34, o, si murió en el agua, dos anillos concéntricos `FROG_DROWN_COLOR` de radios 12 y 20.
- **Barra de tiempo:** rectángulo en x = 20, y = 592, alto 6, ancho 760 × segundos restantes / 30. Color `safe` por encima de 10 s, `warning` entre 10 y 5 s y `danger` por debajo.

Convenciones:

- Coordenadas con origen arriba a la izquierda. La rana usa x en píxeles continuos y fila entera; su centro vertical es 50 × fila + 25.
- Los objetos de los carriles avanzan con `deltaSeconds` (con tope `MAXIMUM_FRAME_SECONDS`) multiplicado por `min(1 + 0,15 × (nivel − 1), 2)`. El mundo se mueve en `playing` y en `dying`, y se detiene en `game-over`.
- Orden del cuadro en `playing`: leer pulsaciones y saltar si el enfriamiento es 0 → mover carriles → arrastrar a la rana si va sobre una plataforma → comprobar muertes (agua, vehículo, bordes, tiempo) → comprobar meta → actualizar mosca.
- El enfriamiento del salto descarta las pulsaciones que llegan mientras dura (se consumen sin aplicarse).
- En pausa no avanza nada (carriles, tiempo, mosca ni enfriamiento) y las pulsaciones hechas en pausa se descartan (`consumePress` de las 8 teclas).
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo:
  - `score` = suma de los puntos descritos, con tope 9.999.999.
  - `lives` = vidas restantes; baja en el instante de la muerte, no al reaparecer. Con el botón FIN se queda como estaba.
  - `level` = 1 + tableros completados.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Constantes y tipos.**
   - Crear `src/lib/games/river-hopper/constants.ts` con los valores del modelo de datos, la tabla `LANE_DEFINITIONS` y los tipos `LaneKind`, `LaneDirection`, `LaneDefinition` y `DeathCause`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Carriles.**
   - Crear `lane.ts` con la clase `Lane`: desplazamiento en bucle, posición de cada objeto, estado de las tortugas, `platformUnder`, `overlapsHitbox` y dibujo de troncos, tortugas y vehículos.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Rana y casillas de meta.**
   - Crear `frog.ts` (posición, salto con enfriamiento, caja de colisión, dibujo vivo y muerto) y `goal-bays.ts` (huecos ocupados, mosca con temporizador, `bayIndexAt(centerX)` y dibujo).
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor: ciclo de vida y escena.**
   - Crear `river-hopper-engine.ts` con `RiverHopperEngine` y `createRiverHopperEngine`, siguiendo las reglas de ciclo de vida de la guía: bucle con `requestAnimationFrame` idempotente, `KeyboardInput` con `GAME_KEY_CODES`, `startNewGame()`, `finishGame()`, `destroy()`, emisión de `GameSnapshot` y dibujo de fondo, carriles y barra de tiempo.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Motor: saltos y muertes.**
   - Añadir la lectura de pulsaciones, el salto, el arrastre sobre plataformas, las muertes (vehículo, agua, bordes, seto, tiempo), la fase `dying` de 1 s, la pérdida de vida y la reaparición.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
6. **Motor: metas, mosca y niveles.**
   - Añadir la ocupación de huecos, los puntos (filas nuevas, hueco, mosca), el tablero completo con el aumento de velocidad y el tope de puntuación.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
7. **Tarjeta del catálogo.**
   - Añadir `river-hopper` al final de `GAMES`.
   - Añadir `.cover-river-hopper` en `globals.css`, junto a `.cover-fruit-snake`: fondo `linear-gradient(#0b2a6b 0 50%, #262626 50% 100%)` y un `::after` con un SVG en data URI (`#` escapado como `%23`) que dibuja un tronco `#8a5a2b`, un coche `#e03a3a` y una rana `#6ee05a` de 34×34 sobre el tronco.
   - Hasta el paso 8 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta RIVER HOPPER, `/games/river-hopper` carga y `npm run build` pasa.
8. **Registro.**
   - Añadir `"river-hopper": createRiverHopperEngine` en `engine-registry.ts`.
   - Verificación: `/games/river-hopper/play` se juega de verdad. `/games/asteroids/play`, `/games/block-stack/play`, `/games/wall-breaker/play`, `/games/fruit-snake/play` y `/games/frog-crossing/play` no cambian.
9. **Leaderboard.**
   - Aplicar con `apply_migration` (`add_river_hopper_game`) el `insert` del modelo de datos.
   - Guardar el mismo SQL en `supabase/migrations/<timestamp>_add_river_hopper_game.sql`, con el timestamp de `list_migrations`.
   - Revisar `get_advisors` (seguridad y rendimiento).
   - Verificación: `public.games` tiene `river-hopper` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/river-hopper`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/river-hopper/play` arranca directamente:
  - Tablero de 16×12 con meta arriba, 5 carriles de río, franja violeta, 4 carriles de carretera y salida abajo.
  - Rana en (x = 400, fila 11) mirando arriba, y barra de tiempo llena.
  - HUD en 0 / 3 vidas / 01.
- [ ] Cada pulsación de dirección mueve la rana 50 px. Con enfriamiento de 0,08 s, una pulsación dentro de ese tiempo no hace nada. Un salto fuera de x ∈ [25, 775] o por debajo de la fila 11 se ignora.
- [ ] Alcanzar por primera vez una fila en un intento suma 10 puntos. Volver a una fila ya alcanzada no suma.
- [ ] Tocar un vehículo mata a la rana: se pinta una X roja 1 s, el HUD pasa a 2 vidas y reaparece en la salida con 30 s.
- [ ] En el río, la rana sobre un tronco o tortuga se desplaza con ella. Saltar al agua o quedarse sobre una tortuga que se sumerge mata a la rana con dos anillos azules.
- [ ] Las tortugas de la fila 3 pasan por 4 s de superficie, 1 s de aviso (más pequeñas y azuladas) y 1,5 s sumergidas. Las de la fila 5 nunca se hunden.
- [ ] Salir por un lado del tablero a bordo de una plataforma mata a la rana.
- [ ] Llegar a la fila 0 dentro de un hueco libre lo ocupa con una rana, suma `50 + 10 × segundos restantes (hacia arriba)` y reaparece la rana. Llegar al seto o a un hueco ocupado mata.
- [ ] A los 6 s aparece una mosca en un hueco libre durante 5 s. Entrar con ella suma 200 más. Tras desaparecer vuelve a los 10 s.
- [ ] Agotar los 30 s mata a la rana. La barra pasa a amarillo a 10 s y a rojo a 5 s.
- [ ] Ocupar las cinco casillas suma 1.000, el HUD pasa a nivel 02, las casillas se vacían y el tráfico y las plataformas van un 15 % más rápido. A partir del nivel 8 no se aceleran más.
- [ ] Perder la última vida (HUD con "—" en vidas) abre el modal de fin de partida tras la pausa de muerte de 1 s.
- [ ] La puntuación nunca supera 9.999.999.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA ni GAME OVER, y no carga ninguna imagen.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego (flechas y `KeyW`, `KeyA`, `KeyS`, `KeyD`) funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA":
  - Los carriles, el tiempo, la mosca y las tortugas se congelan.
  - Las teclas pulsadas en pausa no hacen saltar a la rana al reanudar.
  - Al reanudar no hay saltos de posición.
- [ ] Perder la última vida abre el modal "FIN DEL JUEGO" con la puntuación real; el motor deja de procesar teclas.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle (el tráfico va igual de rápido que en la primera partida): puntuación 0, 3 vidas, nivel 1, casillas vacías, rana en la salida y 30 s.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor y quita los listeners. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'river-hopper'`. La marca aparece en `/games/river-hopper` y en `/hall-of-fame?game=river-hopper`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `river-hopper` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] `/games/asteroids/play`, `/games/block-stack/play`, `/games/wall-breaker/play` y `/games/fruit-snake/play` funcionan igual que antes, y `/games/frog-crossing/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta RIVER HOPPER (ARCADE, acento yellow) al final, y la tarjeta FROG CROSSING conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con el HUD, la pausa y el modal del Reproductor (patrón de SPEC 05). **No:** HUD, GAME OVER o pantalla de inicio dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 con un tablero de 16×12 celdas de 50 px que lo ocupa entero. **No:** un tamaño de canvas por juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas.
- **Sí:** reutilizar `shared/` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MAXIMUM_FRAME_SECONDS`, `KeyboardInput`). **No:** copiar código compartido.
- **Sí:** valores iniciales de balance fijados en esta spec. **No:** dejarlos para la implementación.
- **Decisión de game-jam (tema: Frogger):** esta es la versión completa del género y por eso es la recomendada: tráfico, río con troncos, tortugas que se hunden, cinco casillas de meta, tiempo, mosca y niveles. Descartado: una versión reducida sin tortugas ni mosca (menos reconocible) y una variante infinita (spec 02).
- **Decisión de game-jam (tema: Frogger):** la rana se mueve en saltos de 50 px con x continua. Descartado: movimiento por celdas enteras, porque sobre el río el arrastre no cae en la rejilla y haría imposible el cálculo de plataformas.
- **Decisión de game-jam (tema: Frogger):** los huecos de meta miden 70 px y se evalúa el centro de la rana. Descartado: huecos de una celda de 50 px, que penalizan un salto desplazado por la corriente.
- **Decisión de game-jam (tema: Frogger):** una pulsación = un salto, sin repetición al mantener la tecla, con 0,08 s de enfriamiento. Descartado: salto continuo mantenido, que facilita cruzar sin pensar.
- **Decisión de game-jam (tema: Frogger):** 3 vidas, `lives` = vidas restantes y baja en el instante de la muerte. `level` = 1 + tableros completados, sin máximo; la velocidad se limita a ×2 en el nivel 8.
- **Decisión de game-jam (tema: Frogger):** puntuación limitada a 9.999.999 con `Math.min`. Con el bonus máximo un tablero vale unos 4.300 puntos, así que llegar al tope exigiría más de 2.000 tableros.
- **Decisión de game-jam (tema: Frogger):** sin vidas extra, cocodrilos ni otros enemigos. Mantiene la spec en un tamaño asumible.
- **Decisión de game-jam (tema: Frogger):** tarjeta nueva `river-hopper` con título RIVER HOPPER, categoría ARCADE y acento yellow. `frog-crossing` ya existe como tarjeta simulada y la regla del flujo es crear siempre una tarjeta nueva, así que no se convierte ni se toca. Se elige `yellow` porque el acento de ARCADE más reciente es `green` (FRUIT SNAKE) y `yellow` solo lo usa BLOCK STACK. Descartado: `frog-crossing` como id, `FROGGER` como título (nombre de un juego comercial).
- **Decisión de game-jam (tema: Frogger):** estilo plano sobre negro, como ASTEROIDS, WALL BREAKER y FRUIT SNAKE. **No:** neón.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`, que desengancha `KeyboardInput`. Criterios explícitos. |
| Las flechas desplazan la página o WASD/flechas activan el botón enfocado | Las 8 teclas en `GAME_KEY_CODES` con `preventDefault`; se verifica con PAUSA enfocado. |
| Al reanudar o volver a la pestaña la rana salta o las plataformas dan un tirón | Marca de tiempo reiniciada en pausa y tope `MAXIMUM_FRAME_SECONDS`. |
| La rana atraviesa un vehículo a alta velocidad en un cuadro largo | Tope de 0,05 s: a 320 px/s (160 × ×2) el vehículo se mueve 16 px por cuadro, menos que la caja de la rana. |
| Un hueco en el río deja un carril sin plataformas a cruzar | Cada carril tiene hasta 220 px de hueco y siempre hay al menos 2 objetos en 960 px; la tabla se comprobó a mano con velocidad ×1 y ×2. |
| Las tortugas sumergidas matan sin aviso | El aviso de 1 s se dibuja distinto y la rana sigue segura durante él. |
| Puntuación por encima de 9.999.999 | Tope `MAXIMUM_SCORE`; el máximo realista por tablero ronda 4.300. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- Cocodrilos, serpientes, nutrias y otros enemigos.
- Vidas extra.
- Sonido y restyle neón.
- Controles táctiles, mando, teclas configurables y nitidez en alta densidad.
- Cambios en `GameSnapshot`, `GamePlayer`, `GameCanvas` o el leaderboard.
- Convertir `frog-crossing`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
