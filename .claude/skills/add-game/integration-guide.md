# Integration guide — adding a real game to Arcade Vault

Technical reference for writing (with `/add-game`) and implementing (with `/spec-impl`) a game spec. Extracted from SPEC 05 (asteroids port) and SPEC 06 (leaderboard). When the code and this guide disagree, the code wins: verify symbols before citing them.

Before implementing: reread the relevant guides in `node_modules/next/dist/docs/01-app/` (client components, Cache Components) as `CLAUDE.md` asks, and load the `supabase` and `supabase-postgres-best-practices` skills before the migration step.

---

## 1. Map of the pieces

| File | Role | Touched when adding a game? |
| --- | --- | --- |
| `src/lib/games/game-engine.ts` | Common contract (`GameSnapshot`, `GameEngineCallbacks`, `GameEngine`, `GameEngineFactory`) | No |
| `src/lib/games/<game-id>/` | The engine: constants, entities, engine class, factory | **Yes, new folder** |
| `src/lib/games/shared/` | Shared canvas size, `KeyboardInput`, math helpers | Created once (see §3) |
| `src/lib/games/engine-registry.ts` | `GAME_ENGINE_FACTORIES` (`gameId → factory`), `findGameEngineFactory` | **Yes, one entry** |
| `src/components/game-canvas.tsx` | Creates the `<canvas>`, creates the engine in `useEffect`, `destroy()` on cleanup, forwards `isPaused`, exposes `restart`/`endGame` | No (only its import in §3) |
| `src/components/game-player.tsx` | HUD (Jugador, Puntuación, Vidas, Nivel), pause (`P`/`Esc`/button), FIN, modal "FIN DEL JUEGO", save button | No |
| `src/lib/games/<game-id>/skins.ts`, `skin-draw.ts` + `src/lib/games/skin-registry.ts` | The 4 skins and `setSkin` (see `skins-guide.md`); one id in `GAME_IDS_WITH_GLOBAL_SKINS` | **Yes** |
| `src/lib/games.ts` | `GAMES` catalog (UI, `proxy.ts`, `generateStaticParams`) | **Yes, one entry** (or edit an existing one) |
| `src/app/globals.css` | `.cover-<id>` card cover | **Yes** |
| `supabase/migrations/` + table `public.games` | Reference row with `accepts_scores` | **Yes, one migration** |
| `src/app/games/[id]/play/actions.ts` | `saveScoreAction` (session, `findGameById`, `isValidScore`, insert; RLS checks `accepts_scores`) | No |
| `src/lib/leaderboard.ts`, `src/lib/leaderboard-format.ts` | Reads of `game_leaderboard` / `game_stats`, formatting, `MINIMUM_SCORE`/`MAXIMUM_SCORE` | No |
| `src/proxy.ts` | 404 for unknown game ids, derived from `GAMES` | No |

Everything downstream (play route, detail page ranking, Hall of Fame tab, library stats) works by `gameId` as soon as the game is in `GAMES`, in the registry and in `public.games` with `accepts_scores = true`.

---

## 2. The contract

```ts
// src/lib/games/game-engine.ts (existing, do not change in a game spec)
export type GameSnapshot = { score: number; lives: number; level: number };

export type GameEngineCallbacks = {
  onSnapshotChange: (snapshot: GameSnapshot) => void; // only when a value changes
  onGameOver: (finalScore: number) => void;           // once per game
};

export type GameEngine = {
  start: () => void;
  setPaused: (isPaused: boolean) => void;
  restart: () => void;
  endGame: () => void;
  destroy: () => void; // cancels the animation frame and removes every listener
};

export type GameEngineFactory = (canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) => GameEngine;
```

