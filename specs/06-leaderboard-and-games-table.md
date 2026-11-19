# SPEC 06 — Leaderboard real y tabla de juegos en Supabase

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 05
> **Date:** 2026-11-18
> **Objective:** Crear en Supabase las tablas `games` y `scores` para que los usuarios con sesión guarden sus puntuaciones de los juegos con motor real y que el ranking del detalle, el Salón de la Fama y las estadísticas de las tarjetas muestren datos reales.

---

## Por qué existe esta spec

Hoy las puntuaciones se guardan en localStorage (`src/lib/score-storage.ts`), sin dueño ni ranking compartido. El ranking de `/games/[id]`, el Salón de la Fama y los campos `bestScore`/`playsLabel` de `GAMES` son datos simulados (`generateSeededScores` en `src/lib/scores.ts`). SPEC 04 dejó la autenticación y `profiles` listas, y SPEC 05 dejó el primer juego real (`asteroids`). Esta spec conecta ambas cosas: un leaderboard real en la base de datos. El catálogo de juegos sigue viviendo en el código; la tabla `games` es solo la referencia que necesitan las puntuaciones.

---

## Alcance

**Dentro:**

- Base de datos (migración aplicada con el MCP de Supabase y guardada en `supabase/migrations/`):
  - Tabla `public.games` con `id`, `title` y `accepts_scores`, sembrada en la misma migración con los 9 juegos de `GAMES`; solo `asteroids` tiene `accepts_scores = true`.
  - Tabla `public.scores`: una fila por puntuación guardada, ligada a `games` y a `profiles`.
  - Vista `public.game_leaderboard`: la mejor marca de cada jugador por juego, con su username y su posición.
  - Vista `public.game_stats`: mejor puntuación global y número de puntuaciones guardadas por juego.
  - RLS: lectura pública de `games` y `scores`; `insert` en `scores` solo para `authenticated`, con `user_id = auth.uid()` y en un juego con `accepts_scores = true`; sin `update` ni `delete` públicos.
- Server Action `saveScoreAction` en `src/app/games/[id]/play/actions.ts`: valida sesión, formato del `gameId` y puntuación (entero de 1 a `MAXIMUM_SCORE`) e inserta con el cliente de servidor.
- Lecturas del lado del servidor en `src/lib/leaderboard.ts`: ranking de un juego, estadísticas de todos los juegos y mejor marca y posición de un usuario en un juego. Se leen en cada petición (sin caché), dentro de `Suspense`.
- Modal "FIN DEL JUEGO" del Reproductor (`src/components/game-player.tsx`):
  - Se elimina el campo de nombre libre; la puntuación se guarda con el username del perfil.
  - Con sesión y juego con motor real: botón "GUARDAR PUNTUACIÓN" con estados normal → guardando (botón deshabilitado) → guardada ("▸ PUNTUACIÓN GUARDADA_") o error (mensaje visible y botón para reintentar).
  - Sin sesión y juego con motor real: aviso "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN" con enlace a `/auth`.
  - Juego simulado (sin motor): aviso "PARTIDA DE DEMOSTRACIÓN: NO SE GUARDA" y ningún botón de guardar.
  - Puntuación 0: no se ofrece guardar.
- Ranking "MEJORES PUNTUACIONES" de `/games/[id]`: top 10 real, una fila por jugador.
- Salón de la Fama (`/hall-of-fame`): podio, tabla de 12 y "TU MEJOR MARCA" reales. La pestaña seleccionada pasa a la URL (`/hall-of-fame?game=asteroids`).
- `bestScore` y `playsLabel` reales en las tarjetas de `/games` y en el detalle de juego, leídos de `game_stats`.
- Estados vacíos: ranking y podio muestran "AÚN NO HAY PUNTUACIONES"; "Mejor global" muestra "—" y "Partidas" muestra "NUEVO"; "TU MEJOR MARCA" muestra "SIN MARCA" con un enlace a jugar.
- Eliminar `src/lib/score-storage.ts` y `src/lib/scores.ts`; quitar `bestScore` y `playsLabel` del tipo `Game` y de `GAMES`.
- Tipos escritos a mano (como en SPEC 04).
- Texto de la UI en español; rutas, código, nombres y comentarios en inglés, con nombres descriptivos y sin abreviaturas.

**Fuera de alcance (para otras specs):**

