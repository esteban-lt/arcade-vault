# SPEC 02 — Juego LEAP LANE

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-11-22
> **Objective:** Crear el juego de saltos infinitos entre carriles LEAP LANE como motor TypeScript sobre canvas, conectado al Reproductor de `/games/leap-lane/play`, con su tarjeta en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

> **Game-jam (tema: Frogger).** Esta es una spec **alternativa** (02) de `specs/game-jam/frogger/`; la recomendada es la 01 (RIVER HOPPER). Solo una se promociona. Para implementarla hay que moverla a `specs/NN-leap-lane-game.md` con el siguiente número global, cambiar `SPEC 02` por `SPEC NN` en el título y pasar `Status` a `Aprobado`.

Interpreta el tema como una carrera infinita: una rana salta hacia arriba por una pantalla que avanza sola y que genera carriles de hierba, carretera y río con troncos sin parar. No hay casillas de meta: la partida termina al morir, y la puntuación mide hasta dónde llegaste. Es un juego de una sola vida con tensión constante, ya que la pantalla empuja a la rana hacia abajo.

Sigue el patrón de SPEC 05 (motor sin React + registro + `GameCanvas`) y SPEC 06 (`public.games` con `accepts_scores`). No hay código de referencia: esta spec fija la jugabilidad completa y sus valores iniciales. Solo usa mecánicas del género (carriles de tráfico, plataformas móviles) y no reproduce ningún juego comercial.

Reutiliza `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts`, `math.ts`). No hay paso de generalización. La tarjeta simulada `frog-crossing` no se toca.

---

## Alcance

**Dentro:**

- Motor en `src/lib/games/leap-lane/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes (`constants.ts`).
  - Los carriles (`lane.ts`): objetos que se desplazan en bucle y pruebas de solape.
  - El generador de carriles (`lane-generator.ts`).
  - La rana y las monedas (`frog.ts`, `coin.ts`).
  - La clase `LeapLaneEngine`, con la fábrica `createLeapLaneEngine` que cumple `GameEngineFactory`.
- Entrada `"leap-lane"` en `GAME_ENGINE_FACTORIES`. `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad:
  - Pantalla de 16 columnas × 12 filas visibles de celdas de 50 px (800×600). Las filas del mundo se numeran desde 0 en la salida y crecen hacia arriba.
  - La rana empieza en x = 400, fila 1, mirando arriba. Las filas 0–2 son hierba. Desde la fila 3 se generan carriles al azar.
  - Salto: una pulsación mueve la rana 50 px (una fila o 50 px a los lados). Enfriamiento de 0,08 s en el que se ignoran pulsaciones. Se puede saltar hacia abajo. Un salto fuera de x ∈ [25, 775] se ignora.
  - La posición horizontal de la rana es continua, porque sobre troncos se desplaza.
  - La cámara avanza sola `autoScrollRowsPerSecond = min(0,3 + 0,05 × (nivel − 1), 1)` filas por segundo. Si la rana sube por encima de la fila 7 de la pantalla contando desde abajo, la cámara la sigue hasta 8 filas por segundo.
  - La cámara nunca retrocede. Muerte por el borde inferior: si el centro de la rana queda por debajo de la pantalla (`fila de la rana + 0,5 < fila de la cámara`), muere.
  - Carretera: vehículos en bucle por carril. Muere si su caja de colisión (28×28) solapa un vehículo (34 px de alto).
  - Río: solo troncos (sin tortugas). Muere si el centro de la rana no está sobre un tronco al terminar el cuadro, o si sale de x ∈ [0, 800]. Sobre un tronco se desplaza con él.
  - Hierba: segura. Con probabilidad 0,25 una fila de hierba generada lleva una moneda en una columna al azar. La rana la recoge al entrar en su celda.
  - Generación: se mantienen generadas las filas hasta 2 por encima del borde superior de la pantalla y se descartan las que quedan 2 por debajo del borde inferior.
  - Reglas del generador: a cada fila nueva se le elige un tipo (hierba 25 %, carretera 45 %, río 30 %), con estas restricciones: como máximo 4 carreteras seguidas, como máximo 3 ríos seguidos y como máximo 5 filas seguidas sin hierba (la siguiente es hierba forzada). Un carril de río que sigue a otro de río va en dirección contraria; en el resto la dirección es al azar.
  - Dificultad: multiplicador de velocidad `min(1 + 0,08 × (nivel − 1), 1,8)` aplicado a las velocidades base del carril al generarlo.
  - Muerte: la rana se dibuja con su marca durante 1 s (el mundo sigue moviéndose) y la partida termina.
