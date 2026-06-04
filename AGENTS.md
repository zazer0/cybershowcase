# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## What this is

**pocui** — a Svelte 5 + SvelteKit frontend and FastAPI backend. The home page is a scroll-driven case study ("Overnight Engineering") with a sticky SVG cycle diagram, scroll-activated step cards, and IntersectionObserver-based interactivity.

## Setup

```sh
sh setup.sh              # first-time install (online) — installs web + api deps
npm run install:all      # or: install npm workspaces + api Python deps
```

## Dev servers

Single command runs both API and frontend in parallel via `concurrently`:

```sh
npm start                # api (localhost:8000) + web (localhost:5173)
```

Vite proxies `/api/*` → `:8000`, so fetch calls in the browser go through the proxy without CORS issues.

## Commands

### Root (both)

```sh
npm start                # run api + web dev servers in parallel
npm run install:all      # install all deps (npm workspaces + api pip)
npm run build            # production build (web only)
```

### API (`api/`)

```sh
uv run fastapi dev app/main.py       # run api standalone
uv run pytest                        # run all tests
uv run ruff check app/               # lint
uv run ruff format app/              # format
```

### Web (`web/`)

```sh
npm run dev -w web       # run web standalone
npm run check -w web     # svelte-check + tsc
npm run lint -w web      # prettier + eslint (check only)
npm run format -w web    # prettier write
npm run test:unit -w web # vitest (node environment)
npm run test:e2e -w web  # playwright
npm run build -w web     # production build
```

## Architecture

```
pocui/
├── package.json              # npm workspaces root — start, install:all, build
├── api/app/main.py           # FastAPI — /api/health, /api/metrics
└── web/src/
    ├── app.css               # CSS custom properties (design tokens), no Tailwind utilities
    ├── routes/
    │   ├── +layout.svelte    # font imports, children render
    │   └── +page.svelte      # page composer — defines step data, renders Hero + ScrollStory
    └── lib/components/
        └── case-study/
            ├── Hero.svelte          # hero section (props: tagline, title, subtitle, features)
            ├── CycleDiagram.svelte  # reactive inline SVG diagram (props: activeNodeId, activeArcId)
            ├── StepCard.svelte      # step card with fade-in (props: step data + visible flag)
            └── ScrollStory.svelte   # orchestrator: sticky diagram, scroll observers, progress dots
```

The API has no database — `GET /api/metrics` returns stub data (Polars/pyarrow are installed for when you add real data wrangling).

## Styling approach

- **No Tailwind utilities** — all styling via CSS custom properties (`:root` in `app.css`), scoped `<style>` blocks, and inline styles
- Tailwind v4 is installed but unused; `@import 'tailwindcss'` remains in `app.css`
- Design tokens: `--color-cream`, `--color-ink`, `--color-accent`, `--color-muted`, `--ease-smooth`
- Typography: Inter Variable only (headings via weight 700 + size), JetBrains Mono for monospace

## Key library versions

- Svelte **5** (runes syntax: `$state`, `$props`, `$derived`, `$effect`)
- SvelteKit **2.57**, Vite **8**, TypeScript **6**
- Available UI libs (installed, not yet used): `layerchart`, `chart.js`, `@xyflow/svelte`, `@lucide/svelte`

## Component design

- All content via props — no shared data files, no cross-component imports (except ScrollStory importing its children)
- Components are intentionally loose-coupled for future redesign/swap-out
- Step data (`StepData[]` interface) defined in `+page.svelte`, flows down through props