- Mover el catálogo completo (descripciones, categoría, portada, color) a la base de datos; `GAMES` sigue siendo la fuente de la UI, del `proxy.ts` y de `generateStaticParams`.
- Datos reales en la Home (`RECENT_SCORES`, `TOP_PLAYERS_TODAY`, `HOME_STATS`).
- Guardar puntuaciones de invitados o de los 8 juegos simulados.
- Migrar las puntuaciones de localStorage.
- Contar partidas jugadas (iniciadas): "Partidas" cuenta puntuaciones guardadas.
- Anti-trampas real (validar la partida en el servidor, firmas, repeticiones); límite de envíos por minuto.
- Caché de los rankings (`use cache`, `revalidateTag`) y actualización en tiempo real (Realtime).
- Rankings por periodo (diario, semanal), paginación, perfil público de jugador e historial personal.
- Moderar o borrar puntuaciones desde la app.
- Tipos generados con `generate_typescript_types`.
- Pruebas automatizadas.

---

## Modelo de datos

```sql
-- supabase/migrations/<timestamp>_create_games_and_scores.sql
create table public.games (
  id text primary key,
  title text not null,
  accepts_scores boolean not null default false,
  created_at timestamptz not null default now(),
  constraint games_id_format check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

insert into public.games (id, title, accepts_scores) values
  ('brick-buster', 'BRICK BUSTER', false),
  ('block-fall', 'BLOCK FALL', false),
  ('serpentine', 'SERPENTINE', false),
  ('glutton', 'GLUTTON', false),
  ('invaders', 'INVADERS', false),
  ('rocks', 'ROCKS', false),
  ('frog-crossing', 'FROG CROSSING', false),
  ('pixel-duel', 'PIXEL DUEL', false),
  ('asteroids', 'ASTEROIDS', true);

create table public.scores (
  id bigint generated always as identity primary key,
  game_id text not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now(),
  constraint scores_score_range check (score between 1 and 9999999)
);

-- Ranking reads: best scores of a game, earliest first on ties.
create index scores_game_score_idx
  on public.scores (game_id, score desc, created_at);
create index scores_user_id_idx on public.scores (user_id);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games are readable by everyone"
  on public.games for select using (true);

create policy "scores are readable by everyone"
  on public.scores for select using (true);

create policy "users insert their own scores in scoring games"
  on public.scores for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.games
      where games.id = scores.game_id and games.accepts_scores
    )
  );

-- One row per player and game: their best score (earliest one on ties), ranked.
create view public.game_leaderboard
with (security_invoker = true) as
select
  best.game_id,
  best.user_id,
  profiles.username,
  best.score,
  best.created_at as achieved_at,
  row_number() over (
    partition by best.game_id
    order by best.score desc, best.created_at
  ) as rank
from (
  select distinct on (game_id, user_id) game_id, user_id, score, created_at
  from public.scores
  order by game_id, user_id, score desc, created_at
) as best
join public.profiles on profiles.id = best.user_id;

-- Every game appears, with 0 / null when it has no scores yet.
create view public.game_stats
with (security_invoker = true) as
select
  games.id as game_id,
  max(scores.score) as best_score,
  count(scores.id) as score_count
from public.games
left join public.scores on scores.game_id = games.id
group by games.id;

-- Grant only what the policies allow (same pattern as profiles).
revoke all on public.games, public.scores, public.game_leaderboard, public.game_stats
  from anon, authenticated;
grant select on public.games, public.scores, public.game_leaderboard, public.game_stats
  to anon, authenticated;
grant insert (game_id, user_id, score) on public.scores to authenticated;
```

```ts
// src/lib/leaderboard.ts (server-only reads)
export const MAXIMUM_SCORE = 9_999_999;
export const GAME_DETAIL_LEADERBOARD_SIZE = 10;
export const HALL_OF_FAME_TABLE_SIZE = 12;

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  playerName: string; // profile username in uppercase
  score: number;
  achievedAt: string; // ISO timestamp, shown as dd/mm/yyyy
};

export type GameStats = {
  gameId: string;
  bestScore: number | null; // null → "—"
  scoreCount: number;       // 0 → "NUEVO", otherwise 950 / 1.2K / 31.8K
};

// getGameLeaderboard(gameId, limit): Promise<LeaderboardEntry[]>
// getAllGameStats(): Promise<Record<string, GameStats>>
// getPlayerBest(gameId, userId): Promise<LeaderboardEntry | null>
```

```ts
// src/app/games/[id]/play/actions.ts
export type SaveScoreResult =
  | { status: "saved" }
  | { status: "unauthenticated" }
  | { status: "invalid" } // unknown game, game without scores, score out of range
  | { status: "error" };

// saveScoreAction(gameId: string, score: number): Promise<SaveScoreResult>
```

