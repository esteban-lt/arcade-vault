<!--
Plantilla de spec para /add-game. Reemplazar cada <…>. Bloques marcados:
  [SHARED]   solo si src/lib/games/shared/ no existe todavía (primer juego nuevo).
  [PORT]     solo en modo con referencia.
  [SCRATCH]  solo en modo sin referencia.
  [NEW]      tarjeta nueva.  [CONVERT] convierte una tarjeta simulada existente.
Borrar los marcadores y los bloques que no apliquen, y este comentario.
-->

# SPEC <NN> — <Título: "Juego <TITLE>" (SCRATCH) o "Port del juego <nombre> a TypeScript" (PORT)>

> **Status:** Borrador
> **Depends on:** SPEC 05, SPEC 06
> **Date:** <fecha del contexto de sesión>
> **Objective:** <Una frase: crear/portar el juego <TITLE> como motor TypeScript sobre canvas, conectado al Reproductor de `/games/<game-id>/play`, con su tarjeta en el catálogo y sus puntuaciones en el leaderboard.>

---

## Por qué existe esta spec

<Contexto: qué juego es y por qué se añade. Mencionar que sigue el patrón de SPEC 05 (motor sin React + registro + `GameCanvas`) y SPEC 06 (tabla `games` con `accepts_scores`).>
<[PORT] El juego existe como `references/started-games/<carpeta>/` (<archivos, ~N líneas, globals…>).>
<[SCRATCH] No hay código de referencia: esta spec fija la jugabilidad completa y sus valores iniciales.>
<[SHARED] Es el segundo juego real: extrae a `src/lib/games/shared/` el código que hoy solo vive en `asteroids/` (tamaño del canvas, `KeyboardInput`, utilidades matemáticas).>
<[CONVERT] Sustituye la simulación de la tarjeta `<id>` existente.>

---

## Alcance

**Dentro:**

- [SHARED] `src/lib/games/shared/`: `canvas.ts` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MAXIMUM_FRAME_SECONDS`), `keyboard-input.ts` (recibe las teclas del juego por constructor) y `math.ts`, movidos desde `asteroids/`; Asteroids y `GameCanvas` los importan de ahí sin cambiar su comportamiento.
- Motor en `src/lib/games/<game-id>/`, en TypeScript estricto, sin globals y sin React: constantes, entidades (<lista>) y la clase `<GameName>Engine` con la fábrica `create<GameName>Engine` que cumple `GameEngineFactory`.
- Entrada `"<game-id>"` en `GAME_ENGINE_FACTORIES` (`src/lib/games/engine-registry.ts`). `GamePlayer` y `GameCanvas` no cambian.
- Jugabilidad: <mecánicas, una por línea, con valores>.
- Controles (`KeyboardEvent.code`): <tecla → acción; marcar cuáles son mantenidas y cuáles de una pulsación>. Mientras la partida está en curso, esas teclas no desplazan la página. `P`/`Esc` siguen siendo la pausa del Reproductor.
- Puntuación, vidas y nivel enviados al HUD con `GameSnapshot`: <reglas exactas>.
- Canvas lógico compartido de 800×600 escalado por CSS dentro del marco CRT; <cómo se encaja el tablero; estilo visual>.
- Indicadores propios del juego dibujados en el canvas: <p. ej. "siguiente pieza", o ninguno>. El motor no dibuja puntuación, vidas, nivel ni GAME OVER.
- [NEW] Nueva tarjeta `<game-id>` (<TITLE>) en `GAMES` con su portada `cover-<game-id>` en `globals.css`.
- [CONVERT] La tarjeta `<game-id>` actualiza su texto para describir el juego real; su portada <se conserva / se redibuja>.
- Migración en Supabase que [NEW] inserta `<game-id>` en `public.games` / [CONVERT] activa `accepts_scores` en `<game-id>`, para que sus puntuaciones se guarden y aparezcan en el ranking, el Salón de la Fama y las estadísticas.
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- <[PORT] Mecánicas que no existen en el original. / [SCRATCH] Extras descartados en las preguntas.>
- Sonido y música.
- Controles táctiles, mando de juego, teclas configurables.
- Nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Cambios en el contrato `GameSnapshot`, en `GamePlayer` o en el leaderboard.
- Pruebas automatizadas y semilla determinista del azar.
- <otros>

---

## Modelo de datos

```ts
// src/lib/games/<game-id>/constants.ts
// [PORT] Values ported unchanged from references/started-games/<carpeta>/<archivo>.
export const GAME_KEY_CODES = [<"ArrowLeft", …>] as const;
export const INITIAL_LIVES = <n>;
<una constante por valor de balance, con unidades en el nombre y su valor>
```

```ts
// src/lib/games/<game-id>/<game-id>-engine.ts (internal state, not exported)
type <GameName>Phase = <"playing" | … | "game-over">;
```

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "<game-id>": create<GameName>Engine,
};
```

