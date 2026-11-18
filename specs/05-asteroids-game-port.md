# SPEC 05 — Port del juego Asteroids a TypeScript

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 04
> **Date:** 2026-11-17
> **Objective:** Portar el juego de asteroides de `references/started-games/02-asteroids` a un motor en TypeScript sobre canvas y conectarlo al Reproductor de `/games/asteroids/play`, con su propia tarjeta en el catálogo, reemplazando la simulación de puntaje por una partida real.

---

## Por qué existe esta spec

Hoy `GamePlayer` es una simulación: el puntaje sube solo con un `setInterval` y el "juego" es un fondo decorativo (SPEC 01). El juego de asteroides ya existe como un archivo JavaScript suelto (`game.js`, ~510 líneas, globals, un canvas propio en `index.html`). Esta spec lo convierte en el **primer juego real de la plataforma** y deja el patrón (motor TypeScript sin React + registro por id + componente canvas) con el que se integrarán después `03-tetris` y `04-arkanoid`. El catálogo ya tiene una tarjeta `rocks` (ROCKS) que sigue siendo una simulación; el juego real entra como una tarjeta nueva, `asteroids` (ASTEROIDS), sin tocar la de ROCKS.

---

## Alcance

**Dentro:**

- Motor del juego en `src/lib/games/asteroids/`, en TypeScript estricto, sin globals y sin dependencias de React: constantes, utilidades matemáticas, entrada de teclado, entidades (`Ship`, `Asteroid`, `Bullet`, `Particle`, `PowerUp`) y la clase `AsteroidsEngine`.
- Contrato común de motores en `src/lib/games/game-engine.ts` y registro `gameId → motor` en `src/lib/games/engine-registry.ts`, con una sola entrada hoy: `asteroids`.
- Componente cliente `src/components/game-canvas.tsx`: crea el `<canvas>` 800×600, monta el motor con `useEffect` y lo destruye al desmontar (cancela `requestAnimationFrame` y quita los listeners).
- Cambios en `src/components/game-player.tsx`:
  - Si el `gameId` tiene motor en el registro, se muestra el canvas en lugar de la arena decorativa y se elimina el `setInterval` de puntaje para ese juego; si no tiene motor, el comportamiento simulado actual queda intacto.
  - Jugador, Puntuación, Vidas y Nivel del HUD pasan a mostrar los datos reales del motor.
  - PAUSA/REANUDAR, `P` y `Esc` pausan y reanudan el motor; la pantalla "EN PAUSA" existente se conserva.
  - FIN termina la partida con la puntuación actual; perder las 3 vidas abre el mismo modal "FIN DEL JUEGO" con la puntuación real.
  - "JUGAR DE NUEVO" reinicia el motor desde cero.
  - "GUARDAR PUNTUACIÓN" sigue usando `saveScore` (localStorage), sin cambios.
- Jugabilidad portada tal cual está en `game.js`: nave con rotación, empuje e inercia; disparo con cooldown; asteroides de tamaño 3 → 2 → 1 que se dividen; partículas de explosión; power-up de triple disparo; niveles; 3 vidas; reaparición con invencibilidad parpadeante; envoltura toroidal; colisiones circulares.
- Controles: `ArrowLeft`/`ArrowRight` rotan, `ArrowUp` impulsa, `Space` dispara (un disparo por pulsación). Mientras la partida está en curso, esas teclas no desplazan la página.
- Canvas con resolución lógica fija de 800×600, escalado por CSS al ancho disponible dentro del marco CRT existente (`.crt-screen` ya es 4:3), conservando el estilo vectorial blanco sobre negro del original.
- El indicador del triple disparo ("3x 4.2s") se sigue dibujando en el canvas, porque pertenece al juego y no al HUD de la plataforma.
- Nueva tarjeta `asteroids` (ASTEROIDS) en `GAMES` de `src/lib/games.ts`, con su portada `cover-asteroids` en `globals.css`. La tarjeta existente `rocks` (ROCKS) no se toca y sigue siendo simulación.
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas (por ejemplo `remainingLifetimeSeconds` en lugar de `ttl`).

**Fuera de alcance (para otras specs):**

