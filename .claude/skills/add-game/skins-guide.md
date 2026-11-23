# Skins guide — every real game ships 4 skins

Every real (canvas-engine) game offers exactly these skins: `classic` (default, the look the game had before skins existed), `neon`, `pixel-art` and `experimental`. There is no `retro` skin. Skins are purely visual: they never change gameplay, score, lives, level or timing.

Reference implementation: `src/lib/games/asteroids/` (SPEC 11 + SPEC 14). Copy its shape.

## 1. What is shared and what is per game

| Piece | Where | Shared? |
| --- | --- | --- |
| `SkinId`, `SKIN_IDS`, `DEFAULT_SKIN_ID`, `SKIN_LABELS`, `isSkinId`, `readStoredSkinId(gameId)`, `writeStoredSkinId(gameId, skinId)`, `SKIN_BASE_TOKENS` | `src/lib/games/shared/skins.ts` | **Shared.** Do not edit it when adding a game's skins. |
| Optional `setSkin?(skinId)` | `GameEngine` in `src/lib/games/game-engine.ts` | **Shared contract.** |
| Skin selector (`<select class="skin-select">` in the player bar) | `components/game-player.tsx`, styled in `globals.css` | **Shared UI.** Never create a `<select>` inside an engine. |
| Which games use the selector | `GAME_IDS_WITH_GLOBAL_SKINS` in `src/lib/games/skin-registry.ts` | One entry per game (one id per line). |
| Skin type, the 4 skins, drawing helpers | `src/lib/games/<game-id>/skins.ts`, `skin-draw.ts` | **Per game.** Each game has its own entities and roles. |

Do not move per-game drawing code into `shared/`. Only code that is identical in every game belongs there.

## 2. Per-game files

- `skins.ts`: imports `SKIN_BASE_TOKENS`, `SKIN_LABELS` and `SkinId` from `../shared/skins`, re-exports `DEFAULT_SKIN_ID`, `isSkinId`, `SKIN_IDS` and `SkinId`, defines the `<Game>Skin` type with semantic roles (background, grid/borders, player, enemies/objects, particles/effects, text, font) and `SKINS: Record<SkinId, <Game>Skin>`. Every value written, units in the name (`...Pixels`, `...Seconds`). No storage code here.
- `skin-draw.ts` (when needed): helpers that depend on the skin (strokes, scenes, font resolution).
- Entities draw with `draw(context, skin)`. Nothing is drawn with a color, font or style that is not read from the skin.
- Engine: a private `skinId` that starts as `DEFAULT_SKIN_ID`, a `setSkin(skinId)` method that stores it, and every draw reads `SKINS[this.skinId]`. The engine never reads `localStorage` and never creates DOM. The player owns the saved skin and calls `setSkin` after the engine is created (`GameCanvas`).
- If the game loop does not redraw while paused or after game over, `setSkin` must redraw immediately.
- Register the game: add its id to `GAME_IDS_WITH_GLOBAL_SKINS` in `skin-registry.ts`, one id per line, only once the engine implements `setSkin`.

## 3. Rules per skin

- **classic**: the exact values the game had before skins. Zero visual change by default.
- **neon**: near-black background (`SKIN_BASE_TOKENS.neon.backgroundColor`), saturated colors, glow with `shadowBlur` (`SKIN_BASE_TOKENS.neon.glowBlurPixels`). Reuse the neon accents already used by other games (cyan `#00f5ff`, yellow `#f5ff00`, magenta `#ff006e`, violet `#d400ff`, green `#39ff14`, orange `#ff8a00`) so the platform feels coherent.
- **pixel-art**: shapes made of blocks, `imageSmoothingEnabled = false`, integer coordinates, no glow, background `SKIN_BASE_TOKENS["pixel-art"].backgroundColor`, text in the app pixel font through `SKIN_BASE_TOKENS["pixel-art"].fontCssVariable` (`--font-press-start`, which canvas cannot use as `var()`: read it with `getComputedStyle(document.documentElement)` every frame, falling back to a generic family).
- **experimental**: one bold, original concept per game, **unique among games**. Fully readable and performant (no heavy per-frame allocations, no `shadowBlur` on many shapes). Document the concept, what was discarded and why, in the spec's Decisiones.

Concepts already taken (keep this list in sync with `.claude/agent-memory/skin-designer/MEMORY.md`):

| Game | `experimental` concept |
| --- | --- |
| block-stack | holographic glass / crystal |
| asteroids | blueprint / technical drawing |
| wall-breaker | synthwave sunset with perspective grid |
| fruit-snake | paper-cut stickers on cream paper |

## 4. Readability

Player, hazards, pickups and score-relevant objects must stay distinguishable in every skin. When color is not available (monochrome or blueprint looks), separate roles by shape, size, line style (solid, dashed, dotted) or brightness. Keep sufficient contrast against the skin background.

## 5. UI behavior (already implemented, do not duplicate)

- The selector lives in the player bar, outside the canvas, and works while playing and while paused.
- The choice is saved per game in `localStorage` with the key `arcade-vault:skin:<game-id>`; invalid or unavailable storage falls back to `classic`.
- `GamePlayer` mounts the canvas only after the saved skin has been read, so the first frame already uses it.
- The card covers (`.cover-<id>`) do not change with the skin.

## 6. Do not

- Change gameplay, scoring, `GameSnapshot`, the leaderboard, the pause keys or any timing because of a skin.
- Add a `retro` skin or more than the 4 skins.
- Leave colors, fonts or draw styles outside the skin.
- Touch `GamePlayer`, `GameCanvas`, `game-engine.ts`, `shared/`, `globals.css` or another game's folder when adding a game's skins.
- Recreate the look of a specific commercial game.

## 7. Checklist (browser)

- The player bar shows the skin select with Clásico, Neón, Pixel art, Experimental.
- Changing the skin while playing and while paused redraws at once, does not restart the game and does not change score, lives or level.
- After choosing, the game keys still work (the select gives the keyboard back).
- The choice survives a reload and "JUGAR DE NUEVO".
- The 4 skins are readable and `experimental` is clearly different from the other games' concepts.
- `npx tsc --noEmit` and `npm run lint` pass.
