# SPEC 09 — Juego FRUIT SNAKE

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-11-19
> **Objective:** Crear el juego de serpiente FRUIT SNAKE como motor TypeScript sobre canvas, conectado al Reproductor de `/games/fruit-snake/play`, con su tarjeta en el catálogo y sus puntuaciones en el leaderboard.

---

## Por qué existe esta spec

El catálogo tiene una tarjeta simulada de serpiente (`serpentine`), pero ningún juego real del género. Esta spec añade FRUIT SNAKE como **cuarto juego real de la plataforma**. Sigue el patrón de SPEC 05: motor TypeScript sin React, registro por id y `GameCanvas` dentro de `GamePlayer`. También sigue el de SPEC 06: una fila en `public.games` con `accepts_scores = true` para que las puntuaciones lleguen al ranking.

No hay código de referencia: esta spec fija la jugabilidad completa y sus valores iniciales. La carpeta `references/snake-assets/` solo contiene recursos:

- `fruits.png`: una hoja de 3790×442 px con unas 22 frutas en tres estilos.
- `sprites.js`: un atlas de recortes con coordenadas que no coinciden con las imágenes.

Esa hoja viene del juego de serpiente de un producto comercial (según el propio `sprites.js`). El juego no la usa: dibuja cuatro frutas propias con formas vectoriales planas.

Reutiliza el código compartido que SPEC 07 creó en `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts`, `math.ts`). No hay paso de generalización.

La tarjeta simulada `serpentine` (SERPENTINE) no se toca.

---

## Alcance

**Dentro:**

- Motor en `src/lib/games/fruit-snake/`, en TypeScript estricto, sin globals y sin React. Contiene:
  - Las constantes (`constants.ts`).
  - La serpiente (`snake.ts`): segmentos, dirección, cola de giros, avance, crecimiento, choques y dibujo.
  - La fruta (`fruit.ts`): tipos, aparición en una celda libre y dibujo vectorial.
  - La clase `FruitSnakeEngine`, con la fábrica `createFruitSnakeEngine` que cumple `GameEngineFactory`.
