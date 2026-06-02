# 002 — Scroll-Driven Story Page Components

**Date:** 2026-06-03
**Branch:** main
**Commits:** 75dd6ec → 2cb7467 (6 commits)

## What We Built

Converted a single monolithic HTML file (hero + scroll-driven story page with sticky SVG diagram) into a modular Svelte 5 component system, replacing the scaffold home page.

## Architecture Decisions

- **No Tailwind** — all styling via CSS custom properties (`:root` in `app.css`), scoped `<style>` blocks, and inline styles. Tailwind remains installed but unused for this UI.
- **Fully modular components** — every component receives all content via props. No shared data files, no cross-component imports (except ScrollStory importing its direct children). Designed for later swap-out or heavy modification.
- **Data defined at page level** — the `StepData[]` array and its TypeScript interface live in `+page.svelte`, flowing down through props. This keeps components content-agnostic.
- **Inter Variable only** — no Merriweather/Plus Jakarta Sans. Heading hierarchy via weight (700) and size, not font family. JetBrains Mono for all monospace elements (labels, badges, transcripts).

## File Map

| File | Role |
|------|------|
| `web/src/app.css` | Design tokens: `--color-cream/ink/accent/muted`, `--ease-smooth`, `prefers-reduced-motion` |
| `web/src/routes/+page.svelte` | Page composer — defines all step data inline, renders Hero + ScrollStory |
| `web/src/lib/components/case-study/Hero.svelte` | Hero section: tagline, title, gold subtitle, 2-col feature grid, scroll hint |
| `web/src/lib/components/case-study/CycleDiagram.svelte` | Inline SVG: 3-node triangle cycle with arcs, IO elements, reactive highlights via `$derived` |
| `web/src/lib/components/case-study/StepCard.svelte` | Step card: header, skills badge, transcript box, success variant with stats row |
| `web/src/lib/components/case-study/ScrollStory.svelte` | Orchestrator: 2-col CSS grid, sticky diagram, progress dots, dual IntersectionObserver |

## Key Implementation Details

- **Scroll interaction** uses two `IntersectionObserver` instances in `ScrollStory.onMount`:
  - Center-band observer (`rootMargin: '-40% 0px -40% 0px'`) drives `activeStepIndex` → highlights diagram node/arc
  - Fade observer (`threshold: 0.1`) drives one-way `cardVisible[i]` → triggers card fade-in (never resets)
- **SVG reactivity** in CycleDiagram: `$derived` booleans per node/arc, conditional inline `style` and attribute binding for fill/stroke/filter. CSS transitions at 550ms with `var(--ease-smooth)`.
- **Card fade-in**: opacity 0 → 1 + translateY 22px → 0, transition 700ms with custom easing.
- **Responsive**: diagram column hidden below 1024px (`display: none` via media query), cards go full-width.
- **Accessibility**: `prefers-reduced-motion` in app.css disables all animations; SVG has `aria-label`.

## Svelte 5 Patterns Used

- `$props()` with inline TypeScript interfaces (no separate type files)
- `$state` for mutable scroll tracking (`activeStepIndex`, `cardVisible[]`)
- `$derived` for computed values (activeNodeId, activeArcId, stepLabel, per-node booleans)
- `$effect` for re-initializing `cardVisible` array when `steps.length` changes
- `class:name={condition}` directive for conditional CSS classes
- `bind:this={array[i]}` for collecting DOM refs for IntersectionObserver
- `{#each ... (key)}` with explicit keys on all loops
- Scoped `<style>` blocks (no global style leakage)

## Process Notes

- Used `svelte:svelte-file-editor` subagent for each .svelte file — it auto-validated via the Svelte MCP autofixer (caught missing `{#each}` keys).
- Committed after each component to maintain clean git history and isolate changes.
- The `@import 'tailwindcss'` line remains in app.css — removal deferred to avoid breaking other potential consumers.

## What's Next

- Browser-test the scroll interactions at various viewport sizes
- Consider extracting the `StepData` interface if multiple pages need it
- The component system is intentionally loose-coupled for future redesign/swap-out