- Controles (`KeyboardEvent.code`), todos de una pulsación:
  - `ArrowUp` o `KeyW`: saltar arriba.
  - `ArrowDown` o `KeyS`: saltar abajo.
  - `ArrowLeft` o `KeyA`: saltar a la izquierda.
  - `ArrowRight` o `KeyD`: saltar a la derecha.
  - Mientras la partida está en curso, esas teclas no desplazan la página. `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - `score` = `10 × fila máxima alcanzada + 50 × monedas recogidas`.
  - `lives` = 1 al empezar y 0 al morir.
  - `level` = `1 + floor(fila máxima alcanzada / 20)`, sin máximo.
  - Puntuación acotada a 9.999.999.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT. Estilo vectorial plano.
- Indicadores propios del juego dibujados en el canvas: una banda roja translúcida en la fila inferior de la pantalla que marca la zona de caída. El motor no dibuja puntuación, vidas, nivel, PAUSA ni GAME OVER.
- Nueva tarjeta `leap-lane` (LEAP LANE) al final de `GAMES`, con su portada `cover-leap-lane` en `globals.css`.
- Migración en Supabase que inserta `leap-lane` en `public.games` con `accepts_scores = true`.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Más de una vida, tiempo por intento y casillas de meta.
- Obstáculos en la hierba, tortugas, enemigos y power-ups.
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `frog-crossing`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/leap-lane/constants.ts
export const GAME_KEY_CODES = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyS", "KeyA", "KeyD",
] as const;
export const INITIAL_LIVES = 1;
export const MAXIMUM_SCORE = 9_999_999;

export const BOARD_COLUMNS = 16;
export const VISIBLE_ROWS = 12;
export const CELL_SIZE_PIXELS = 50;
export const INITIAL_SAFE_ROWS = 3;                  // world rows 0..2 are grass
export const INITIAL_FROG_ROW = 1;
export const START_X_PIXELS = 400;
export const FROG_MINIMUM_X_PIXELS = 25;
export const FROG_MAXIMUM_X_PIXELS = 775;
export const FROG_HOP_DISTANCE_PIXELS = 50;
export const FROG_HOP_COOLDOWN_SECONDS = 0.08;
export const FROG_DRAW_SIZE_PIXELS = 34;
export const FROG_HITBOX_SIZE_PIXELS = 28;
export const VEHICLE_HEIGHT_PIXELS = 34;
export const DEATH_PAUSE_SECONDS = 1;

export const INITIAL_AUTO_SCROLL_ROWS_PER_SECOND = 0.3;
export const AUTO_SCROLL_INCREMENT_PER_LEVEL = 0.05;
export const MAXIMUM_AUTO_SCROLL_ROWS_PER_SECOND = 1;
export const CAMERA_LEAD_ROWS = 7;                   // the frog never goes above screen row 7 (from the bottom)
export const CAMERA_CATCH_UP_ROWS_PER_SECOND = 8;
export const GENERATE_AHEAD_ROWS = 2;
export const DISCARD_BEHIND_ROWS = 2;

export const ROWS_PER_LEVEL = 20;
export const POINTS_PER_ROW = 10;
export const POINTS_PER_COIN = 50;
export const COIN_PROBABILITY_PER_GRASS_ROW = 0.25;
export const SPEED_MULTIPLIER_PER_LEVEL = 0.08;
export const MAXIMUM_SPEED_MULTIPLIER = 1.8;

export const LANE_LOOP_LENGTH_PIXELS = 960;          // 800 visible + 80 margin on each side
export const LANE_WRAP_MARGIN_PIXELS = 80;           // objects are at most 160 px wide

export const LANE_KIND_WEIGHTS = { grass: 0.25, road: 0.45, river: 0.3 };
export const MAXIMUM_CONSECUTIVE_ROAD_LANES = 4;
export const MAXIMUM_CONSECUTIVE_RIVER_LANES = 3;
export const MAXIMUM_LANES_WITHOUT_GRASS = 5;

// Vehicle kinds: width in px, objects per 960 px loop, base speed range in px/s, probability among road lanes
export const VEHICLE_KINDS = {
  car:    { widthPixels: 60,  objectCountRange: [3, 4], speedRangePixelsPerSecond: [70, 130],  probability: 0.5 },
  truck:  { widthPixels: 110, objectCountRange: [2, 3], speedRangePixelsPerSecond: [50, 90],   probability: 0.25 },
  racer:  { widthPixels: 50,  objectCountRange: [2, 3], speedRangePixelsPerSecond: [130, 200], probability: 0.25 },
} as const;
export const LOG_WIDTH_OPTIONS_PIXELS = [120, 160, 200] as const;
export const LOG_OBJECT_COUNT_OPTIONS = [2, 3] as const;
export const LOG_SPEED_RANGE_PIXELS_PER_SECOND = [50, 100] as const;

// Drawing (flat vector on black)
export const GRASS_COLOR = "#14532d";
export const GRASS_TUFT_COLOR = "#1d7a3f";
export const RIVER_COLOR = "#0b2a6b";
export const ROAD_COLOR = "#262626";
export const ROAD_MARKING_COLOR = "#cfcfcf";
export const LOG_COLOR = "#8a5a2b";
export const LOG_GRAIN_COLOR = "#6b4220";
export const COIN_COLOR = "#f0d040";
export const FROG_COLOR = "#6ee05a";
export const FROG_EYE_COLOR = "#000";
export const FROG_DEATH_COLOR = "#e04848";
export const FROG_DROWN_COLOR = "#7ac0ff";
export const DANGER_BAND_COLOR = "rgba(224,72,72,0.25)";
```