- Entrada `"fruit-snake"` en `GAME_ENGINE_FACTORIES` (`src/lib/games/engine-registry.ts`). `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad:
  - Tablero de 40 columnas × 30 filas de celdas de 20 px. Ocupa el canvas entero de 800×600.
  - La serpiente empieza con 3 segmentos: cabeza en (20, 15) y cuerpo en (19, 15) y (18, 15). Mira a la derecha y avanza desde el primer cuadro (no hay pantalla de inicio).
  - La serpiente avanza una celda por paso. El intervalo entre pasos es `max(0,12 − 0,01 × (nivel − 1), 0,05)` segundos: 0,12 s en el nivel 1 y 0,05 s a partir del nivel 8.
  - El paso se mide acumulando `deltaSeconds` en un temporizador. Si el temporizador acumula varios intervalos en un cuadro, se dan varios pasos.
  - Siempre hay exactamente una fruta en el tablero. Aparece en una celda libre (sin serpiente) elegida al azar con probabilidad uniforme. Su tipo (manzana, cereza, limón o uva) también es aleatorio y solo cambia el dibujo.
  - Al entrar la cabeza en la celda de la fruta: la serpiente crece un segmento (la cola no avanza en ese paso), se suman `10 × nivel` puntos con el nivel antes de comer, sube el contador de frutas, se recalcula el nivel y aparece una fruta nueva.
  - Nivel = `1 + floor(frutas comidas / 5)`. Sube con las frutas 5, 10, 15…
  - Choque mortal: la cabeza sale del tablero (columna < 0 o > 39, fila < 0 o > 29) o entra en una celda ocupada por el cuerpo. Entrar en la celda que deja libre la cola en ese mismo paso no es choque (cuando la serpiente no crece).
  - Al chocar, la serpiente no avanza: se queda como estaba antes del paso, con la cabeza en rojo. La partida termina.
  - Si tras comer no queda ninguna celda libre (1.200 segmentos), la partida termina con victoria (`onGameOver` con la puntuación final).
- Controles (`KeyboardEvent.code`), todos de una pulsación:
  - `ArrowUp` o `KeyW`: arriba.
  - `ArrowDown` o `KeyS`: abajo.
  - `ArrowLeft` o `KeyA`: izquierda.
  - `ArrowRight` o `KeyD`: derecha.
  - Cola de giros de hasta 2 direcciones. Cada paso consume como máximo una.
  - Un giro se descarta si la cola está llena, si es igual a la última dirección pedida o si es la opuesta (la última pedida es la última de la cola o, con la cola vacía, la dirección actual).
  - Mientras la partida está en curso, esas teclas no desplazan la página. `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`:
  - `10 × nivel` puntos por fruta. El máximo posible es 1.438.800 (tablero lleno).
  - `lives` = 1 al empezar y 0 al chocar.
  - `level` = nivel actual, desde 1, sin máximo.
- Canvas lógico compartido de 800×600, escalado por CSS dentro del marco CRT. El tablero ocupa el canvas entero, sin paneles laterales.
- Estilo vectorial plano sobre fondo negro, con rejilla tenue (colores en el modelo de datos).
- Indicadores propios del juego dibujados en el canvas: ninguno. El motor no dibuja puntuación, vidas, nivel, PAUSA ni GAME OVER.
- Nueva tarjeta `fruit-snake` (FRUIT SNAKE) al final de `GAMES`, con su portada `cover-fruit-snake` en `globals.css`.
- Migración en Supabase que inserta `fruit-snake` en `public.games` con `accepts_scores = true`. Así sus puntuaciones se guardan y aparecen en el ranking, el Salón de la Fama y las estadísticas.
- Texto de la UI en español. Rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas (`deltaSeconds`, no `dt`; `context`, no `ctx`).

**Fuera de alcance (para otras specs):**

- `references/snake-assets/fruits.png`, su atlas `sprites.js` y cualquier imagen externa.
- Frutas especiales con valores distintos, obstáculos, power-ups y modos de juego.
- Bordes que se atraviesan.
- Más de una vida.
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Reestilizar el juego con los colores neón de la plataforma.
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Convertir o retirar la simulación de `serpentine`.
- Pruebas automatizadas y semilla determinista del azar.

---

## Modelo de datos

```ts
// src/lib/games/fruit-snake/constants.ts
export const GAME_KEY_CODES = [
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyS", "KeyA", "KeyD",
] as const;
export const INITIAL_LIVES = 1;

export const BOARD_COLUMNS = 40;
export const BOARD_ROWS = 30;
export const CELL_SIZE_PIXELS = 20;                 // 40 × 20 = 800, 30 × 20 = 600

export const INITIAL_SNAKE_HEAD_COLUMN = 20;
export const INITIAL_SNAKE_HEAD_ROW = 15;
export const INITIAL_SNAKE_LENGTH = 3;              // head + 2 segments to its left
export const INITIAL_DIRECTION: Direction = "right";

export const INITIAL_STEP_INTERVAL_SECONDS = 0.12;
export const STEP_INTERVAL_DECREMENT_PER_LEVEL_SECONDS = 0.01;
export const MINIMUM_STEP_INTERVAL_SECONDS = 0.05;
export const MAXIMUM_QUEUED_TURNS = 2;

export const FRUITS_PER_LEVEL = 5;
export const POINTS_PER_FRUIT_PER_LEVEL = 10;

