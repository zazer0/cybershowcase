# 021 — Lock Grid to 50/50

## Problem

After scrolling to Step 2 ("Diagnosis & Fix"), the diagram column appeared permanently expanded — taking up ~62% of the viewport instead of reverting to ~38% on other steps. The user wanted equal columns at all times.

## Root Cause

Three coordinated expansion systems fired at `activeStepIndex === 2`:

1. **Grid column swap** (`ScrollStory.svelte`) — `5fr 8fr` → `8fr 5fr` with 800ms CSS transition
2. **Camera zoom** (`DiagramScene.svelte`) — springs to `[3.0, 0, 5.0]` with tight FOV 44°
3. **ServerCard expansion** (`ServerCard.svelte`) — width 240→340px, substep detail revealed

The grid toggle (`class:grid-layout--expanded={activeStepIndex === 2}`) was reactive and technically correct, but the 800ms CSS transition combined with the IntersectionObserver's narrow trigger zone (`rootMargin: '-40% 0px -40% 0px'`) created a prolonged "stuck expanded" appearance when scrolling away from Step 2 at moderate speed.

## What Changed

**Single file**: `web/src/lib/components/case-study/ScrollStory.svelte`

| Change | Before | After |
|--------|--------|-------|
| Template (line 89) | `class:grid-layout--expanded={activeStepIndex === 2}` | Removed entirely |
| Grid columns | `grid-template-columns: 5fr 8fr` | `grid-template-columns: 1fr 1fr` |
| Column transition | `transition: grid-template-columns 800ms ...` | Removed |
| `.grid-layout--expanded` CSS rule | `grid-template-columns: 8fr 5fr` | Deleted entirely |

## What Stayed Unchanged

- **Camera zoom on Step 2** — still zooms into the server card (3D world-space, independent of CSS grid)
- **ServerCard expansion** — still widens 240→340px and reveals DIAGNOSE/PLAN/IMPLEMENT substeps
- **IntersectionObserver / step tracking** — `activeStepIndex` still drives card content, camera, and card expansion
- **Mobile layout** — unchanged, stacked cards below 1024px

## Key Insight

The grid expansion was the only one of the three systems that affected page layout. Camera zoom and ServerCard expansion are internal to the 3D canvas (Threlte `<HTML>` overlay) and don't push against the CSS grid. Removing just the grid expansion locks the layout while preserving the Step 2 storytelling zoom effect.

## Verification

- Screenshotted Steps 1, 2, and 3 via `agent-browser` — all show equal-width columns
- Step 2's expanded ServerCard fits within the 50% diagram column without clipping
- Scrolling away from Step 2 shows no lingering expansion or layout shift

## Files Modified

1. **`web/src/lib/components/case-study/ScrollStory.svelte`** — removed expand class, locked grid to `1fr 1fr`, deleted transition and expanded rule