```ts
// src/lib/games/leap-lane/ types
export type LaneKind = "grass" | "road" | "river";
export type LaneDirection = "left" | "right";
export type VehicleKind = "car" | "truck" | "racer";
export type DeathCause = "vehicle" | "water" | "off-screen" | "fell-behind";
```

```ts
// src/lib/games/leap-lane/ internal shapes
// Lane: worldRow, kind, direction, speedPixelsPerSecond (already multiplied by the difficulty), objectWidthPixels,
//   objectCount, initialOffsetPixels (random in [0, 960)), scrollOffsetPixels, vehicleKind | null, coinX | null
//   objectLeftPixels(index) = positiveModulo(index × (960 / objectCount) + initialOffsetPixels + scrollOffsetPixels, 960) − 80
//   platformUnder(centerX): boolean (river); overlapsHitbox(frogBox): boolean (road)
// generateLane(worldRow, previousLanes, level): Lane — applies the kind weights and the consecutive limits.
// Frog: centerX, worldRow, facing, hopCooldownSeconds, deathCause
// LeapLaneEngine state: lanes (Map<worldRow, Lane>), frog, cameraRow (float), furthestRow, coinsCollected,
//   score, lives, level, deathPauseSeconds, phase: "playing" | "dying" | "game-over"
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
  "fruit-snake": createFruitSnakeEngine,
  "leap-lane": createLeapLaneEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "leap-lane",
  title: "LEAP LANE",
  shortDescription: "Salta sin parar entre tráfico y ríos antes de que la pantalla te alcance.",
  longDescription:
    "Salta con las flechas o WASD por carriles de hierba, carretera y río que se generan sin fin. La pantalla avanza sola y te empuja hacia abajo, así que no puedes quedarte quieto. Cada fila nueva suma 10 puntos, las monedas de la hierba suman 50 y solo tienes una vida.",
  category: "ARCADE",
  coverClassName: "cover-leap-lane",
  accentColor: "magenta",
}
```

