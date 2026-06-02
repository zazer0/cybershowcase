# cybershowcase

A pre-wired **Svelte 5 + SvelteKit** frontend and **FastAPI** backend, plus a
single POSIX shell script that installs every dependency locally so you can
build and iterate on the UI **offline** (e.g. on a flight).

The project ships as **source** (no `node_modules`, no `.venv` — `setup.sh`
builds those on your machine/platform). It deliberately contains **no real UI
code**: just a valid app shell with a basic text page. All the tooling and
libraries are pinned and ready for you to build against.

## 1. Install (while online)

```sh
sh setup.sh
```

This installs:

- the frontend into `web/node_modules` from the pinned `package.json` /
  `package-lock.json` — SvelteKit + Svelte 5, Tailwind v4, and the design /
  chart libraries: `layerchart`, `@lucide/svelte`, `chart.js`,
  `@xyflow/svelte`, plus bundled fonts (`@fontsource-variable/inter`,
  `@fontsource/jetbrains-mono`);
- dev/test tooling (Playwright, Vitest, ESLint, Prettier) and the Playwright
  Chromium binary;
- the backend into `api/.venv` from `api/requirements.txt` (FastAPI + Polars /
  pyarrow + pytest/httpx/ruff) via `uv`.

## 2. Run it (two terminals)

```sh
# Terminal 1 — API
cd api && uv run fastapi dev app/main.py        # http://localhost:8000

# Terminal 2 — web
cd web && npm run dev                            # http://localhost:5173
```

The web dev server proxies `/api` → `:8000`, so the page's health check goes
green once the API is up. Sample data is at `GET /api/metrics`.

## 3. Verify offline before you fly

Turn wifi **off**, then start both servers. If the page renders and the health
check works with no network, your caches are warm.

## Layout

```
hwverify/
├── setup.sh            # POSIX installer
├── web/                # SvelteKit (Svelte 5) + Tailwind v4 — source only
│   ├── package.json    # deps pinned; lockfile committed
│   └── src/
│       ├── routes/+page.svelte         # page composer — step data, Hero + ScrollStory
│       └── lib/components/case-study/
│           ├── Hero.svelte             # hero section
│           ├── ScrollStory.svelte      # orchestrator: sticky diagram, scroll observers
│           ├── StepCard.svelte         # step card with fade-in
│           ├── CycleDiagram3D.svelte   # 3D Threlte v8 diagram (Canvas + scene)
│           ├── DiagramScene.svelte     # scene layout, lighting, camera
│           ├── DiagramNode.svelte      # individual 3D node (MeshPhysicalMaterial, glow aura, Float)
│           ├── DiagramArc.svelte       # curved arc connecting nodes
│           ├── StepAnimations.svelte   # scroll-synced step animations (particles, data streams, scanning ring)
│           ├── diagramData.ts          # node/arc geometry and label data
│           └── animationData.ts        # per-step animation configuration
└── api/                # FastAPI
    ├── requirements.txt
    └── app/main.py     # /api/health + /api/metrics + CORS
```

## 3D Diagram (Threlte v8)

The home page features a **scroll-driven 3D interactive cycle diagram** built
with [Threlte v8](https://threlte.xyz) (a Three.js integration for Svelte 5).
It replaces the original SVG-based `CycleDiagram.svelte`.

Key features:

- **MeshPhysicalMaterial** nodes with emissive glow aura and `Float` animations
- **Spring-based transitions** for active/inactive node states
- **Scroll-synced step animations**: dispatch particles (Orchestrate), data
  stream (Coding Agent), scanning ring (Validator)
- All Threlte packages (`@threlte/core`, `@threlte/extras`, `@threlte/flex`,
  `@threlte/rapier`, `three`) are installed at root level

## Optional — shadcn-svelte components

Polished, accessible components (its `chart` component is powered by LayerChart).
Run this **online** before the flight — it answers a couple of prompts and
fetches component source into the repo (you can't add new ones offline):

```sh
cd web
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add button card chart table tabs badge dialog input label select separator sonner tooltip
```

## Notes

- Frontend libs bundle their own dependencies, so they work offline once
  installed. `@lucide/svelte` ships its icons in the package (unlike icon
  libraries that fetch on demand).
- Server-side static chart export (`plotly` + `kaleido`) is commented out in
  `api/requirements.txt` — uncomment if you want it.
- Versions are real, current resolves (Svelte 5.55, SvelteKit 2.57, Vite 8,
  Tailwind 4.2, TypeScript 6) captured at build time, not guesses.
