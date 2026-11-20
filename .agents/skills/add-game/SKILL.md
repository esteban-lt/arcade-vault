---
name: add-game
description: Designs the spec to add a new real (canvas-engine) game to Arcade Vault, wired to the player, the catalog and the Supabase leaderboard, following the pattern of SPEC 05 (asteroids port) and SPEC 06 (leaderboard). Works for games designed from scratch (main case) and for ports of a reference game in references/started-games/. Use it when the user wants to add, create, port or integrate a game into the platform.
disable-model-invocation: true
argument-hint: '<game name> [sin referencia | ref: references/started-games/XX-name]'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /add-game — Spec designer for a new real game

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist yet"`

Reference games available (the folder is git-ignored, it may be missing):
!`ls references/started-games/ 2>/dev/null || echo "No references/started-games/ folder"`

Game engines in the codebase:
!`ls src/lib/games/ 2>/dev/null`

Shared engine code (missing means the first new game must create it):
!`ls src/lib/games/shared/ 2>/dev/null || echo "NOT CREATED YET: src/lib/games/shared/ does not exist"`

Workflow config:
!`cat specs/.spec-config.yml 2>/dev/null || echo "No config file"`

---

This skill is a specialization of `/spec` for one recurring feature: **adding a real, playable game** to the platform. It follows the same four phases, rules and spec format as `/spec` (`skills/spec/SKILL.md` and `skills/spec/template.md`, in the same skills folder as this one), and adds the game-specific knowledge on top. You don't write code here. You ask the game-specific questions, then write a complete spec in `specs/` that `/spec-impl` will implement.

The integration pattern is already solved: a TypeScript engine without React, registered by game id, hosted by `GameCanvas` inside `GamePlayer`, with a catalog card and a row in the `public.games` table so scores reach the leaderboard. The technical details live in `integration-guide.md` (same folder). The spec skeleton lives in `spec-template.md` (same folder). Read both before writing anything.

Reply in the language of the user's prompt (normally Spanish). The spec is written in the language of the existing specs (Spanish in this repo); code, paths and identifiers in English.

### What `/spec-impl` expects from the spec this skill writes

`/spec-impl` only runs on specs whose state means "Approved", creates the branch `spec-NN-slug` from the file name, implements **exactly** the plan step by step (pausing after each one, and committing each one as `spec-NN-step-MM` when `AutoCommitSteps: true`), stops at any ambiguity, and refuses anything outside the scope. Therefore:

- Every step of the plan must be commitable on its own and leave the app running.
- Every value the implementation needs (constants, keys, points, texts of the card) must be in the spec. No TODOs, no "to be decided".
- The plan does not end with a "test everything" step: verification belongs to the acceptance criteria, which `/spec-impl` reminds the user to check after the last step.
- Anything the user might want "while we're at it" goes to "Fuera de alcance", so `/spec-impl` can reject it.

## Phase 1 — Context and mode