```ts
// src/lib/games.ts → GAMES
{
  id: "<game-id>",
  title: "<TITLE>",
  shortDescription: "<…>",
  longDescription: "<…>",
  category: "<CATEGORY>",
  coverClassName: "cover-<game-id>",
  accentColor: "<color>",
}
```

```sql
-- supabase/migrations/<timestamp>_add_<game_id>_game.sql            [NEW]
insert into public.games (id, title, accepts_scores) values ('<game-id>', '<TITLE>', true);
-- supabase/migrations/<timestamp>_enable_scores_for_<game_id>.sql   [CONVERT]
update public.games set accepts_scores = true where id = '<game-id>';
```

Convenciones:

- Coordenadas con origen arriba a la izquierda; posiciones en píxeles lógicos, velocidades en px/s, tiempos en segundos (`deltaSeconds` con tope `MAXIMUM_FRAME_SECONDS`).
- <Entidades con `update(deltaSeconds)` / `draw(context)` / `isDead`, o la estructura del tablero si es un juego de rejilla (los ticks acumulan `deltaSeconds`).>
- `GameSnapshot` es lo único que cruza del motor a React; el Reproductor es el único dueño de la pausa.
- <Mapeo explícito: `lives` = …, `level` = …>.

---

## Plan de implementación

Antes de empezar: releer `.claude/skills/add-game/integration-guide.md` y las guías de `node_modules/next/dist/docs/01-app/` sobre componentes cliente y Cache Components; cargar las skills `supabase` y `supabase-postgres-best-practices` antes del paso de migración.

1. **[SHARED] Código compartido.** Crear `src/lib/games/shared/` (`canvas.ts`, `keyboard-input.ts` con las teclas por constructor, `math.ts`), mover desde `asteroids/` y actualizar sus imports y el de `game-canvas.tsx`. Verificación: `npx tsc --noEmit`, `npm run lint` y `npm run build` pasan y `/games/asteroids/play` se juega igual que antes.
2. **Constantes y utilidades.** Crear `src/lib/games/<game-id>/constants.ts` <y utilidades propias>. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Entidades.** Crear <archivos> en `src/lib/games/<game-id>/` <[PORT] portando lógica y dibujo del original con nombres descriptivos>. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Motor.** Crear `<game-id>-engine.ts` con `<GameName>Engine` (estado, `update`, `draw`, bucle con `requestAnimationFrame`, fases, colisiones/reglas, niveles) y `create<GameName>Engine`, siguiendo las reglas de ciclo de vida de la guía. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
5. **Tarjeta del catálogo.** [NEW] Añadir `<game-id>` a `GAMES` y `.cover-<game-id>` a `globals.css` (hasta el paso 6 su Reproductor es la simulación). / [CONVERT] Actualizar los textos de `<game-id>`. Verificación: `/games` muestra la tarjeta, `/games/<game-id>` carga y `npm run build` pasa.
6. **Registro.** Añadir la entrada en `engine-registry.ts`. Verificación: `/games/<game-id>/play` se juega de verdad; `/games/asteroids/play` y `/games/block-fall/play` no cambian.
7. **Leaderboard.** Aplicar la migración con `apply_migration`, guardar el mismo SQL en `supabase/migrations/` y revisar `get_advisors`. Verificación: `public.games` tiene `<game-id>` con `accepts_scores = true`, los ids coinciden con `GAMES` y una partida guardada con sesión aparece en `/games/<game-id>`.

<!-- Cada paso debe poder commitearse solo (spec-NN-step-MM) y dejar la app funcionando. Si las entidades o el motor superan ~50 líneas de lógica, dividir en subpasos. No añadir un paso final de "probar todo": eso son los criterios de aceptación. -->
<!-- Numeración: sin [SHARED], empezar en "1. Constantes y utilidades" y renumerar. -->




---

## Criterios de aceptación

Propios del juego:

- [ ] `/games/<game-id>/play` muestra <estado inicial concreto>.
- [ ] <Una línea por mecánica, con números: puntos por acción, velocidades, tiempos, condición de pérdida de vida, subida de nivel…>
- [ ] <Indicadores propios del canvas, si hay.>