// Drawing (flat vector on black)
export const GRID_LINE_COLOR = "rgba(255,255,255,0.04)";
export const SNAKE_BODY_COLOR = "#2fbf5a";
export const SNAKE_HEAD_COLOR = "#7be08f";
export const SNAKE_CRASHED_HEAD_COLOR = "#e04848";
export const SNAKE_EYE_COLOR = "#000";
export const SNAKE_SEGMENT_INSET_PIXELS = 1;        // segments are drawn 18×18 inside their cell
export const SNAKE_EYE_SIZE_PIXELS = 3;
export const FRUIT_COLORS: Record<FruitKind, string> = {
  apple: "#e03a3a", cherry: "#c8203a", lemon: "#f0d040", grape: "#8a4fd0",
};
export const FRUIT_LEAF_COLOR = "#3cc05a";
export const FRUIT_STEM_COLOR = "#6a8a3a";
```

```ts
// src/lib/games/fruit-snake/ types
export type Direction = "up" | "down" | "left" | "right";
export type FruitKind = "apple" | "cherry" | "lemon" | "grape";
type Cell = { column: number; row: number };
```

```ts
// src/lib/games/fruit-snake/snake.ts (internal shape)
// Snake: segments: Cell[] (index 0 = head); direction: Direction; queuedTurns: Direction[]; isCrashed: boolean
//   requestTurn(direction): applies the queue rules of the scope.
//   nextHeadCell(): Cell — consumes one queued turn (if any) and returns the cell in front of the head.
//   advanceTo(cell, isGrowing): moves the head; removes the tail unless isGrowing.
//   collidesWith(cell, isGrowing): true when the cell is outside the board or on the body
//     (the tail cell does not count when not growing).
//   occupies(cell): boolean; draw(context)
```

```ts
// src/lib/games/fruit-snake/fruit.ts (internal shape)
// Fruit: cell: Cell; kind: FruitKind; draw(context)
// spawnFruit(snake): Fruit | null — uniform over free cells, null when the board is full.
```

```ts
// src/lib/games/fruit-snake/fruit-snake-engine.ts (internal state, not exported)
type FruitSnakePhase = "playing" | "game-over";
// state: snake, fruit, score, lives, level, fruitsEaten, stepTimerSeconds, phase
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "block-stack": createBlockStackEngine,
  "wall-breaker": createWallBreakerEngine,
  "fruit-snake": createFruitSnakeEngine,
};
```

```ts
// src/lib/games.ts → GAMES (appended at the end)
{
  id: "fruit-snake",
  title: "FRUIT SNAKE",
  shortDescription: "Guía la serpiente, come frutas y no choques contra nada.",
  longDescription:
    "Mueve la serpiente con las flechas o WASD por un tablero de 40×30 casillas. Cada fruta la alarga una casilla y suma 10 puntos por nivel. Cada 5 frutas sube el nivel y la serpiente se acelera, y un choque contra el borde o contra tu propio cuerpo termina la partida.",
  category: "ARCADE",
  coverClassName: "cover-fruit-snake",
  accentColor: "green",
}
```

```sql
-- supabase/migrations/<timestamp>_add_fruit_snake_game.sql
insert into public.games (id, title, accepts_scores) values ('fruit-snake', 'FRUIT SNAKE', true);
```

Dibujo (800×600, fondo `#000`, en este orden):

- **Rejilla:** líneas de 1 px con `GRID_LINE_COLOR` cada 20 px, en vertical y en horizontal.
- **Fruta**, centrada en su celda (centro = esquina + 10 px):
  - Manzana: círculo de radio 8 `#e03a3a` y una hoja (elipse de 4×2 px de semiejes, girada 45°) `#3cc05a` arriba a la derecha.
  - Cereza: dos círculos de radio 5 `#c8203a`, separados 8 px en horizontal y 3 px por debajo del centro, unidos por dos tallos de 1,5 px `#6a8a3a` que se juntan 8 px por encima del centro.
  - Limón: elipse de semiejes 9×7 `#f0d040`.
  - Uva: seis círculos de radio 3,5 `#8a4fd0` en tres filas (3, 2, 1) que forman un triángulo con la punta abajo.
- **Serpiente:** cada segmento es un cuadrado de 18×18 (celda reducida 1 px por lado) en `#2fbf5a`. La cabeza va en `#7be08f`, o en `#e04848` si `isCrashed`. La cabeza lleva dos ojos de 3×3 `#000`, colocados en el lado hacia el que mira, a 4 px del borde y separados 8 px entre sí.

Convenciones:

- Coordenadas con origen arriba a la izquierda. Las celdas usan (columna, fila), con (0, 0) arriba a la izquierda. Una celda se dibuja en (columna × 20, fila × 20).
- Juego de rejilla sin entidades con velocidad: todo avanza por pasos. El temporizador de pasos acumula `deltaSeconds` (con tope `MAXIMUM_FRAME_SECONDS`) y nunca cuenta cuadros.
- En pausa no avanza nada: el temporizador de pasos no acumula. Las pulsaciones hechas en pausa se descartan (`consumePress` de las 8 teclas sin aplicarlas), así que la serpiente no gira sola al reanudar.
- En `game-over` no se mueve nada. El canvas sigue mostrando la serpiente y la fruta como quedaron.
- `GameSnapshot` es lo único que cruza del motor a React. El Reproductor es el único dueño de la pausa.
- Mapeo:
  - `score` = suma de `10 × nivel` por fruta.
  - `lives` = 1 en juego y 0 tras chocar. Con victoria o con el botón FIN se queda en 1.
  - `level` = `1 + floor(frutas comidas / 5)`.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components. Cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **Constantes y tipos.**
   - Crear `src/lib/games/fruit-snake/constants.ts` con los valores del modelo de datos y los tipos `Direction`, `FruitKind` y `Cell`.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Serpiente.**
   - Crear `snake.ts` con la serpiente inicial (3 segmentos desde (20, 15) mirando a la derecha), `requestTurn` con las reglas de la cola, `nextHeadCell`, `advanceTo`, `collidesWith` (bordes y cuerpo, sin contar la cola cuando no crece), `occupies` y el dibujo con ojos y cabeza chocada.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Fruta.**
   - Crear `fruit.ts` con `spawnFruit` (celda libre uniforme y tipo aleatorio, `null` si el tablero está lleno) y el dibujo de los cuatro tipos.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor.**
   - Crear `fruit-snake-engine.ts` con `FruitSnakeEngine` y `createFruitSnakeEngine`, siguiendo las reglas de ciclo de vida de la guía:
     - Estado: serpiente, fruta, puntuación, vidas, nivel, frutas comidas, temporizador de pasos, fase y `KeyboardInput` con `GAME_KEY_CODES`.
     - Bucle con `requestAnimationFrame` idempotente.
     - Cada cuadro en `playing`: leer las pulsaciones de las 8 teclas y pasarlas a `requestTurn`; acumular `deltaSeconds`; dar un paso por cada intervalo acumulado.
     - Cada paso: calcular la celda siguiente; si choca, marcar `isCrashed`, poner `lives = 0` y llamar a `finishGame()` sin dar más pasos; si no, avanzar, y al comer sumar puntos, recalcular el nivel y generar fruta. Sin celda libre, `finishGame()`.
     - En pausa: descartar las pulsaciones y no acumular tiempo.
     - `startNewGame()` reinicia todo: puntuación 0, 1 vida, nivel 1, 0 frutas, temporizador 0, serpiente inicial, cola de giros vacía y fruta nueva. Vuelve a enganchar el teclado.
     - `finishGame()` y `destroy()` desenganchan el teclado.
   - Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Tarjeta del catálogo.**
   - Añadir `fruit-snake` al final de `GAMES`.
   - Añadir `.cover-fruit-snake` en `globals.css`, junto a `.cover-wall-breaker`:
     - Fondo `radial-gradient(circle at 50% 45%, #0a1f12, #000)`.
     - Un `::after` con un SVG en data URI (`#` escapado como `%23`).
     - El SVG dibuja una rejilla tenue, una serpiente de cuadrados verdes `#2fbf5a` en forma de L con la cabeza `#7be08f` y dos ojos negros, y delante de la cabeza una manzana `#e03a3a` con hoja `#3cc05a`.
   - Hasta el paso 6 su Reproductor es la simulación.
   - Verificación: `/games` muestra la tarjeta FRUIT SNAKE, `/games/fruit-snake` carga y `npm run build` pasa.
6. **Registro.**
   - Añadir `"fruit-snake": createFruitSnakeEngine` en `engine-registry.ts`.
   - Verificación: `/games/fruit-snake/play` se juega de verdad. `/games/asteroids/play`, `/games/block-stack/play`, `/games/wall-breaker/play` y `/games/serpentine/play` no cambian.
