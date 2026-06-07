# 019 — Smooth Step 2 ServerCard Transition

## Problem

When scrolling to Step 2 ("Diagnosis & Fix"), the server card content **snapped** instantly while the camera zoomed smoothly. The camera uses a spring-based lerp (`CAMERA_SPRING = 4`, exponential ease over ~0.5-1s in `DiagramScene.svelte`), but the card's content was swapped via `{#if isExpanded}/{:else}` — a full DOM destroy/recreate in a single frame.

Two distinct visual breaks:
- **Card width**: jumped 240px → 340px instantly (no CSS transition)
- **Content**: entire DOM tree swapped — collapsed items destroyed, expanded items created — with no fade, scale, or height animation

## Root Cause

- `ServerCard.svelte` line 10: `let isExpanded = $derived(activeStepIndex === 2)` — boolean flips in one frame
- Lines 87-140: `{#if isExpanded}...{:else}...{/if}` renders two completely different DOM structures; Svelte destroys one and creates the other instantly
- The `.server-card--expanded` class override (width/padding/gap) had no `transition` property on the base `.server-card`

The scroll trigger (`ScrollStory.svelte` IntersectionObserver with `rootMargin: '-40% 0px -40% 0px'`) fires `activeStepIndex = 2` in a single tick — propagating instantly to the derived boolean.

## Solution

**Single file changed**: `web/src/lib/components/case-study/ServerCard.svelte`

### Template refactor
Replaced `{#if}/{:else}` with a single always-rendered structure containing both states:
- `.expanded-content` wrapper (arrow, loop-container, solution.sh) with `class:expanded-content--visible={isExpanded}`
- `.collapsed-content` wrapper (simple list items) with `class:collapsed-content--hidden={isExpanded}`
- CLI Agent item always rendered, active state: `class:item--active={isExpanded || activeNodeId === 'server'}`

### CSS transitions added
- **Card width/padding/gap**: `transition: 700ms cubic-bezier(0.25, 0.1, 0.25, 1)` on `.server-card`
- **Expanded content**: `grid-template-rows: 0fr → 1fr` for height + `opacity: 0 → 1` + `transform: scale(0.96) → scale(1)` with 600ms + 100ms delay
- **Collapsed content**: inverse — `grid-template-rows: 1fr → 0fr` + `opacity: 1 → 0` at 400ms (no delay, clears first)
- Inner wrappers (`.expanded-inner`, `.collapsed-inner`) with `min-height: 0; overflow: hidden` for the `grid-template-rows` trick to work

### Timing rationale
- **700ms** card — matches the 800ms grid-template-columns transition in `ScrollStory.svelte` and aligns with the camera spring (~85% settled at 0.5s)
- **400ms** collapsed fade-out — clears before expanded content appears
- **600ms + 100ms delay** expanded fade-in — lets width start expanding before content appears

## Key Technique: `grid-template-rows` height animation

CSS cannot animate `height: auto`. The workaround:
```css
.wrapper { display: grid; grid-template-rows: 0fr; overflow: hidden; }
.wrapper--open { grid-template-rows: 1fr; }
.wrapper > .inner { min-height: 0; overflow: hidden; }
```
This animates height from 0 to natural content height smoothly. Both expanded and collapsed wrappers use this pattern.

## Edge cases handled
- **Scroll back** (Step 2 → Step 1): CSS transitions reverse naturally from current position
- **Rapid scroll**: transitions interrupt mid-animation, no janky restart
- **Initial load**: `isExpanded` is false, expanded content starts at `grid-template-rows: 0fr; opacity: 0`
- **substepGlow**: `getSubstepGlow()` already returns 0 when `!isExpanded` — no change needed

## Replication notes
- The `isExpanded` derivation (`$derived(activeStepIndex === 2)`) is unchanged — it still flips instantly, but now drives CSS class toggles instead of DOM swaps
- No changes to other files — camera spring, scroll observer, grid layout all untouched
- This pattern (always-render + CSS transition vs. `{#if}` swap) applies to any similar card that needs animated expand/collapse