1. Read the project-memory file, stopping at the first hit: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`. Then read `integration-guide.md`, `spec-template.md` and the generic `/spec` template (`../spec/template.md`), whose global rules also apply.
2. Read the two most recent specs in `specs/` and, if they are not among them, `specs/05-asteroids-game-port.md` and `specs/06-leaderboard-and-games-table.md`. They are the source of the pattern and of the wording (states `Borrador`/`Aprobado`/`Implementado`, section headings). Match them.
3. Check the **Shared engine code** line in the session context:
   - If `src/lib/games/shared/` does **not** exist, the spec must include the generalization step (step 1 of the plan in `spec-template.md`). Tell the user in one line that this game will also extract the shared code from Asteroids.
   - If it exists, read its files and reuse them; no generalization step.
4. Check whether another game spec is still `Borrador` or `Aprobado` (not implemented). If so, warn the user: two game specs in flight could both try to create `shared/`.
5. Determine the **mode** from `$ARGUMENTS`:
   - `sin referencia` / `no reference` / nothing that points to a folder → **from scratch** (main case).
   - `ref: <path>` / `con referencia <path>` / a folder name from `references/started-games/` → **port**.
   - If it is not stated, ask with `AskUserQuestion` (offer the folders listed in the session context plus "Sin referencia").

### Mode: from scratch (main case)

There is no source of truth other than the user. Every mechanic, constant, control and scoring rule comes out of Phase 2 and is written in the spec with a concrete starting value (speeds in px/s, times in seconds, points per action). Never leave "to be tuned" without a number: write the initial value and, if needed, a decision that says it may be rebalanced in a later spec.

### Mode: port

1. Verify the path exists. If it does not, show the available folders and ask.
2. Read the original (`game.js`, other `.js`, `index.html`, `README.md`, `CLAUDE.md`, its `specs/` if any). Skip `.github/`, `.claude/`, `.agents/`, `.DS_Store`.
3. Before asking anything, show the user a short summary: canvas size, entities, controls, constants (with values), scoring, lives, levels, power-ups, what the original draws as HUD / GAME OVER / start screen, assets (images, sounds) and anything that cannot be ported 1:1.
4. The default is a **faithful port**: same mechanics and constants, no new features. What the original draws as HUD, GAME OVER or "press to start" is removed (the player UI owns it). Sounds, if any, are out of scope unless the user says otherwise.
5. Phase 2 questions then only cover what the port cannot answer by itself (mapping to `GameSnapshot`, canvas fit, catalog card, controls that clash with `P`/`Esc`).

## Phase 2 — Game-specific questions

**Never skip this phase.** If the user wants to go faster, remind them that questions now save hours in `/spec-impl`. If they insist, respect it, and record it in the decisions section ("Definición rápida sin aclaración detallada").

Ask in blocks of 3–5 using `AskUserQuestion` (numbered markdown list if the tool does not exist), concrete questions with 2–4 options, recommendation first and labeled. Be direct, no apologies. Skip whatever the reference already answers. If an answer opens a big new area (multiplayer, online, level editor), say it deserves its own spec and ask to leave it out.

Stop when you can fill every `<…>` of `spec-template.md` without inventing, and you can answer `/spec`'s three questions: which files appear or change, what the first and last executable steps are, and how to verify the game is finished.

**Block A — Game concept** (from scratch only, or to confirm a port):
- One-sentence concept. If it does not fit in one sentence, propose splitting (base game now, extras in later specs).
- Core loop and loss condition (what costs a life, what ends the game).
- Entities and their behavior; difficulty progression (what changes per level).
- Power-ups or special mechanics, or none.

**Block B — Contract mapping (`GameSnapshot = { score, lives, level }`):**
- How points are earned (exact values per action).
- Lives: how many, what happens on losing one (respawn, invincibility, board reset). If the game has no lives, recommend `lives: 1` and losing it = game over; changing the contract is its own spec.
- Level: what makes it go up. If the game has no levels, recommend a derived level (e.g. every N lines / N points) or a fixed `1`.
- Scores must fit 1–9.999.999 (database check). Flag designs that could exceed it.

**Block C — Controls and screen:**
- Keys (`KeyboardEvent.code`), held vs single-press actions. `P` and `Escape` are reserved by the player for pause; never assign them. Every game key gets `preventDefault` while playing.
- Canvas: always the shared logical **800×600** (4:3, the CRT frame). A vertical or small board is centered inside it with free side space (allowed for in-canvas info specific to the game, like "next piece").
- Visual style: recommend the vector/flat style on black of Asteroids; neon restyle only if the user asks.
- In-canvas indicators specific to this game (like the "3x" of Asteroids) vs. what goes to the React HUD (only score, lives, level).

**Block D — Catalog and leaderboard:**
- New card vs. **converting an existing simulated card** (`brick-buster`, `block-fall`, `serpentine`, `glutton`, `invaders`, `rocks`, `frog-crossing`, `pixel-duel`). Recommendation: new card, like `asteroids` (SPEC 05), unless the user explicitly wants to replace a simulation. Converting changes the migration (`update` instead of `insert`) and the card text must match the real game.
- `id` (kebab-case), `title` (uppercase), category (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`), accent color (`cyan`/`magenta`/`green`/`yellow`), short and long description in Spanish (only mechanics that exist), cover idea (`.cover-<id>`).
- Scores always go to the leaderboard (`accepts_scores = true`); there is nothing to ask there unless the user wants a non-scoring game.