7. **Leaderboard.**
   - Aplicar con `apply_migration` (`add_fruit_snake_game`) el `insert` del modelo de datos.
   - Guardar el mismo SQL en `supabase/migrations/<timestamp>_add_fruit_snake_game.sql`, con el timestamp de `list_migrations`.
   - Revisar `get_advisors` (seguridad y rendimiento).
   - Verificación: `public.games` tiene `fruit-snake` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/fruit-snake`.

---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/fruit-snake/play` arranca directamente:
  - Tablero negro de 40×30 con rejilla tenue.
  - Serpiente de 3 segmentos en el centro (cabeza en (20, 15)) avanzando hacia la derecha.
  - Una fruta en una celda libre.
  - HUD en 0 / 1 vida / 01.
- [ ] En el nivel 1 la serpiente avanza una celda cada 0,12 s (unas 8,3 celdas por segundo).
- [ ] Flechas y WASD giran la serpiente. Pulsar la dirección opuesta a la que lleva no hace nada.
- [ ] Dos giros rápidos dentro del mismo paso (p. ej. arriba y luego izquierda yendo a la derecha) se aplican en dos pasos seguidos. Un tercer giro dentro del mismo paso se ignora.
- [ ] Comer una fruta alarga la serpiente un segmento y hace aparecer otra fruta en una celda libre, nunca sobre la serpiente.
- [ ] Las frutas 1–5 suman 10 puntos cada una; con la quinta el HUD pasa a nivel 02. Las frutas 6–10 suman 20 puntos cada una (150 puntos tras 10 frutas, nivel 03).
- [ ] Cada nivel reduce el intervalo entre pasos 0,01 s, hasta 0,05 s en el nivel 8. A partir de ahí la velocidad no cambia.
- [ ] Las frutas aparecen como manzana, cereza, limón o uva al azar, y todas valen lo mismo.
- [ ] Salir del tablero por cualquier borde o entrar en el propio cuerpo termina la partida: la cabeza se pinta en rojo, la serpiente se queda quieta y el HUD muestra "—" en vidas.
- [ ] Avanzar a la celda que deja la cola en ese mismo paso no termina la partida.
- [ ] El canvas no dibuja puntuación, nivel, vidas, PAUSA ni GAME OVER, y no carga ninguna imagen.

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego (flechas y `KeyW`, `KeyA`, `KeyS`, `KeyD`) funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA":
  - La serpiente se congela.
  - Las teclas pulsadas en pausa no hacen girar la serpiente al reanudar.
  - Al reanudar no hay saltos de varias celdas.
