# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A visual showcase for the [Cyberclaw](https://github.com/zazer0/cyberclaw) autonomous agent system. The home page is a scroll-driven case study ("Overnight Engineering") with a sticky 3D cycle diagram (Threlte v8), scroll-activated step cards, and IntersectionObserver-based interactivity. Built with Svelte 5 + SvelteKit, Threlte v8 (Three.js), and a FastAPI backend.

## Commands

### Root (both servers)

```sh
npm start                # run api + web dev servers in parallel (concurrently)
npm run dev              # alias for npm start
npm run install:all      # install all deps (npm workspaces + api uv)
npm run build            # production build (web only)
```

### Web (`web/`)

```sh
npm run dev -w web       # web standalone (localhost:5173)
npm run check -w web     # svelte-check + tsc
npm run lint -w web      # prettier + eslint (check only)
npm run format -w web    # prettier write
npm run test:unit -w web # vitest
npm run test:e2e -w web  # playwright (builds, then runs on :4173)
npm run build -w web     # production build
```

### API (`api/`)

```sh
uv run fastapi dev app/main.py   # api standalone (localhost:8000)
uv run pytest                    # tests
uv run ruff check app/           # lint
uv run ruff format app/          # format
```

## Architecture

npm workspaces monorepo — root orchestrates `web/` (SvelteKit) and `api/` (FastAPI).

- **Root `package.json`**: workspace config, scripts, and npm overrides only. `concurrently` is the sole devDependency. All other npm packages belong in `web/package.json`.
- **Vite proxy**: `/api/*` → `http://localhost:8000` — no CORS issues in dev.
- **API**: stateless FastAPI app (`api/app/main.py`) with `/api/health` and `/api/metrics`. No database — stub data. Python managed via `uv`.
- **Page structure**: single route (`+page.svelte`) defines all step data (`StepData[]`) and composes `Hero` + `ScrollStory`. All content flows down through props.
- **3D diagram**: `CycleDiagram3D.svelte` uses Threlte v8 (Canvas, scene, nodes, arcs, scroll-synced animations). `DiagramScene.svelte` handles layout/lighting/camera. `three` and `troika-three-text` are marked `noExternal` in vite config for SSR compatibility.

## Styling

- **No Tailwind utilities** — all styling via CSS custom properties (`:root` in `app.css`), scoped `<style>` blocks, and inline styles. Tailwind v4 is installed but intentionally unused.
- Design tokens: `--color-cream`, `--color-ink`, `--color-accent`, `--color-muted`, `--ease-smooth`
- Typography: Inter Variable (headings via weight 700), JetBrains Mono for monospace

## Component design

- All content passed via props — no shared data files, no cross-component imports
- Components are loose-coupled and independently replaceable
- `+page.svelte` is the sole composition point

## Key versions and syntax

- **Svelte 5** with runes mode enforced (`$state`, `$props`, `$derived`, `$effect`). Use Svelte 5 callback/event props, not legacy `on:` events. Use snippets/render patterns, not slot props.
- SvelteKit 2.57, Vite 8, TypeScript 6
- **Threlte v8**: check current v8 docs before editing Canvas, T, GLTF, events, snippets, plugins, or Rapier. After 3D changes, run the app and visually inspect the scene.

## 3D Diagram constraints

All visual/layout changes to the system diagram must use 3D geometry (PlaneGeometry, mesh positioning, material properties) — not CSS modifications. The diagram is fully parameterized in Threlte world-space; CSS-level visual fixes are prohibited to keep future changes in the 3D layer.

## Test configuration

- **Vitest**: `requireAssertions: true` — every test must contain at least one assertion. Node environment. Tests match `src/**/*.{test,spec}.{js,ts}`.
- **Playwright**: matches `**/*.e2e.{ts,js}`. Builds the app then runs preview server on `:4173`.
- **ESLint**: unused vars use `_` prefix pattern (`varsIgnorePattern: '^_'`, `argsIgnorePattern: '^_'`).

## UI Verification

This project uses the `ui-verify` skill for automated visual verification. See `.claude/skills/ui-verify/` for the contract format, verdict authority rules, and scroll-targets documentation.

### Project scroll targets

| Key | Scrolls to |
|---|---|
| `first-load` | No scroll (top of page) |
| `step-zero` | Step 0 — User Input |
| `step-one` | Step 1 — Orchestration |
| `step-two` | Step 2 — Diagnosis & Fix |
| `step-three` | Step 3 — Validation |
| `output` | Output — Success |
| `bottom` | Bottom of page |

Sentinel mapping for scroll targets: nth-child(1)=Step 0, nth-child(2)=Step 1, nth-child(3)=Step 2, nth-child(4)=Step 3, nth-child(5)=Output.

Example `scrollIntoView` for Step 2:
```sh
agent-browser eval "document.querySelector('.scroll-story .scroll-sentinel:nth-child(3)').scrollIntoView({block: 'start'}); 'done'"
```