**Block E — Out of scope:** confirm what stays out (sound, touch, gamepad, configurable keys, high-DPI, automated tests, deterministic random). Anything big the user adds (multiplayer, online, level editor) is its own spec.

**Originality rule:** do not specify a recreation of a specific commercial game (its name, characters, art, music, levels or look). If the user names a classic, treat it as a genre: the spec uses the platform's own title and an original look, and describes the mechanics generically. Reference folders are the user's own starter code, so porting their mechanics is fine; card text and art stay original.

## Phase 3 — Write the spec

Fill `spec-template.md` completely:

- Replace every `<…>`. Remove the optional blocks that don't apply (the generalization step if `shared/` exists, the port-only lines in from-scratch mode and vice versa, the `update` migration for a new card).
- Keep the standard steps and acceptance criteria of the template: they encode the lessons of SPEC 05/06 (Strict Mode, Back button with hidden pages, pause without jumps, one engine, keys without scroll, typing in the modal). Add the game-specific criteria (one per mechanic, with numbers).
- The data model lists the engine constants with values, the phase type of the engine, the `Game` entry and the SQL of the migration.
- Every decision taken in Phase 2 goes to "Decisiones tomadas y descartadas", marked "Decisión del usuario" when it was, with what was discarded and why.
- Respect the global rules of `/spec`'s template: one idea per sentence, concrete names and exact strings, no TODOs, no long executable code (short snippets for data structures only; the engine code lives in `integration-guide.md`, not in the spec).
- Plan step size: if a step would add much more than ~50 lines of logic (typically the entities or the engine of a big game), split it into commitable sub-steps (e.g. "board and pieces", then "line clearing and scoring").

If Phase 2 is closed, write the whole spec at once (no section-by-section approval, no draft shown first). Only go section by section, confirming each one, if something is still missing.

If the game does not fit in one objective sentence or needs decisions in four or more domains, propose splitting it (e.g. base game first, power-ups or extra modes in a later spec) before writing.

## Phase 4 — Save

1. Next number: highest in `specs/` + 1, zero-padded. Slug: `<game-id>-game` for a new game, `<game-id>-game-port` for a port (e.g. `07-serpentine-game.md`).
2. `**Status:** Borrador` (or the draft word the existing specs use). Never `Aprobado`.
3. `**Depends on:** SPEC 05, SPEC 06` (plus any other real dependency). Check they exist.
4. `**Date:**` from the session context.
5. Write the file directly, without asking for permission or about the name; only ask if it already exists.
6. If `specs/.spec-config.yml` does not exist (see the **Workflow config** line above), seed it exactly as `/spec` Phase 4 does (`AutoCreateBranch: true`, `AutoCommitSteps: false`, with its comments). If it exists, never touch it.
7. Confirm: path, state `Borrador`, whether it includes the shared-code generalization, the branch `/spec-impl` will create (`spec-NN-slug`), and the next step: review it, set it to `Aprobado` (a human change) and run `/spec-impl NN-slug`. During the implementation, `integration-guide.md` is the technical reference.
8. **Stop.** Do not offer to implement.

## Hard rules

- Never write code in this skill; only the spec file (and the config file if missing).
- Never assume decisions the user did not confirm, and never re-ask in Phase 3 what Phase 2 already answered.
- Never touch `GamePlayer`, `GameCanvas`, `saveScoreAction` or the leaderboard in the spec unless the user explicitly asks for a contract change; if they do, recommend a separate spec.
- Never assign `P` or `Escape` to the game.
- Never invent mechanics in port mode; never leave constants without values in from-scratch mode.
- Never mark the spec as approved.