- [ ] Chocar abre el modal "FIN DEL JUEGO" con la puntuación real. El motor deja de procesar teclas y se puede escribir en el modal.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia sin duplicar el bucle (la serpiente va igual de rápida que en la primera partida):
  - Puntuación 0, 1 vida y nivel 1.
  - Serpiente inicial de 3 segmentos hacia la derecha y una fruta nueva.
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor y quita los listeners. Al volver con Atrás, la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez, y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = 'fruit-snake'`. La marca aparece en `/games/fruit-snake` y en `/hall-of-fame?game=fruit-snake`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `fruit-snake` con `accepts_scores = true` y sus ids coinciden con `GAMES`. `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] `/games/asteroids/play`, `/games/block-stack/play` y `/games/wall-breaker/play` funcionan igual que antes, y `/games/serpentine/play` y los demás juegos sin motor mantienen la simulación.
- [ ] `/games` muestra la tarjeta FRUIT SNAKE (ARCADE, acento green) al final, y la tarjeta SERPENTINE conserva su texto.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con el HUD, la pausa y el modal del Reproductor (patrón de SPEC 05). **No:** HUD, GAME OVER o pantalla de inicio dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 con un tablero de 40×30 celdas de 20 px que lo ocupa entero. Decisión del usuario. **No:** 20×15 celdas de 40 px. **No:** tablero cuadrado de 24×24 centrado.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas: la fila nueva basta.
- **Sí:** reutilizar `shared/` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MAXIMUM_FRAME_SECONDS`, `KeyboardInput`) creado en SPEC 07. **No:** copiar código compartido en `fruit-snake/`.
- **Sí:** juego desde cero con los valores iniciales de balance fijados en esta spec. Se pueden reequilibrar en una spec posterior. **No:** dejarlos para la implementación.
- **Sí:** frutas dibujadas con formas vectoriales propias. Decisión del usuario. `references/snake-assets/fruits.png` viene del juego de serpiente de un producto comercial y su atlas tiene coordenadas que no coinciden. **No:** copiar el PNG a `public/`.
- **Sí:** cuatro tipos de fruta (manzana, cereza, limón, uva), solo cosméticos. Decisión del usuario. **No:** una sola fruta. **No:** frutas con valores distintos.
- **Sí:** los bordes del tablero matan. Decisión del usuario. **No:** atravesar bordes.
- **Sí:** nivel cada 5 frutas, con el intervalo entre pasos de 0,12 s que baja 0,01 s por nivel hasta 0,05 s. Decisión del usuario. **No:** velocidad constante. **No:** nivel cada 10 frutas.
- **Sí:** `10 × nivel` puntos por fruta. Decisión del usuario. Premia aguantar a velocidad alta. **No:** 10 puntos fijos. **No:** puntos por tipo de fruta.
- **Sí:** una sola vida; chocar termina la partida y `lives` pasa de 1 a 0. Decisión del usuario. Encaja en `GameSnapshot` sin cambiar el contrato. **No:** 3 vidas con reinicio de la serpiente.
- **Sí:** flechas y WASD, de una pulsación, con una cola de hasta 2 giros que descarta la dirección opuesta. Decisión del usuario. La cola permite giros rápidos en U sin que la serpiente se muerda por pulsar dos teclas en el mismo paso. **No:** solo flechas. **No:** aplicar solo la última tecla del paso.
- **Sí:** el temporizador de pasos acumula `deltaSeconds`, como pide la guía para juegos de rejilla. **No:** contar cuadros, que haría la velocidad dependiente de la frecuencia de la pantalla.
- **Sí:** entrar en la celda que deja la cola no es choque cuando la serpiente no crece. Es el comportamiento habitual del género y evita muertes que el jugador no ve venir.
- **Sí:** llenar el tablero termina la partida con victoria. Es el único final posible sin choque. **No:** dejar la partida sin fruta.
- **Sí:** tarjeta nueva `fruit-snake` con título FRUIT SNAKE, categoría ARCADE y acento green, al final de `GAMES`. Decisión del usuario. **No:** convertir la simulación `serpentine`, cuyo texto habla de mecánicas que este juego no tiene. **No:** VIPER ni ORCHARD RUN.
- **Sí:** estilo plano sobre negro, como ASTEROIDS y WALL BREAKER. Decisión del usuario. **No:** neón.
- **Sí:** fuera de alcance sonido, táctil, mando, teclas configurables, alta densidad, tests, frutas especiales, obstáculos y power-ups. Decisión del usuario.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente y `destroy()` en la limpieza de `GameCanvas`, que desengancha `KeyboardInput`. Criterios explícitos. |
| Las flechas desplazan la página o WASD/flechas activan el botón enfocado | Las 8 teclas en `GAME_KEY_CODES` con `preventDefault`; se verifica con PAUSA enfocado. |
| Al reanudar o volver a la pestaña la serpiente salta varias celdas | Marca de tiempo reiniciada en pausa y tope de 0,05 s: como mucho un paso por cuadro a la velocidad máxima. |
| Dos giros en el mismo paso hacen que la serpiente se muerda (derecha → arriba → izquierda) | Cola de 2 giros; cada uno se valida contra el último pedido y se aplica en su propio paso. |
| La fruta aparece sobre la serpiente | `spawnFruit` elige solo entre celdas libres; criterio explícito. |
| Buscar celdas libres recorre 1.200 celdas por fruta | Solo ocurre al comer, no en cada cuadro; el coste es despreciable. |
| Puntuación por encima de 9.999.999 | Imposible: el máximo con el tablero lleno es 1.438.800. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |

---

## Qué **no** entra en esta spec

- `fruits.png`, su atlas y cualquier imagen externa.
- Frutas especiales, obstáculos, power-ups, bordes que se atraviesan y más de una vida.
- Sonido y restyle neón.
- Controles táctiles, mando, teclas configurables y nitidez en alta densidad.
- Cambios en `GameSnapshot`, `GamePlayer`, `GameCanvas` o el leaderboard.
- Convertir `serpentine`.
- Pruebas automatizadas y azar determinista.

Cada uno de estos puntos, si se aborda, va en su propia spec.