- OVNIs u otras mecánicas que no existen en `game.js`.
- Reestilizar el juego con los colores neón de la plataforma.
- Controles táctiles o para móvil, mando de juego, teclas configurables.
- Sonido y música.
- Pausa automática al perder el foco de la pestaña.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`): el canvas conserva su resolución interna de 800×600.
- Guardar puntuaciones en Supabase, Salón de la Fama y datos reales de `bestScore`/`playsLabel` (los de `asteroids` son de muestra).
- Portar `03-tetris` y `04-arkanoid`, o sustituir la simulación de los otros 8 juegos.
- Pruebas automatizadas.
- Semilla determinista del azar: el juego usa `Math.random()` como el original.

---

## Modelo de datos

```ts
// src/lib/games/game-engine.ts — contract shared by every real game
export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
};

export type GameEngineCallbacks = {
  // Called only when score, lives or level change, never once per frame.
  onSnapshotChange: (snapshot: GameSnapshot) => void;
  // Called once when the last life is lost or when endGame() is invoked.
  onGameOver: (finalScore: number) => void;
};

export type GameEngine = {
  start: () => void;
  setPaused: (isPaused: boolean) => void;
  restart: () => void;
  endGame: () => void;
  destroy: () => void; // cancels the animation frame and removes every listener
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameEngineCallbacks,
) => GameEngine;

// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
};
```

```ts
// src/lib/games/asteroids/constants.ts — values ported unchanged from game.js
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export type AsteroidSize = 1 | 2 | 3; // 1 = small, 3 = large

export const ASTEROID_RADIUS_BY_SIZE = { 1: 16, 2: 30, 3: 50 } as const;
export const ASTEROID_SPEED_BY_SIZE = { 1: 85, 2: 55, 3: 32 } as const;
export const ASTEROID_POINTS_BY_SIZE = { 1: 100, 2: 50, 3: 20 } as const;

