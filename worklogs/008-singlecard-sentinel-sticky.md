# 008 — Single-Card Visibility + Sentinel/Sticky Layout

**Branch:** `factory/threlte-system-diagram`
**Date:** 2024-06-04

## Problem

Two UX issues on the 3D Threlte system diagram page:

- **All 5 RHS step cards visible simultaneously** — cards faded in permanently on scroll, creating a long stacked column. Only the active step should be visible at any time.
- **LHS diagram too wide (60%), RHS cards too narrow (40%)** — the `3fr 2fr` grid gave the 3D diagram more space than it needed, while step card content was cramped.

## Root Cause

1. `fadeObserver` set `cardVisible[i] = true` one-way — cards never faded out once scrolled into view.
2. All 5 `StepCard` components rendered in normal document flow with `5rem` vertical spacing.
3. `grid-template-columns: 3fr 2fr` over-allocated space to the diagram column.
4. `.sticky-container` used `align-items: center`, centering the diagram in its oversized column.

## Approach: Sentinel/Sticky Overlay Pattern

Standard scrollytelling technique — invisible sentinel divs for scroll detection, sticky card container for display.

### How It Works

- **Sentinel divs** (`100vh` height each) sit in a `.steps-track` providing scroll height
- **Sticky card container** overlays the sentinels via CSS Grid overlap (same `grid-column: 1; grid-row: 1`)
- `IntersectionObserver` (`centerObserver`) watches sentinel divs to set `activeStepIndex`
- `{#key activeStepIndex}` remounts the `StepCard`, triggering a `@keyframes cardFadeIn` animation (700ms, opacity 0→1 + translateY 22px→0)
- `pointer-events: none` on sticky container, `auto` on card wrapper — sentinels remain scrollable underneath

### Mobile Preservation

Dual rendering paths toggled via CSS media queries:
- **`.mobile-cards`** — `display: block` below 1024px, traditional stacked cards with one-way fade-in (original behavior)
- **`.desktop-story`** — `display: none` below 1024px, sentinel/sticky pattern above 1024px

Separate element ref arrays: `mobileCardElements` for `fadeObserver`, `sentinelElements` for `centerObserver`.

## Changes Made (1 file)

### `ScrollStory.svelte`

**Script:**
- Renamed `cardElements` → `sentinelElements` (desktop sentinel refs)
- Added `mobileCardElements: HTMLDivElement[]` (mobile card refs)
- `centerObserver` observes `sentinelElements`; `fadeObserver` observes `mobileCardElements`
- Both observers remain independent — mobile path uses fade, desktop path uses center detection

**Template:**
- Right column split into `.mobile-cards` (stacked `{#each}` with `visible={cardVisible[i]}`) and `.desktop-story` (sentinel track + sticky single-card `{#key activeStepIndex}` block with `visible={true}`)

**CSS:**
- Grid ratio: `3fr 2fr` → `2fr 3fr` (40/60, diagram narrower, cards wider)
- `.sticky-container`: `align-items: center` → `flex-start`, padding `1.5rem 0.5rem 1.5rem 0` → `1.5rem 0.5rem 1.5rem 1.5rem`
- `.step-wrapper`: removed `max-width: 580px`
- Added `.mobile-cards` / `.desktop-story` display toggles
- Added `.steps-track` + `.sticky-card-container` grid overlap rules
- Added `.scroll-sentinel { height: 100vh }` (last child `50vh`)
- Added `.sticky-card-container { position: sticky; top: 0; height: 100vh; pointer-events: none }`
- Added `@keyframes cardFadeIn` (opacity + translateY, 700ms ease)

## Key Insight: CSS Grid Overlap for Scrollytelling

The sentinel track and sticky card container share `grid-column: 1; grid-row: 1` in a single-column CSS Grid. This causes them to overlap without absolute positioning. The sentinel track determines the grid cell height (5 × 100vh), and the sticky element sticks within that scroll range. This avoids the fragility of `position: absolute` + manual height matching.

## Key Insight: `{#key}` for Mount-Triggered Animation

Svelte's `{#key expr}` block destroys and recreates its children when `expr` changes. Combined with a CSS `@keyframes` animation on the wrapper, this gives a clean "fade in on step change" without managing transition state — the browser's animation system handles it on each DOM remount.

## Validation

Playwright browser screenshots at four viewports:

| Viewport | Result |
|----------|--------|
| 1440x900 | 40/60 split, diagram left-aligned, single card visible, crossfade on scroll |
| 1920x1080 | Cards fill wider RHS (~1060px card width), scales correctly |
| 1024x768 | Breakpoint edge — grid activates, sentinel/sticky works |
| 768x1024 | Mobile — left column hidden, stacked cards with original fade-in preserved |

DOM inspection confirmed `card-animate-wrapper` count = 1 at every scroll position (no double-card visibility).

## Reproduction Steps

1. Flip `grid-template-columns` from `3fr 2fr` to `2fr 3fr`
2. Change `.sticky-container` alignment to `flex-start` with left padding
3. Split right-column template into `.mobile-cards` (original stacked) and `.desktop-story` (sentinel/sticky)
4. Add invisible `.scroll-sentinel` divs (100vh each) in a `.steps-track`
5. Add `.sticky-card-container` overlapping sentinels via CSS Grid same-cell placement
6. Use `{#key activeStepIndex}` to remount StepCard with `@keyframes cardFadeIn`
7. Separate observer targets: `sentinelElements` for center detection, `mobileCardElements` for mobile fade
8. Toggle visibility via `@media (min-width: 1024px)` on `.mobile-cards` / `.desktop-story`