```sql
-- supabase/migrations/<timestamp>_add_leap_lane_game.sql
insert into public.games (id, title, accepts_scores) values ('leap-lane', 'LEAP LANE', true);
```

Dibujo (800×600, fondo `#000`). La fila de mundo `r` se dibuja con su borde superior en `y = 600 − (r − cameraRow + 1) × 50`:

- **Hierba:** rectángulo `GRASS_COLOR` con tres motas de 6×6 `GRASS_TUFT_COLOR` en posiciones fijas derivadas de la fila (`(fila × 7 + k × 5) mod 16` como columna, k = 0, 1, 2). Moneda: círculo de radio 8 `COIN_COLOR` con un borde de 2 px un 20 % más oscuro, centrada en su celda.
- **Carretera:** rectángulo `ROAD_COLOR` con una línea discontinua de 2 px `ROAD_MARKING_COLOR` (trazos de 30 y huecos de 30) en el borde superior si la fila de encima también es carretera.
- **Río:** rectángulo `RIVER_COLOR` y troncos (rectángulo redondeado de radio 8, 40 px de alto, `LOG_COLOR`, con dos rayas de 2 px `LOG_GRAIN_COLOR`).
- **Vehículos:** rectángulos de 34 px de alto centrados en la fila. Coche `#e03a3a`, camión `#d0a030` y deportivo `#30b0e0`, con dos ventanas de 10×8 `#000` hacia el lado al que van.
- **Rana:** igual que la de las demás specs del tema: rectángulo redondeado de 34×34 radio 10 `FROG_COLOR`, dos ojos de 6×6 hacia donde mira, 15 % más grande durante el enfriamiento. Muerta: X de 4 px `FROG_DEATH_COLOR` o, si murió en el agua, dos anillos `FROG_DROWN_COLOR` de radios 12 y 20.
- **Banda de peligro:** rectángulo de 800×50 en y = 550 con `DANGER_BAND_COLOR`, dibujado al final.

Convenciones:

- Coordenadas con origen arriba a la izquierda en pantalla. Las filas del mundo crecen hacia arriba y se convierten a píxeles con la cámara.
- Los carriles avanzan con `deltaSeconds` (con tope `MAXIMUM_FRAME_SECONDS`). El mundo se mueve en `playing` y en `dying`, y se detiene en `game-over`.
- Orden del cuadro en `playing`: pulsaciones y salto → carriles → arrastre sobre tronco → cámara (avance automático y seguimiento) → generación y descarte de carriles → muertes → monedas → puntuación y nivel.
- En pausa no avanza nada y las pulsaciones hechas en pausa se descartan (`consumePress` de las 8 teclas).
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo: `lives` = 1 en juego y 0 al morir; con el botón FIN se queda en 1. `level` = `1 + floor(fila máxima / 20)`. `score` según el alcance.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Constantes y tipos.**
   - Crear `src/lib/games/leap-lane/constants.ts` con los valores del modelo de datos y los tipos `LaneKind`, `LaneDirection`, `VehicleKind` y `DeathCause`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Carriles y generador.**
   - Crear `lane.ts` (posición de objetos en bucle, `platformUnder`, `overlapsHitbox`, dibujo) y `lane-generator.ts` (`generateLane` con pesos, límites de repetición, direcciones y velocidades según el nivel).
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Rana y monedas.**
   - Crear `frog.ts` (salto con enfriamiento, caja de colisión, dibujo vivo y muerto) y `coin.ts` (colocación y dibujo).
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor: ciclo de vida y escena.**
   - Crear `leap-lane-engine.ts` con `LeapLaneEngine` y `createLeapLaneEngine`, siguiendo las reglas de ciclo de vida de la guía: bucle idempotente, `KeyboardInput`, `startNewGame()` (filas 0–2 de hierba, generación inicial, rana en la fila 1), `finishGame()`, `destroy()`, `GameSnapshot` y dibujo de carriles y banda de peligro.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Motor: saltos, cámara y muertes.**
   - Añadir lectura de pulsaciones, salto, arrastre sobre troncos, cámara con avance automático y seguimiento, generación y descarte de carriles, muertes (vehículo, agua, bordes, caída por abajo) y fase `dying` de 1 s.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