export const INITIAL_LIVES = 3;
export const INITIAL_ASTEROID_COUNT = 4;       // level 1; later levels spawn 3 + level
export const ASTEROID_SAFE_DISTANCE = 130;     // from the screen center
export const MAXIMUM_FRAME_SECONDS = 0.05;     // dt cap against tab-blur spikes
export const RESPAWN_DELAY_SECONDS = 2;
export const SPAWN_INVINCIBILITY_SECONDS = 3;
export const SHIP_COLLISION_RADIUS_FACTOR = 0.82; // asteroid radius fudge for feel
export const POWER_UP_DROP_CHANCE = 0.15;
export const POWER_UP_GUARANTEED_AFTER_KILLS = 5;
export const POWER_UP_DURATION_SECONDS = 5;
export const POWER_UP_LIFETIME_SECONDS = 12;
export const TRIPLE_SHOT_SPREAD_RADIANS = 0.18;
```

```ts
// src/lib/games/asteroids/asteroids-engine.ts (internal state, not exported)
type AsteroidsPhase = "playing" | "respawning" | "game-over"; // "respawning" was 'dead' in game.js
```

Convenciones:

- Coordenadas con origen arriba a la izquierda; posiciones en píxeles lógicos, velocidades en px/s, tiempos en segundos.
- Las entidades exponen `update(deltaSeconds)` y `draw(context)` y una bandera `isDead` para retirarlas, igual que el original; la nave recibe el estado de entrada en `update`.
- El motor no dibuja puntuación, vidas ni nivel (los muestra el HUD de React) ni el cartel GAME OVER (lo muestra el modal); solo dibuja el juego y el indicador del triple disparo.
- `KeyboardInput` usa `KeyboardEvent.code`; expone `isHeld(code)` y `consumePress(code)` (pulsación de un solo cuadro, como `pressed()` del original).
- El Reproductor es el único dueño del estado de pausa; `P`/`Esc` los captura `GamePlayer`, no el motor.
- `GameSnapshot` es lo único que cruza del motor a React; no se exponen las entidades.

---

## Plan de implementación

Antes de empezar: releer en `node_modules/next/dist/docs/01-app/` las guías de componentes cliente y de Cache Components, y confirmar que montar un canvas en `useEffect` dentro de una página con `cacheComponents: true` no requiere nada especial (la página `/games/[id]/play` ya usa `generateStaticParams` y renderiza `GamePlayer`, que es un componente cliente).

1. **Contrato y utilidades.** Crear `src/lib/games/game-engine.ts` (tipos de arriba), `src/lib/games/asteroids/constants.ts` y `src/lib/games/asteroids/math.ts` (`wrapCoordinate`, `distanceBetween`, `randomBetween`, `randomIntegerBetween`). Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
2. **Entrada de teclado.** Crear `src/lib/games/asteroids/keyboard-input.ts` con la clase `KeyboardInput` (`attach`, `detach`, `isHeld`, `consumePress`). Llama a `preventDefault` en `keydown` y `keyup` para las flechas y `Space` mientras está activa, salvo que el foco esté en un `input` o `textarea`. Verificación: `npx tsc --noEmit` pasa.
3. **Entidades.** Crear `bullet.ts`, `asteroid.ts`, `particle.ts`, `power-up.ts` y `ship.ts` en `src/lib/games/asteroids/`, portando la lógica y el dibujo de `game.js` con nombres descriptivos. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor.** Crear `asteroids-engine.ts` con `AsteroidsEngine` (estado de partida, `update`, `draw`, bucle con `requestAnimationFrame`, spawn de asteroides y power-ups, colisiones, niveles, fases `playing`/`respawning`/`game-over`) y la función `createAsteroidsEngine` que cumple `GameEngineFactory`. Emite `onSnapshotChange` solo cuando cambian los valores y `onGameOver` una sola vez por partida. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Registro y componente canvas.** Crear `src/lib/games/engine-registry.ts` y `src/components/game-canvas.tsx` (canvas 800×600, `useEffect` que crea el motor con la fábrica recibida y devuelve `destroy` en la limpieza). Añadir en `globals.css` la clase del canvas (`width: 100%`, `height: 100%`, `display: block`) dentro de `.crt-screen`. Todavía no se usa en el Reproductor. Verificación: `npm run build` pasa y ninguna pantalla cambia.
6. **Conectar el Reproductor.** En `game-player.tsx`: consultar `GAME_ENGINE_FACTORIES[gameId]`; con motor, renderizar `GameCanvas`, alimentar el HUD con el `GameSnapshot`, pasar `isPaused` al motor, llamar a `endGame()` desde FIN, abrir el modal desde `onGameOver`, reiniciar con `restart()` en "JUGAR DE NUEVO" y añadir `P`/`Esc` como pausa (solo si no hay modal abierto). Sin motor, el código simulado actual no cambia. Verificación: en `/games/asteroids/play` se juega de verdad y en `/games/rocks/play` y `/games/block-fall/play` sigue la simulación.
7. **Tarjeta del catálogo.** Añadir `asteroids` a `GAMES` en `src/lib/games.ts` (categoría `SHOOTER`) y la clase `cover-asteroids` en `globals.css`; `rocks` queda intacto. Verificación: `/games` muestra la tarjeta ASTEROIDS junto a ROCKS, `/games/asteroids` carga y `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `/games/asteroids/play` muestra un canvas con la nave en el centro y 4 asteroides grandes que no aparecen a menos de 130 px del centro.
- [ ] `ArrowLeft`/`ArrowRight` rotan la nave, `ArrowUp` la impulsa con inercia y `Space` dispara una bala por pulsación (mantenerla pulsada no dispara en ráfaga); la página no se desplaza al usar flechas o `Space`.
- [ ] Destruir un asteroide grande suma 20 puntos y genera 2 medianos; uno mediano suma 50 y genera 2 pequeños; uno pequeño suma 100 y no se divide.
- [ ] Las posiciones de nave, asteroides y balas envuelven por el borde opuesto de la pantalla; las balas desaparecen tras 1,1 s.
- [ ] Chocar con un asteroide resta una vida, muestra la explosión y la nave reaparece a los 2 s en el centro, parpadeando e invulnerable durante 3 s.
- [ ] Al destruir todos los asteroides sube el nivel en 1 y aparecen `3 + nivel` asteroides nuevos.
- [ ] El power-up de triple disparo aparece con 15 % de probabilidad al destruir un asteroide y, a más tardar, tras 5 destrucciones sin que haya aparecido; solo hay uno por nivel; desaparece a los 12 s; al recogerlo, durante 5 s cada disparo lanza 3 balas y el canvas muestra el contador "3x".
- [ ] El HUD del Reproductor muestra el username (o `INVITADO`), la puntuación, las vidas (♥ restantes) y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego (nada se mueve y el tiempo de invencibilidad no avanza) y muestran "EN PAUSA"; REANUDAR o repetir la tecla continúa sin saltos bruscos.
- [ ] Perder la tercera vida abre el modal "FIN DEL JUEGO" con la puntuación real; el motor deja de procesar teclas y se puede escribir un nombre con espacios en el `input` del modal.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "GUARDAR PUNTUACIÓN" escribe `{ gameId: "asteroids", playerName, score }` en `localStorage` (`arcade-vault:scores:v1`).
- [ ] "JUGAR DE NUEVO" reinicia puntuación 0, 3 vidas, nivel 1, 4 asteroides y pausa desactivada, sin duplicar el bucle de animación (la velocidad del juego es la misma que en la primera partida).
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor: no quedan listeners ni `requestAnimationFrame` activos (verificable al volver a entrar y comprobar que solo hay un bucle).
- [ ] Al salir de `/games/asteroids/play` y volver con el botón Atrás del navegador (Next conserva la página oculta), la partida es nueva: HUD en 0 / 3 vidas / nivel 01, sin modal ni pausa heredados y con un solo motor corriendo.
- [ ] El canvas se escala al ancho del marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (relación 4:3).
- [ ] `/games/block-fall/play` y los demás juegos sin motor mantienen la simulación actual, sin cambios visuales.
- [ ] `/games` muestra una tarjeta ASTEROIDS nueva y la tarjeta ROCKS conserva su texto original (incluida la mención a los OVNIs) y su simulación en `/games/rocks/play`.
- [ ] Recargar `/games/asteroids/play` con y sin sesión no produce advertencias de hidratación en la consola, y en desarrollo (React Strict Mode) solo corre un motor a la vez.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor en canvas con el HUD de React. Decisión del usuario; el Nav, el modal y el guardado de puntuaciones ya existen y se reutilizan. **No:** dibujar HUD y GAME OVER dentro del canvas, que duplicaría la UI e impediría guardar la puntuación tras perder.
- **Sí:** registro `gameId → motor` (`engine-registry.ts`). Decisión del usuario; los siguientes juegos solo añaden una entrada. **No:** un `if (gameId === "asteroids")` dentro de `GamePlayer`, que obliga a reabrir el componente con cada juego.
- **Sí:** port fiel de la jugabilidad de `game.js`. Decisión del usuario. **No:** OVNIs: es mecánica nueva que el original no tiene y merece su propia spec; la descripción de ASTEROIDS no los menciona.
- **Sí:** 800×600 lógico con escalado CSS y estilo vectorial blanco. Decisión del usuario; mantiene la física y el "feel" intactos, y `.crt-screen` ya es 4:3. **No:** reestilizar en neón ni un canvas fijo sin escalar (se desborda en móvil).
- **Sí:** controles de teclado originales más `P`/`Esc` para pausar, sin controles táctiles. Decisión del usuario. **No:** táctil: es una feature propia.
- **Sí:** el modal "FIN DEL JUEGO" existente al perder las 3 vidas. Decisión del usuario. **No:** GAME OVER en el canvas con reinicio por `Space`, que dejaría el guardado de puntuación inalcanzable.
- **Sí:** módulos TypeScript separados en `src/lib/games/asteroids/` y una clase `AsteroidsEngine` sin React. Decisión del usuario; sirve de patrón para `tetris` y `arkanoid`. **No:** un único `asteroids.ts` portado casi literal, que hereda globals y es difícil de reutilizar.
- **Sí:** el Reproductor es el único dueño del estado de pausa y captura `P`/`Esc`; el motor solo recibe `setPaused`. Evita dos fuentes de verdad y estados desincronizados. **No:** que el motor gestione su propia pausa y avise a React.
- **Sí:** el motor solo emite `onSnapshotChange` cuando cambian puntuación, vidas o nivel. Evita un `setState` por cuadro (60/s). **No:** pasar el estado completo de las entidades a React.
- **Sí:** el nivel que muestra el HUD es el del motor, no `1 + floor(score / 2500)` de la simulación. **No:** mantener la fórmula de la simulación en los juegos con motor real.
- **Sí:** el indicador "3x" del triple disparo se queda en el canvas. **No:** añadirlo al `GameSnapshot` y al HUD: es específico de este juego y el contrato debe seguir siendo común.
- **Sí:** `KeyboardInput` hace `preventDefault` en `keydown` y `keyup` y se desactiva al terminar la partida. Evita el scroll de la página, que `Space` en un botón enfocado lo "haga clic", y que el `input` del modal pierda los espacios. **No:** escuchar teclas globalmente sin condiciones.
- **Sí:** el juego es una tarjeta nueva `asteroids` (título ASTEROIDS), no el `rocks` existente. Corrección del usuario durante la implementación: `rocks` queda como estaba (con su simulación y su descripción) y `asteroids` es un juego aparte. **No:** reutilizar el id `rocks`.
- **Sí:** `bestScore` y `playsLabel` de `asteroids` son datos de muestra (`0` y `NUEVO`) hasta la spec de puntuaciones reales.
- **Sí:** `Math.random()` sin semilla, igual que el original. **No:** azar determinista: no hay pruebas automatizadas que lo necesiten.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| React Strict Mode monta el efecto dos veces en desarrollo y quedan dos bucles o listeners duplicados | `GameCanvas` devuelve `destroy()` en la limpieza del efecto; criterio de aceptación que verifica un solo motor activo. |
| Las flechas y `Space` desplazan la página o activan el botón enfocado (PAUSA) | `KeyboardInput` hace `preventDefault` en `keydown` y `keyup` mientras la partida está activa; se verifica manualmente con PAUSA enfocado. |
| Con Cache Components, Next conserva la página oculta al navegar: al volver, el motor se recrea pero el modal o la pausa anteriores seguirían abiertos | `GamePlayer` restablece su estado de UI en la limpieza del efecto cuando el juego tiene motor; criterio de aceptación explícito (detectado al verificar en el navegador). |
| `Space` bloqueado impide escribir el nombre en el modal | El motor se desactiva al llegar a `game-over` y `KeyboardInput` ignora los eventos con foco en `input`/`textarea`; criterio de aceptación explícito. |
| Una pestaña en segundo plano acumula un `deltaSeconds` enorme y la nave "teletransporta" | Se conserva el tope `MAXIMUM_FRAME_SECONDS = 0.05` del original. |
| Al reanudar tras pausar el primer `deltaSeconds` incluye todo el tiempo en pausa | Al reanudar se reinicia la marca de tiempo del bucle; el criterio de pausa verifica que no hay saltos. |
| El `setState` desde callbacks del motor dispara advertencias de las reglas de lint de hooks de React 19 | Los callbacks se pasan al crear el motor en el efecto y actualizan el estado desde el callback, no durante el render; `npm run lint` lo verifica. |
| El canvas escalado por CSS se ve borroso en pantallas de alta densidad | Aceptado: fuera de alcance; el trazo vectorial blanco tolera bien el escalado. |
| `cacheComponents` o el prerenderizado de `/games/[id]/play` ejecutan código del canvas en el servidor | Todo acceso a `canvas`, `window` y `requestAnimationFrame` ocurre dentro de `useEffect`; el render inicial solo emite el elemento `<canvas>` vacío. |

---

## Qué **no** entra en esta spec

- OVNIs, nuevas mecánicas o cambios de balance respecto a `game.js`.
- Reestilizado neón del juego.
- Controles táctiles, sonido o teclas configurables.
- Pausa automática al perder el foco y soporte de alta densidad de píxeles.
- Puntuaciones en Supabase, Salón de la Fama y datos reales de `bestScore`/`playsLabel`.
- Portar `tetris` y `arkanoid` o reemplazar la simulación de los otros juegos.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
