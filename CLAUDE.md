# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score (see README.md). The README says the project follows Spec Driven Design (`/spec` and `/spec-impl`), using skills from `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`). The codebase is still the untouched Create Next App scaffold (`app/page.tsx` is the default starter page).

## Stack and conventions

- Next.js 16.4.6, React 19.3, Tailwind CSS 4 (`@import "tailwindcss"` in `app/globals.css`, theme tokens via `@theme inline`), TypeScript strict.
- App Router only, in `app/` at the repo root (no `src/`). Path alias `@/*` maps to the repo root.
- **This Next.js version has breaking changes versus common training data.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, …) before writing Next.js code, and heed deprecation notices.
- `app/layout.tsx` uses the globally generated `LayoutProps<"/">` type (no import) and loads Geist fonts via `next/font/google`. Dark mode is driven by `prefers-color-scheme` CSS variables in `globals.css`.
- `AGENTS.md` is re-written by `next dev`; commit it with your work rather than stripping it from diffs.