6. **Motor: puntuación y niveles.**
   - Añadir fila máxima alcanzada, monedas, nivel, multiplicador de dificultad aplicado a los carriles nuevos y tope de puntuación.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
7. **Tarjeta del catálogo.**
   - Añadir `leap-lane` al final de `GAMES`.
   - Añadir `.cover-leap-lane` en `globals.css`: fondo `linear-gradient(#14532d 0 34%, #262626 34% 67%, #0b2a6b 67% 100%)` y un `::after` con un SVG en data URI (`#` como `%23`) que dibuja una rana `#6ee05a`, un tronco `#8a5a2b` y una moneda `#f0d040`.
   - Hasta el paso 8 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta LEAP LANE, `/games/leap-lane` carga y `npm run build` pasa.
8. **Registro.**
   - Añadir `"leap-lane": createLeapLaneEngine` en `engine-registry.ts`.
   - Verificación: `/games/leap-lane/play` se juega de verdad. Los demás juegos reales y la simulación de `frog-crossing` no cambian.
9. **Leaderboard.**
   - Aplicar con `apply_migration` (`add_leap_lane_game`) el `insert` del modelo de datos y guardar el mismo SQL en `supabase/migrations/<timestamp>_add_leap_lane_game.sql`.
   - Revisar `get_advisors`.
   - Verificación: `public.games` tiene `leap-lane` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/leap-lane`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/leap-lane/play` arranca directamente: rana en x = 400 sobre hierba, carriles generados por encima, banda roja translúcida abajo y HUD en 0 / 1 vida / 01.
