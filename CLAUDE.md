# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score (see README.md). UI copy is in Spanish; code, comments and commit messages are in English.

## Commands

- `npm run dev` (Turbopack), `npm run build`, `npm start`, `npm run lint` (flat config in `eslint.config.mjs`).
- Type check: `npx tsc --noEmit`. There is no test framework.

## Workflow: Spec Driven Design

- Every feature starts as a spec in `specs/NN-slug.md` (`/spec`), and is implemented with `/spec-impl` on a branch `spec-NN-slug`. New games use `/add-game`, which writes a spec following `.claude/skills/add-game/integration-guide.md`. When the user asks which game to add next (or wants game ideas), delegate to the `game-planner` subagent first, then hand its recommendation to `/add-game`.
- When the user gives a game-jam theme, delegate to the `game-jam` subagent (`.claude/agents/game-jam.md`): it writes 1–3 alternative draft specs in `specs/game-jam/<theme-slug>/` (the recommended one is `01`) and maintains `.claude/agent-memory/game-jam/MEMORY.md` itself. Promote the chosen one to `specs/NN-slug.md` (next global number) before `/spec-impl`.
- When the user asks for skins/themes for a specific game, delegate to the `skin-designer` subagent (`.claude/agents/skin-designer.md`) with the game id: it audits the 4 skins (`classic` default, `neon`, `pixel-art`, `experimental`; `experimental` is unique per game), writes or updates `specs/NN-<id>-skins.md` and implements it inside that game's folder without committing. Rules and reference in `.claude/skills/add-game/skins-guide.md`. It maintains `.claude/agent-memory/skin-designer/MEMORY.md` itself.
- When the user asks to check or fix the responsive/mobile/tablet layout, delegate to the `mobile-porter` subagent (`.claude/agents/mobile-porter.md`) with an optional route (no route = all routes): it audits laptop/tablet/phone in Claude in Chrome, writes `specs/NN-responsive-<slug>.md`, fixes without committing, and maintains `.claude/agent-memory/mobile-porter/MEMORY.md` itself.
- A spec's header carries `> **Status:**` (e.g. `Aprobado`, `Implementado`); `/spec-impl` only runs on approved specs. Mark it `Implementado` when done.
- `specs/.spec-config.yml`: `/spec-impl` auto-creates the branch, but never commits steps (`AutoCommitSteps: false`).
- Skills live in `.claude/skills/` (used by Claude Code) and `.agents/skills/` (the copy `npx skills` installs, tracked in `skills-lock.json`). They have diverged: edit the `.claude/` copy.
- `game-planner` (`.claude/agents/game-planner.md`) is read-only except for its own memory, `.claude/agent-memory/game-planner/MEMORY.md` (past suggestions, versioned in git): it updates that file itself, so don't edit it by hand or strip it from diffs.
- `references/` holds source material, not app code: `started-games/` (original games ported in specs 05, 07, 08), `snake-assets/`, `templates/` (HTML/CSS mockups the UI was built from).

## Stack

- Next.js 16.4.6 (App Router, `src/app/`), React 19.3, TypeScript strict, Tailwind CSS 4 via `@tailwindcss/turbopack`. Path alias `@/*` → `src/`.
- **This Next.js version has breaking changes versus common training data.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`: anything reading cookies/session (e.g. leaderboard reads) must render inside `<Suspense>`.
- Middleware is `src/proxy.ts` (Next 16 name). It returns a real 404 for unknown `/games/<id>` paths (a `notFound()` inside a streamed page would keep status 200) and refreshes the Supabase session on every other request.
- Pages and layouts use the globally generated `PageProps<"/route">` / `LayoutProps<"/">` types (no import).
- `AGENTS.md` is re-written by `next dev`; commit it with your work rather than stripping it from diffs.

## Architecture

- **Styling**: dark-only retro theme. Tokens in `:root` of `src/app/globals.css`, exposed to Tailwind with `@theme inline` (`bg-cyan`, `text-magenta`, `font-pixel`, `border-line`…). Component classes (`.btn`, `.card`, `.chip`, `.cover-<game-id>`…) live in `@layer components`. Fonts: Press Start 2P (`--font-press-start`) and JetBrains Mono, loaded in `layout.tsx`.
- **Routes**: `/` (home), `/games` (library), `/games/[id]` (detail + ranking), `/games/[id]/play` (player), `/hall-of-fame`, `/about` (contact form), `/auth`. Route files are thin; the UI lives in `src/components/`.
- **Game catalog**: `src/lib/games.ts` (`GAMES`, `findGameById`) is the source of truth for the UI, `proxy.ts` and `generateStaticParams`. Some entries are placeholders without an engine.
- **Game engines**: plain TypeScript classes drawing on a `<canvas>` (800×600), in `src/lib/games/<game-id>/`, implementing the contract in `src/lib/games/game-engine.ts` (`start`, `setPaused`, `restart`, `endGame`, `destroy`; callbacks `onSnapshotChange` with `{score, lives, level}` and `onGameOver`). Shared helpers in `src/lib/games/shared/`. Registered by id in `src/lib/games/engine-registry.ts`.
- **Skins**: each real game has 4 skins (`classic`, `neon`, `pixel-art`, `experimental`). Shared infrastructure in `src/lib/games/shared/skins.ts` (ids, labels, `localStorage` key `arcade-vault:skin:<game-id>`), the optional `GameEngine.setSkin`, the `use-stored-skin.ts` hook, and the `<select class="skin-select">` in the player bar for the games listed in `lib/games/skin-registry.ts`. Skin types and drawing stay per game (`src/lib/games/<id>/skins.ts`, `skin-draw.ts`). Guide: `.claude/skills/add-game/skins-guide.md`.
- **Player**: `components/game-player.tsx` owns the HUD, pause (`P`/`Esc`), game over and the save button; `components/game-canvas.tsx` creates/destroys the engine. Games not in the registry fall back to a simulated score.
- **Adding a game** touches: a new engine folder, one registry entry, one `GAMES` entry, a `.cover-<id>` class in `globals.css`, and a migration inserting the row into `public.games` with `accepts_scores = true`.
- **Supabase** (`@supabase/ssr`): `lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions), `proxy.ts` (session refresh; keep `getClaims()` right after `createServerClient`). Publishable key only; access is enforced by RLS.
  - Schema in `supabase/migrations/`: `profiles` (created by trigger on sign-up, username `^[A-Za-z0-9_]{3,20}$`, mirrored in `lib/profile.ts`), `games`, `scores`, views `game_leaderboard` and `game_stats`. The `scores` insert policy checks the owner and `games.accepts_scores`.
  - Apply migrations via the Supabase MCP server (`.mcp.json`); load the `supabase` and `supabase-postgres-best-practices` skills before any schema change.
- **Auth**: `components/auth-provider.tsx` (`useAuth()`) exposes the session user (profile username uppercased) to client components; it starts as guest to keep hydration stable.
- **Leaderboard**: server reads in `lib/leaderboard.ts` (React `cache`); client-safe rules and formatters (`isValidScore`, `MINIMUM_SCORE`/`MAXIMUM_SCORE`) in `lib/leaderboard-format.ts`. Scores are saved by `saveScoreAction` in `app/games/[id]/play/actions.ts`.
- **Contact**: `app/about/actions.ts` sends mail with Resend (honeypot + validation in `lib/contact.ts`).
- **Env vars** (`.env.example`): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