`GamePlayer` assumes 3 lives at the start (`PLAYER_LIVES`) and resets its HUD to `0 / 3 / 01` on restart; the snapshot the engine emits on `start()`/`restart()` corrects it immediately. That is why `startNewGame()` clears `lastEmittedSnapshot` before emitting: otherwise a game that ends with the same values it starts with (e.g. `0 / 1 / 1`) would not emit and the HUD would keep the player's default. A game whose lives are not 3 (or that has none: use `lives: 1`) works without touching the player; the HUD shows the engine value after the first frame. Changing the snapshot shape is a contract change and needs its own spec.

---

## 3. Shared code — created by the first new game

Today Asteroids owns code every game needs. If `src/lib/games/shared/` does not exist, the first game spec starts with this step, **without changing Asteroids' behavior**:

- `src/lib/games/shared/canvas.ts`: `CANVAS_WIDTH = 800`, `CANVAS_HEIGHT = 600`, `MAXIMUM_FRAME_SECONDS = 0.05`. Remove them from `asteroids/constants.ts` and import them from here (Asteroids and `game-canvas.tsx`, which today imports from `@/lib/games/asteroids/constants`).
- `src/lib/games/shared/keyboard-input.ts`: move `asteroids/keyboard-input.ts`. The hard-coded `GAME_KEY_CODES` set becomes a constructor parameter: `new KeyboardInput(gameKeyCodes: readonly string[])`. Asteroids passes `["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]`.
- `src/lib/games/shared/math.ts`: move `asteroids/math.ts` (`Point`, `wrapCoordinate`, `distanceBetween`, `randomBetween`, `randomIntegerBetween`). Game-specific helpers stay in the game folder.
- Verification: `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `/games/asteroids/play` plays exactly as before.

Every game renders on the same logical 800×600 canvas (4:3, same as `.crt-screen`). CSS scales it (`.game-canvas { width: 100%; height: 100%; display: block }`). A vertical board is centered inside with side panels; there is no per-game canvas size.

---

## 4. Engine skeleton and lifecycle rules

File layout per game (`src/lib/games/<game-id>/`): `constants.ts` (all balance values, named without abbreviations, with units in the name: `...Seconds`, `...PixelsPerSecond`), one file per entity (`update(deltaSeconds)`, `draw(context)`, `isDead` when entities are removed), `<game-id>-engine.ts`.

```ts
import type { GameEngine, GameEngineCallbacks, GameEngineFactory, GameSnapshot } from "../game-engine";
import { CANVAS_HEIGHT, CANVAS_WIDTH, MAXIMUM_FRAME_SECONDS } from "../shared/canvas";
import { KeyboardInput } from "../shared/keyboard-input";
import { GAME_KEY_CODES, INITIAL_LIVES } from "./constants";

type ExamplePhase = "playing" | "respawning" | "game-over"; // whatever phases the game needs

class ExampleEngine implements GameEngine {
  private readonly context: CanvasRenderingContext2D;
  private readonly input = new KeyboardInput(GAME_KEY_CODES);
  private score = 0;
  private lives = INITIAL_LIVES;
  private level = 1;
  private phase: ExamplePhase = "playing";
  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private lastEmittedSnapshot: GameSnapshot | null = null;