Integración (comunes a todos los juegos reales):

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] Las teclas del juego funcionan como se describe y la página no se desplaza al usarlas, ni siquiera con el botón PAUSA enfocado.
- [ ] El HUD muestra el username (o `INVITADO`), la puntuación, las vidas y el nivel reales, y se actualizan al cambiar.
- [ ] PAUSA, `P` y `Esc` detienen por completo el juego y muestran "EN PAUSA"; al reanudar no hay saltos.
- [ ] <Condición de derrota> abre el modal "FIN DEL JUEGO" con la puntuación real; el motor deja de procesar teclas.
- [ ] El botón FIN abre el mismo modal con la puntuación actual.
- [ ] "JUGAR DE NUEVO" reinicia puntuación 0, <vidas iniciales>, nivel 1 y el estado inicial del juego, sin duplicar el bucle (misma velocidad que la primera partida).
- [ ] Salir con SALIR, VOLVER AL VAULT o cambiando de ruta detiene el motor; al volver con Atrás la partida es nueva, sin modal ni pausa heredados y con un solo motor.
- [ ] En desarrollo (React Strict Mode) solo corre un motor a la vez y recargar con y sin sesión no produce advertencias de hidratación.
- [ ] El canvas se escala al marco CRT en escritorio y en ≤ 480 px sin barras de desplazamiento horizontal ni deformarse (4:3).
- [ ] Con sesión y puntuación > 0, "GUARDAR PUNTUACIÓN" crea una fila en `scores` con `game_id = '<game-id>'` y la marca aparece en `/games/<game-id>` y `/hall-of-fame?game=<game-id>`.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN".
- [ ] `public.games` contiene `<game-id>` con `accepts_scores = true`, sus ids coinciden con `GAMES`, `supabase/migrations/` contiene el SQL aplicado y `get_advisors` no reporta problemas nuevos.
- [ ] `/games/asteroids/play` funciona igual que antes y los juegos sin motor mantienen la simulación.
- [ ] Ningún archivo nuevo usa `any` ni variables globales de módulo mutables.

---

## Decisiones tomadas y descartadas

- **Sí:** motor TypeScript sin React registrado en `engine-registry.ts`, con el HUD, la pausa y el modal del Reproductor (patrón de SPEC 05). **No:** HUD o GAME OVER dentro del canvas.
- **Sí:** canvas lógico compartido de 800×600 (4:3, como `.crt-screen`) <y cómo se encaja el tablero>. **No:** un tamaño de canvas por juego.
- **Sí:** puntuaciones en el leaderboard con `accepts_scores = true` (SPEC 06). **No:** cambiar `saveScoreAction` ni las vistas: la fila nueva basta.
- [SHARED] **Sí:** extraer a `shared/` el código de Asteroids que necesita cualquier juego, como primer paso. **No:** copiar `keyboard-input.ts` y `math.ts` en cada juego.
- [PORT] **Sí:** port fiel de la jugabilidad del original. **No:** <mecánicas nuevas>.
- [SCRATCH] **Sí:** valores iniciales de balance fijados en esta spec. **No:** dejarlos para la implementación.
- <Mapeo de vidas/nivel al `GameSnapshot` y por qué.>
- <[NEW]/[CONVERT] Tarjeta nueva o conversión, y por qué.>
- <Cada decisión de las preguntas, marcada "Decisión del usuario" cuando lo sea.>

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| [SHARED] Mover el código compartido cambia el comportamiento de Asteroids | Paso 1 aislado, sin cambios de lógica; se verifica jugando Asteroids antes de seguir. |
| React Strict Mode o la página oculta de Next dejan dos bucles o listeners | `start()` idempotente, `destroy()` en la limpieza de `GameCanvas`; criterios explícitos. |
| Las teclas del juego desplazan la página o activan el botón enfocado | Todas en `GAME_KEY_CODES` con `preventDefault`; verificación con PAUSA enfocado. |
| Al reanudar o volver a la pestaña el primer `deltaSeconds` es enorme | Marca de tiempo reiniciada en pausa y tope `MAXIMUM_FRAME_SECONDS`. |
| `GAMES` y `public.games` se desincronizan | Migración en el mismo plan y criterio que compara ids. |
| <Una puntuación que puede superar 9.999.999 / riesgos propios del juego> | <…> |

---

## Qué **no** entra en esta spec

- <Resumen de "Fuera de alcance">.

Cada uno de estos puntos, si se aborda, va en su propia spec.
