# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## What this is

**pocui** — a showcase project scaffold. A Svelte 5 + SvelteKit frontend and FastAPI backend pre-wired and ready to build against, intentionally shipped with no real UI code. Run `sh setup.sh` once (online) to install all deps.

## Dev servers

Two terminals required:

```sh
# API — http://localhost:8000
cd api && uv run fastapi dev app/main.py

# Web — http://localhost:5173
cd web && npm run dev
```

Vite proxies `/api/*` → `:8000`, so fetch calls in the browser go through the proxy without CORS issues.

## Commands

### API (`api/`)

```sh
uv run pytest                        # run all tests
uv run ruff check app/               # lint
uv run ruff format app/              # format
```

### Web (`web/`)

```sh
npm run check         # svelte-check + tsc
npm run lint          # prettier + eslint (check only)
npm run format        # prettier write
npm run test:unit     # vitest (node environment)
npm run test:e2e      # playwright
npm run build         # production build
```

## Architecture

```
pocui/
├── api/app/main.py       # FastAPI app — /api/health, /api/metrics
└── web/src/
    ├── app.css           # Tailwind v4 import + Inter font root
    ├── routes/
    │   ├── +layout.svelte   # font imports, children render
    │   └── +page.svelte     # single page — health-check status display
    └── lib/
        └── index.ts         # barrel for shared lib exports
```

The API has no database — `GET /api/metrics` returns stub data (Polars/pyarrow are installed for when you add real data wrangling).

## Key library versions

- Svelte **5** (runes syntax: `$state`, `$props`, `$derived`)
- SvelteKit **2.57**, Vite **8**, TypeScript **6**
- Tailwind **v4** (CSS-first config via `@import 'tailwindcss'`, no `tailwind.config.js`)
- Available UI libs (installed, not yet used): `layerchart`, `chart.js`, `@xyflow/svelte`, `@lucide/svelte`
- Optional shadcn-svelte: `npx shadcn-svelte@latest init` (requires network)

## Tailwind v4 note

v4 uses a CSS-first approach — configuration goes in `app.css` with `@theme`, not in a JS config file. No `tailwind.config.js` exists or is needed.