  private readonly callbacks: GameEngineCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Example: the 2D canvas context is not available.");
    this.context = context;
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.animationFrameId !== null) return; // idempotent: never two loops
    this.startNewGame();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
  setPaused(isPaused: boolean): void { this.isPaused = isPaused; }
  restart(): void { this.startNewGame(); } // reuses the running loop
  endGame(): void { if (this.phase !== "game-over") this.finishGame(); }
  destroy(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.input.detach();
  }

  private startNewGame(): void {
    // reset EVERY piece of state (entities, counters, timers, phase) …
    this.score = 0; this.lives = INITIAL_LIVES; this.level = 1; this.phase = "playing";
    this.lastTimestamp = null;
    this.lastEmittedSnapshot = null; // always emit: the player has just reset its HUD to 0 / 3 / 01
    this.input.attach();       // re-attached: it was detached at game over
    this.emitSnapshotIfChanged();
  }

  private finishGame(): void {
    this.phase = "game-over";
    this.input.detach();       // lets the modal receive Space and other keys
    this.emitSnapshotIfChanged();
    this.callbacks.onGameOver(this.score); // exactly once per game
  }

  private emitSnapshotIfChanged(): void {
    const previous = this.lastEmittedSnapshot;
    if (previous && previous.score === this.score && previous.lives === this.lives && previous.level === this.level) return;
    this.lastEmittedSnapshot = { score: this.score, lives: this.lives, level: this.level };
    this.callbacks.onSnapshotChange(this.lastEmittedSnapshot);
  }

  private readonly loop = (timestamp: number): void => {
    if (this.isPaused) {
      this.lastTimestamp = null;               // no jump on resume
      this.input.consumePress("Space");        // discard single presses made while paused (all single-press keys)
    } else {
      const deltaSeconds = this.lastTimestamp === null
        ? 0
        : Math.min((timestamp - this.lastTimestamp) / 1000, MAXIMUM_FRAME_SECONDS);
      this.lastTimestamp = timestamp;
      this.update(deltaSeconds);
      this.emitSnapshotIfChanged();
    }
    this.draw();                                // keeps drawing while paused / game over
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void { /* game rules; nothing moves in "game-over" except effects */ }

  private draw(): void {
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // entities + game-specific indicators only. NO score/lives/level, NO "GAME OVER", NO "press to start".
  }
}

export const createExampleEngine: GameEngineFactory = (canvas, callbacks) => new ExampleEngine(canvas, callbacks);
```

Rules (each one is an acceptance criterion in the template):

1. No React, no `window`/`document` access at module level, no mutable module-level variables, no `any`. All browser access happens inside the engine, which `GameCanvas` only creates in `useEffect`.
2. The game starts immediately on `start()` (no title screen; the player page is the title screen).
3. Time is `deltaSeconds` with the `MAXIMUM_FRAME_SECONDS` cap. Grid/tick games (falling pieces, snake) accumulate `deltaSeconds` into a tick timer instead of counting frames, so pause and tab switches behave the same.
4. Pause is owned by `GamePlayer`; the engine only obeys `setPaused`. Nothing advances while paused, including invincibility and tick timers.
5. `onSnapshotChange` only on change; `onGameOver` once per game, both on losing the last life and on `endGame()`.
6. On game over the input is detached; on restart it is attached again.
7. `P` and `Escape` are never game keys. Every game key is in `GAME_KEY_CODES` so it gets `preventDefault` (no page scroll, no "click" on the focused PAUSA button). `KeyboardInput` already ignores `input`/`textarea`/contenteditable targets.
8. `restart()` must not create a second `requestAnimationFrame` chain: the game speed after "JUGAR DE NUEVO" is the same as in the first game.
9. Randomness uses `Math.random()` (no seeding) unless the spec says otherwise.
10. Port mode: constants are copied with their original values and a comment `// Values ported unchanged from references/started-games/<folder>/<file>`; original names are translated to descriptive English (`ttl` → `remainingLifetimeSeconds`). Global state, DOM lookups, the original's HUD/GAME OVER drawing and its own `requestAnimationFrame` bootstrap are dropped.

---

## 5. Registry

```ts
// src/lib/games/engine-registry.ts
export const GAME_ENGINE_FACTORIES: Record<string, GameEngineFactory> = {
  asteroids: createAsteroidsEngine,
  "<game-id>": create<GameName>Engine,
};
```

That single entry switches `/games/<game-id>/play` from the simulation to the real canvas, the real HUD, and the save flow of the modal.

---

## 6. Catalog card and cover

```ts
// src/lib/games.ts → GAMES
{
  id: "<game-id>",                 // kebab-case, ^[a-z0-9]+(-[a-z0-9]+)*$ (same check as the DB)
  title: "<TITLE>",                // uppercase
  shortDescription: "<es>",        // one line, only mechanics that exist
  longDescription: "<es>",         // 2–3 sentences, only mechanics that exist
  category: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS",
  coverClassName: "cover-<game-id>",
  accentColor: "cyan" | "magenta" | "green" | "yellow",
}
```

