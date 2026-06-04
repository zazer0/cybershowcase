# 007 — Full-Width Layout & Label Readability Fix

**Branch:** `factory/threlte-system-diagram`
**Commit:** `eb3e938` — `fix(3d-diagram): full-width layout and readable node labels`
**Date:** 2024-06-04

## Problem

The 3D Threlte system diagram page had two visual defects:

- **Layout capped at 960px centered** — on a 1440px screen 33% was wasted margin; on 1920px, 50% was empty background. The diagram and step-card timeline didn't fill the viewport.
- **Node labels unreadable** — the five HTML labels (Trigger, Orchestrate, Coding Agent, Validator, Resolution) rendered via Threlte's `<HTML transform sprite>` were garbled/overlapping at the constrained 448px canvas width. The `transform` prop caused labels to scale with 3D perspective, making them tiny.

## Root Cause

1. `.scroll-story { max-width: 960px; margin: 0 auto }` in `ScrollStory.svelte` hard-capped the entire section.
2. `grid-template-columns: 1fr 1fr` gave equal 50/50 width — diagram deserved more.
3. `<HTML transform sprite>` on `DiagramNode.svelte` rendered labels in CSS 3D space via `matrix3d()` transforms, where apparent pixel size = `fontSize / scaleFactor`. At 11px with the default distanceFactor, labels were ~0.275 scene units tall — unreadable when the canvas was small.
4. Threlte's internal `<Canvas>` div has `overflow: hidden` hardcoded, clipping labels near edges even though the wrapper had `overflow: visible`.

## Changes Made (3 files)

### `ScrollStory.svelte` — full-width layout
- Removed `max-width: 960px` and `margin: 0 auto`; set `width: 100%`
- Changed grid from `1fr 1fr` to `3fr 2fr` (60/40 diagram-heavy split)
- Added `padding-left: 1.5rem; padding-right: 2rem` to `.right-column` inside the 1024px media query
- Added `max-width: 580px` to `.step-wrapper` to prevent card text sprawl on ultra-wide displays

### `DiagramNode.svelte` — label readability
- Removed `transform` prop from `<HTML>` component — labels now render as fixed screen-space overlays positioned at 3D coordinates instead of scaling with perspective
- Increased `labelY` offsets: IO nodes `0.4 → 0.5`, regular nodes `0.52 → 0.65` to prevent sphere overlap
- Increased font-size `11px → 14px` and letter-spacing `0.08em → 0.1em`

### `CycleDiagram3D.svelte` — overflow fix
- Added `.canvas-wrapper :global(> div) { overflow: visible }` to override Threlte Canvas internal `overflow: hidden` that clipped edge labels

## Key Insight: Threlte HTML `transform` vs Screen-Space

- `<HTML transform sprite>` — labels exist in CSS 3D space, scale with camera distance/perspective. Good for labels that should feel "attached" to 3D objects at consistent world-unit size. Bad when canvas is small or labels need to stay readable at fixed pixel size.
- `<HTML sprite>` (no `transform`) — labels are screen-space overlays pinned to 3D positions. Fixed pixel size regardless of canvas dimensions or camera distance. Better for UI-style labels that must always be legible.

## Validation

Browser screenshots captured via Playwright at four viewports:

| Viewport | Result |
|----------|--------|
| 1440x900 | Full-width, 60/40 split, all 5 labels readable, no overlap |
| 1920x1080 | Fills viewport, cards don't stretch (580px cap), labels crisp |
| 1024x768 | Breakpoint edge — grid activates correctly, labels readable |
| 768x1024 | Mobile preserved — left column hidden, single-column cards |

## Reproduction Steps

1. Identify the `max-width` constraint on the scroll-story container
2. Remove it, switch grid to asymmetric split favoring the diagram
3. Add right-column padding and step-wrapper max-width for readability guardrails
4. Switch Threlte `<HTML>` from `transform sprite` to `sprite` only
5. Increase label font size and Y offsets to compensate for screen-space rendering
6. Override Threlte Canvas internal `overflow: hidden` with scoped `:global(> div)` rule
7. Validate with browser screenshots at 4 breakpoints (1920, 1440, 1024, 768)
