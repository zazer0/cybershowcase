# cybershowcase

A visual showcase for the **[Cyberclaw](https://github.com/zazer0/cyberclaw)**
autonomous agent system. The site presents a scroll-driven case study
("Overnight Engineering") that walks through Cyberclaw's self-orchestrating
loop — from user prompt, through autonomous coding and validation, to
guaranteed-correct output — rendered as an interactive 3D diagram.

Built with **Svelte 5 + SvelteKit**, **Threlte v8** (Three.js for Svelte), and
a lightweight **FastAPI** backend. Ships as source with a single `setup.sh`
script that installs everything locally.

## 1. Install (while online)

```sh
sh setup.sh
```

This installs:

- the frontend into `web/node_modules` — SvelteKit + Svelte 5, Threlte v8,
  Three.js, bundled fonts (`@fontsource-variable/inter`,
  `@fontsource/jetbrains-mono`), plus dev tooling (Playwright, Vitest, ESLint,
  Prettier);
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
cybershowcase/
├── setup.sh            # POSIX installer
├── web/                # SvelteKit (Svelte 5) + Threlte v8 — source only
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

## What is Cyberclaw?

[Cyberclaw](https://github.com/zazer0/cyberclaw) is an autonomous AI agent
system that self-orchestrates debugging and repair loops. This repo is the
**presentation layer** — a standalone site designed to explain and visualise how
Cyberclaw works, step by step.
