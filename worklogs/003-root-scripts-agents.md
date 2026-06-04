# 003 — Root Scripts & AGENTS.md Update

**Date:** 2026-06-03
**Branch:** main
**Commits:** 51b3bf8 → 8166526 (3 commits)

## What We Did

Added root-level npm scripts for unified install/start across both frontend and backend, and updated AGENTS.md to reflect the current project state.

## Changes

### Root `package.json` — npm workspaces + concurrently

- **Added `workspaces: ["web"]`** — enables `npm install` at root to install web deps automatically
- **Added `concurrently` as devDependency** (^9.2.1) — standard tool for running multiple processes in parallel from a single npm script
- **`npm start` / `npm run dev`** — runs FastAPI backend (`uv run --directory api fastapi dev app/main.py`) and Vite frontend (`npm run dev --workspace=web`) in parallel, with colored labeled output (`[api]` blue, `[web]` green)
- **`npm run install:all`** — installs both npm workspaces and Python deps (`uv pip install` into `api/.venv`)
- **`npm run build`** — delegates to web workspace's build script
- **Committed `package-lock.json`** — previously untracked, now included for reproducible installs

### AGENTS.md — full rewrite

- **Setup section**: documents `sh setup.sh` for first-time and `npm run install:all` for subsequent installs
- **Dev servers**: updated from "two terminals required" to single `npm start` command
- **Commands**: organized into Root / API / Web sections with workspace-aware flags (`-w web`)
- **Architecture**: updated file tree to reflect case-study component structure (`Hero`, `CycleDiagram`, `StepCard`, `ScrollStory`)
- **Styling approach**: documents no-Tailwind policy (CSS custom properties + scoped styles), design tokens, and typography choices
- **Component design**: documents props-only architecture and loose coupling for swap-out
- **Removed**: stale Tailwind v4 note section, old scaffold page references

## Key Decisions

- **`concurrently` over `npm-run-all`** — more widely used, better output labeling/coloring, handles signal forwarding cleanly
- **Workspace-aware commands** — root scripts use `--workspace=web` / `-w web` rather than `cd web &&`, keeping everything runnable from project root
- **`install:all` as separate script** — plain `npm install` handles JS deps via workspaces; Python deps need an explicit script since npm can't manage them natively

## Commit History

| Commit | Description |
|--------|-------------|
| `51b3bf8` | Add npm workspaces config with root-level start/dev/build scripts |
| `f399cff` | Add concurrently for parallel api+web dev server and install:all script |
| `8166526` | Update AGENTS.md with current commands, architecture, and styling approach |