- [ ] Cada pulsación de dirección mueve la rana 50 px, con enfriamiento de 0,08 s. Un salto fuera de x ∈ [25, 775] se ignora.
- [ ] La cámara sube sola 0,3 filas por segundo (15 px/s) en el nivel 1 y la rana, si se queda quieta, acaba cayendo por el borde inferior y muere.
- [ ] Subir por encima de la fila 7 de la pantalla hace que la cámara siga a la rana.
- [ ] Cada fila nueva alcanzada suma 10 puntos. Bajar y volver a subir no suma hasta superar la fila máxima.
- [ ] Una moneda recogida suma 50 puntos y desaparece.
- [ ] Tocar un vehículo, caer al agua o salir por un lado sobre un tronco mata a la rana (X roja o anillos azules 1 s) y el HUD pasa a "—" en vidas antes del modal.
- [ ] En el río, la rana sobre un tronco se desplaza con él.
- [ ] Nunca hay más de 4 carreteras seguidas, más de 3 ríos seguidos ni más de 5 filas seguidas sin hierba. Un río tras otro va en dirección contraria.
- [ ] Al llegar a la fila 20 el HUD pasa a nivel 02; los carriles generados desde entonces van un 8 % más rápidos y la cámara avanza 0,35 filas por segundo.
- [ ] La puntuación nunca supera 9.999.999.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA ni GAME OVER, y no carga ninguna imagen.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA"; las pulsaciones hechas en pausa no saltan al reanudar y no hay saltos de posición ni de cámara.
- [ ] Morir abre el modal "FIN DEL JUEGO" con la puntuación real; el motor deja de procesar teclas.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle: puntuación 0, 1 vida, nivel 1, nuevos carriles y la cámara a la misma velocidad que en la primera partida.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor y quita los listeners. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'leap-lane'`. La marca aparece en `/games/leap-lane` y en `/hall-of-fame?game=leap-lane`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `leap-lane` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] Los demás juegos reales funcionan igual que antes, y `/games/frog-crossing/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta LEAP LANE (ARCADE, acento magenta) al final, y la tarjeta FROG CROSSING conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con HUD, pausa y modal del Reproductor (patrón de SPEC 05). **No:** HUD o GAME OVER dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 con 16×12 celdas de 50 px visibles. **No:** un tamaño de canvas por juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas.
- **Sí:** reutilizar `shared/`. **No:** copiar código compartido.
- **Sí:** valores iniciales de balance fijados en esta spec. **No:** dejarlos para la implementación.
- **Decisión de game-jam (tema: Frogger):** carrera infinita con generación procedural en vez de tablero fijo con casillas de meta. Un solo número (distancia más monedas) hace comparable el ranking sin fijar niveles. Es la alternativa con más rejugabilidad, pero se parece menos al original, por eso no es la recomendada.
- **Decisión de game-jam (tema: Frogger):** una sola vida; `lives` pasa de 1 a 0 (el contrato `GameSnapshot` no cambia). Descartado: 3 vidas con reaparición, que obligaría a decidir qué hace la cámara al reaparecer.
- **Decisión de game-jam (tema: Frogger):** la cámara avanza sola y mata por el borde inferior. Descartado: tiempo límite por fila, que penaliza igual pero no se ve.
- **Decisión de game-jam (tema: Frogger):** los ríos solo llevan troncos. Descartado: tortugas que se hunden (spec 01), que añaden estado por objeto sin aportar a una carrera.
- **Decisión de game-jam (tema: Frogger):** el generador usa carriles en bucle de 960 px con 2–4 objetos, de modo que cada río siempre tiene al menos 2 troncos y es siempre cruzable. Los límites de repetición evitan tramos imposibles.
- **Decisión de game-jam (tema: Frogger):** monedas solo en hierba (50 puntos, probabilidad 0,25) para premiar el desvío. Descartado: monedas en carretera o río.
- **Decisión de game-jam (tema: Frogger):** mapeo de `level` = 1 + floor(fila máxima / 20), que sube la dificultad y la velocidad de la cámara.
- **Decisión de game-jam (tema: Frogger):** tarjeta nueva `leap-lane` con título LEAP LANE, categoría ARCADE y acento magenta (solo lo usa WALL BREAKER entre los juegos reales). Descartado: reutilizar `frog-crossing`, que sigue como simulación; `CROSSY` o nombres de juegos comerciales.
- **Decisión de game-jam (tema: Frogger):** estilo plano sobre negro, como los demás juegos reales. **No:** neón.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`. |
| Las flechas desplazan la página o activan el botón enfocado | Las 8 teclas en `GAME_KEY_CODES` con `preventDefault`. |
| Al reanudar la cámara o las plataformas dan un tirón | Marca de tiempo reiniciada en pausa y tope `MAXIMUM_FRAME_SECONDS`. |
| El generador crea un tramo sin salida | Los límites de repetición, la hierba forzada cada 5 filas y los ríos siempre con troncos hacen todo tramo cruzable. |
| Los carriles descartados dejan memoria acumulada | Se eliminan los carriles 2 filas por debajo de la pantalla. |
| Puntuación por encima de 9.999.999 | Tope `MAXIMUM_SCORE`; alcanzarlo exigiría unas 1.000.000 filas. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- Más de una vida, tiempo por intento y casillas de meta.
- Obstáculos en la hierba, tortugas, enemigos y power-ups.
- Sonido.
- Controles táctiles, mando, teclas configurables y nitidez en alta densidad.
- Cambios en `GameSnapshot`, `GamePlayer`, `GameCanvas` o el leaderboard.
- Convertir `frog-crossing`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