Convenciones:

- La fuente de verdad del catálogo para la UI es `GAMES`; la tabla `games` debe tener exactamente los mismos ids. Añadir un juego al catálogo exige una migración que lo inserte.
- Solo los juegos con `accepts_scores = true` admiten puntuaciones, y la base de datos lo garantiza con RLS. Hoy coincide con los juegos de `engine-registry.ts` (`asteroids`).
- `scores` guarda todas las puntuaciones; el ranking muestra una fila por jugador (su mejor marca). En empate gana la marca más antigua.
- El nombre del ranking es siempre el username actual de `profiles`, en mayúsculas; `scores` no guarda nombres.
- Las vistas usan `security_invoker = true` para respetar el RLS de quien consulta.
- Las lecturas usan el cliente de servidor (`src/lib/supabase/server.ts`) con la clave publicable; ninguna clave secreta entra al código.

---

## Plan de implementación

Antes de empezar: cargar las skills `supabase` y `supabase-postgres-best-practices`; releer en `node_modules/next/dist/docs/01-app/` las guías de Server Actions, `searchParams`, Cache Components y `Suspense` con datos dinámicos (lectura por petición en páginas que usan `generateStaticParams`).

1. **Base de datos.** Aplicar la migración con `apply_migration` y guardar el mismo SQL en `supabase/migrations/`. Revisar `get_advisors` (seguridad y rendimiento). Verificación: `list_tables` muestra `games` (9 filas) y `scores` con RLS activado; los advisors no reportan las vistas como `security definer` ni tablas sin RLS.
2. **Lecturas.** Crear `src/lib/leaderboard.ts` con los tipos, constantes y las tres funciones de lectura, más el formateo de `scoreCount` y de fechas. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
3. **Server Action.** Crear `src/app/games/[id]/play/actions.ts` con `saveScoreAction`: comprobar usuario con `getUser`, validar `gameId` y puntuación, insertar y mapear errores (incluido el rechazo de RLS) a `SaveScoreResult`. Verificación: `npx tsc --noEmit` pasa.
4. **Modal del Reproductor.** En `game-player.tsx`: quitar el input de nombre y `MAXIMUM_PLAYER_NAME_LENGTH`; usar `saveScoreAction` con estados guardando/guardada/error; mostrar los avisos de invitado y de juego simulado; no ofrecer guardar con puntuación 0. "JUGAR DE NUEVO" reinicia también el estado de guardado. Eliminar `src/lib/score-storage.ts`. Verificación: guardar una partida de `asteroids` con sesión crea una fila en `scores`.
5. **Ranking del detalle.** En `src/app/games/[id]/page.tsx`: leer el top 10 y `game_stats` del juego dentro de `Suspense` con un esqueleto de carga; mostrar estados vacíos; mantener `generateStaticParams`. Verificación: `/games/asteroids` muestra la puntuación guardada y `/games/block-fall` muestra "AÚN NO HAY PUNTUACIONES".
6. **Biblioteca.** Quitar `bestScore` y `playsLabel` de `Game` y de `GAMES`; `src/app/games/page.tsx` lee `getAllGameStats()` en `Suspense` y la pasa a `Library` y `GameCard` como prop. Verificación: las tarjetas muestran "—"/"NUEVO" o los valores reales; los filtros y la búsqueda siguen funcionando.
7. **Salón de la Fama.** `src/app/hall-of-fame/page.tsx` lee `searchParams.game` (si falta o no existe en `GAMES`, usa el primer juego de `GAMES` con puntuaciones, o `GAMES[0]` si ninguno tiene), el ranking de 12 y la mejor marca del usuario con sesión (cliente de servidor). `HallOfFame` recibe los datos por props y las pestañas pasan a ser enlaces `?game=<id>`. Eliminar `src/lib/scores.ts`. Verificación: `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] `list_tables` del MCP muestra `public.games` y `public.scores` con RLS activado; `games` tiene 9 filas con los mismos ids que `GAMES` y solo `asteroids` con `accepts_scores = true`.
- [ ] `get_advisors` no reporta problemas de seguridad sobre `games`, `scores`, `game_leaderboard` ni `game_stats`.
- [ ] `supabase/migrations/` contiene el SQL de la migración aplicada.
- [ ] Con sesión, terminar una partida de `asteroids` con puntuación > 0 y pulsar "GUARDAR PUNTUACIÓN" deshabilita el botón mientras guarda, crea una fila en `scores` con el `user_id` del usuario y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] El modal ya no tiene campo de nombre; la fila guardada aparece en el ranking con el username en mayúsculas.
- [ ] Si el guardado falla (por ejemplo, sin red), el modal muestra un mensaje de error en español y permite reintentar.
- [ ] Sin sesión, el modal de `asteroids` muestra "INICIA SESIÓN PARA GUARDAR TU PUNTUACIÓN" con enlace a `/auth` y no muestra el botón de guardar.
- [ ] En `/games/block-fall/play` el modal muestra "PARTIDA DE DEMOSTRACIÓN: NO SE GUARDA" y no muestra el botón de guardar.
- [ ] Con puntuación 0 no se ofrece guardar.
- [ ] Con la clave publicable y una sesión, insertar en `scores` con otro `user_id`, en `block-fall`, con puntuación 0 o 10.000.000, o hacer `update`/`delete` de cualquier fila es rechazado por la base de datos.
- [ ] Llamar a `saveScoreAction` sin sesión devuelve `unauthenticated` y no inserta nada.
- [ ] Si un jugador guarda 3.000 y luego 5.000 en `asteroids`, el ranking muestra una sola fila suya con 5.000, y "Partidas" cuenta 2.
- [ ] Con dos jugadores empatados, aparece primero quien logró la marca antes.
- [ ] `/games/asteroids` muestra el top 10 real (una fila por jugador) y "Mejor global" igual a la mayor puntuación guardada.
- [ ] Recién guardada una puntuación, volver a `/games/asteroids` o `/hall-of-fame?game=asteroids` la muestra sin esperar ni reconstruir la app.
- [ ] Un juego sin puntuaciones muestra "AÚN NO HAY PUNTUACIONES" en ranking y podio, "—" en "Mejor global" y "NUEVO" en "Partidas", en la tarjeta y en el detalle.
- [ ] "Partidas" se muestra como `950`, `1.2K` o `31.8K` según el número de puntuaciones guardadas.
- [ ] `/hall-of-fame?game=asteroids` muestra podio y tabla reales; cambiar de pestaña cambia la URL y los datos; `/hall-of-fame?game=no-existe` cae en la pestaña por defecto sin error.
- [ ] Con sesión, "TU MEJOR MARCA" muestra la posición y puntuación reales del usuario en el juego seleccionado, o "SIN MARCA" con enlace a jugar si no tiene ninguna; sin sesión no se muestra.
- [ ] `src/lib/score-storage.ts` y `src/lib/scores.ts` no existen y `grep` no encuentra `arcade-vault:scores`, `saveScore(`, `generateSeededScores`, `bestScore:` ni `playsLabel:` en `src/lib/games.ts`.
- [ ] `/games/no-existe` sigue devolviendo 404 y las rutas de todos los juegos cargan con sesión y sin ella.
- [ ] Recargar `/games`, `/games/asteroids` y `/hall-of-fame` con y sin sesión no produce advertencias de hidratación en la consola.
- [ ] La Home no cambia (sigue con sus datos de muestra).

---

## Decisiones tomadas y descartadas

- **Sí:** tabla `games` de referencia (id, título, `accepts_scores`) y catálogo en el código. Decisión del usuario; `proxy.ts`, `generateStaticParams` y la UI no cambian de fuente. **No:** catálogo completo en la base de datos, que toca todas las pantallas y choca con la generación estática y Cache Components.
- **Sí:** solo usuarios con sesión guardan puntuaciones. Decisión del usuario; permite RLS por `auth.uid()`. **No:** invitados con nombre libre, que abre spam y suplantación.
- **Sí:** guardar todas las puntuaciones y mostrar en el ranking la mejor marca por jugador. Decisión del usuario; evita que un jugador llene el top y conserva el historial. **No:** mostrar todas las partidas, ni guardar solo la mejor (pierde historial y el conteo).
- **Sí:** solo juegos con motor real guardan (`accepts_scores`, hoy solo `asteroids`). Decisión del usuario. **No:** guardar puntuaciones simuladas, que llenarían el ranking de datos sin sentido.
- **Sí:** `accepts_scores` en la base de datos y exigido por RLS. Decisión del usuario; ni un cliente manipulado puede guardar en un juego simulado. **No:** decidirlo solo en el código.
- **Sí:** Server Action con validación, más RLS. Decisión del usuario; centraliza la validación y la base de datos sigue protegiéndose sola. **No:** `insert` directo desde el navegador. Se acepta que la puntuación la declara el cliente: no hay anti-trampas real.
- **Sí:** username del perfil fijo, sin campo de nombre en el modal. Decisión del usuario; el ranking muestra siempre el username actual. **No:** nombre libre por partida.
- **Sí:** eliminar `score-storage.ts` sin migrar. Decisión del usuario; las puntuaciones locales no tienen dueño verificable. **No:** subirlas al iniciar sesión.
- **Sí:** lecturas en cada petición, dentro de `Suspense`. Decisión del usuario; la marca recién guardada aparece al momento. **No:** caché con `revalidateTag`, más piezas para un tráfico que no lo necesita aún.
- **Sí:** estados vacíos con mensaje y valores neutros ("—", "NUEVO", "SIN MARCA"). Decisión del usuario. **No:** ocultar las secciones.
- **Sí:** "Partidas" cuenta puntuaciones guardadas. Decisión del usuario. **No:** registrar partidas iniciadas, que requiere escrituras anónimas y otra tabla.
- **Sí:** vistas `game_leaderboard` y `game_stats` con `security_invoker`. El ranking por jugador y los conteos se calculan en SQL, no en JavaScript. **No:** traer todas las filas y agrupar en el servidor de Next, que no escala.
- **Sí:** `scores.user_id` referencia a `profiles(id)` y no a `auth.users`. Permite unir con el username en la vista; el borrado sigue en cascada desde `auth.users` a través de `profiles`.
- **Sí:** `revoke all` y `grant` explícitos (lectura pública e `insert` solo de `game_id`, `user_id` y `score` para `authenticated`), igual que en `profiles`. Añadido al implementar el paso 1: el cliente no puede fijar `created_at` y alterar los desempates. **No:** confiar en los permisos por defecto del esquema `public`, que conceden todo a `anon` y `authenticated`.
- **Sí:** puntuación entera de 1 a 9.999.999 (`CHECK` y `MAXIMUM_SCORE`). Frena valores absurdos; con 0 no se ofrece guardar. **No:** dejar la columna sin límites.
- **Sí:** en empate gana la marca más antigua. Es la regla clásica de los arcades.
- **Sí:** la pestaña del Salón de la Fama va en la URL (`?game=`). Permite leer en el servidor y compartir el enlace. **No:** mantenerla en `useState` y pedir los datos desde el navegador.
- **Sí:** eliminar `scores.ts` (`generateSeededScores`) y los campos `bestScore`/`playsLabel` de `GAMES`. Ningún dato simulado convive con los reales en las mismas pantallas.
- **Sí:** tipos escritos a mano. **No:** `generate_typescript_types`, que se reconsidera en otra spec.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `GAMES` y la tabla `games` se desincronizan al añadir un juego | Convención documentada (cada juego nuevo trae su migración); criterio de aceptación que compara los ids. Un juego sin fila en `games` simplemente no acepta puntuaciones. |
| Puntuaciones falsas enviadas llamando a la Server Action o a la API | Aceptado: sin anti-trampas en esta spec. RLS limita al propio usuario y a juegos con `accepts_scores`; el `CHECK` limita el valor. |
| Leer datos por petición en páginas con `generateStaticParams` y Cache Components rompe el build o la generación estática | Lecturas dentro de `Suspense`; releer las guías de `node_modules/next/dist/docs/` antes de empezar; `npm run build` en cada paso. |
| Vistas creadas sin `security_invoker` saltan el RLS | `with (security_invoker = true)` en ambas; `get_advisors` lo verifica. |
| Doble clic en "GUARDAR PUNTUACIÓN" crea dos filas | Botón deshabilitado mientras guarda y oculto tras guardar. |
| Rendimiento del `distinct on` cuando crezca `scores` | Índice `(game_id, score desc, created_at)`; paginación y caché quedan para otra spec. |
| El MCP apunta a un proyecto remoto real | Revisar el SQL y `get_advisors` antes y después de aplicar; la migración solo añade objetos nuevos. |
| Sesión caducada entre jugar y guardar | La Server Action devuelve `unauthenticated` y el modal muestra el aviso de iniciar sesión. |

---

## Qué **no** entra en esta spec

- Catálogo completo en la base de datos.
- Home con datos reales.
- Puntuaciones de invitados o de juegos simulados, y migración desde localStorage.
- Conteo de partidas iniciadas.
- Anti-trampas, límite de envíos, moderación de puntuaciones.
- Caché, Realtime, rankings por periodo, paginación, perfiles públicos e historial.
- Tipos generados y pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