New games are appended at the end of `GAMES`. Converting a simulated card keeps its `id` (and its position) and rewrites the descriptions to match the real game.

Cover in `src/app/globals.css`, next to the other `.cover-*` rules: a background gradient on `.cover-<game-id>` and an `::after` with an inline SVG (data URI, `#` escaped as `%23`) that draws a scene in the game's own style, like `.cover-asteroids`. No external images.

The `bestScore` / "Partidas" values come from `game_stats`; never add them to `GAMES`.

---

## 7. Migration (leaderboard)

`public.games` must contain exactly the ids of `GAMES` (convention of SPEC 06). Scores are only accepted when `accepts_scores = true`, enforced by RLS.

New game:

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_add_<game_id_with_underscores>_game.sql
insert into public.games (id, title, accepts_scores)
values ('<game-id>', '<TITLE>', true);
```

Converting a simulated game:

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_enable_scores_for_<game_id_with_underscores>.sql
update public.games set accepts_scores = true, title = '<TITLE>' where id = '<game-id>';
```

Steps: load the `supabase` skills; apply with the MCP `apply_migration` (name in snake_case, same as the file); save the identical SQL in `supabase/migrations/` with the timestamp of the applied migration (`list_migrations`); run `get_advisors` (security and performance); check with `execute_sql` (`select id, accepts_scores from public.games order by id`) that the ids match `GAMES`. Grants, policies and views (`game_leaderboard`, `game_stats`) already cover any new row; do not redefine them.

---

## 8. Conventions

- TypeScript strict, no `any`, no mutable module globals, descriptive names without abbreviations (`deltaSeconds`, not `dt`; `context`, not `ctx`).
- UI text in Spanish; code, paths, names and comments in English.
- Each plan step leaves the app working and is verified with `npx tsc --noEmit` and `npm run lint` (plus `npm run build` at the end and whenever routes or CSS change).
- Commits follow `/spec-impl` and `specs/.spec-config.yml` (`AutoCommitSteps`); outside that flow, only when the user confirms, with short lowercase English messages and no AI attribution.
- The plan is implemented exactly as written: if the spec and this guide disagree, stop and ask (as `/spec-impl` requires) instead of silently following either one.
- Out of scope by default (each one its own spec): sound, touch/gamepad, configurable keys, high-DPI canvas, automated tests, seeded randomness, contract changes to `GameSnapshot`, Home real data.

---

## 9. Manual verification checklist (browser)

Used after the last plan step, when `/spec-impl` asks to verify the acceptance criteria. It is not a plan step.

- `/games/<game-id>/play`: the game starts, HUD shows real values, game keys don't scroll the page even with PAUSA focused.
- PAUSA, `P`, `Esc`: everything stops and "EN PAUSA" shows; resuming has no jump.
- FIN and losing the last life open "FIN DEL JUEGO" with the real score; typing works afterwards.
- JUGAR DE NUEVO: score 0, initial lives and level, same speed as the first game.
- Leave with SALIR / VOLVER AL VAULT, then come back with the Back button: fresh game, no modal or pause inherited, one engine.
- Dev mode (Strict Mode): only one engine running.
- With session: GUARDAR PUNTUACIÓN creates a row in `scores` and it appears in `/games/<game-id>` and `/hall-of-fame?game=<game-id>`. Without session: login notice.
- Skins: the checklist of `skins-guide.md` §7 (select in the player bar, 4 skins, `experimental` unique).
- `/games/asteroids/play` and a simulated game (`/games/block-fall/play`) still behave as before.
- Width ≤ 480 px: canvas scales at 4:3 with no horizontal scroll.
- No hydration warnings in the console.
