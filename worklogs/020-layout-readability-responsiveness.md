# 020 — Layout Rebalancing & Readability

## Problem

The two-column layout (3D diagram | text step card) had three issues:
- **At 100% zoom**: both diagram labels and text card content were too small to read comfortably
- **At 120% zoom**: the diagram column dominated horizontally, squishing the text panel
- **Diagram felt "freeform"**: no visual grounding — blended into the page without boundaries
- **iPad support requested**: original 1024px breakpoint excluded tablet portrait modes

## What Changed

### StepCard.svelte — Font size bumps
| Element | Before | After |
|---------|--------|-------|
| h3 heading | 1.25rem | 1.4rem |
| .description-text | 0.875rem | 1rem |
| .transcript-box | 11px | 12.5px |
| .step-tag / .name-tag | 9px | 10px |
| .stat-label | 8px | 9px |

### ScrollStory.svelte — Grid proportions
- Default: `2fr 3fr` (40/60) → `5fr 8fr` (~38/62) — gives text ~2% more room
- Expanded (Step 2): `3fr 2fr` → `8fr 5fr` — proportionally matched
- Text panel padding: `0 2rem` → `0 3rem`
- Diagram-area labels: step-label 9→10px, footer-label 8→9px

## What Was Attempted But Reverted

### Diagram containment border
- **Tried**: `border: 1px solid color-mix(...)` + `border-radius: 12px` + subtle background on `.diagram-3d-wrapper`
- **Why it failed**: Threlte `<HTML>` components render DOM elements via 3D-to-2D projection. These have fixed pixel widths (e.g. ServerCard is 240-340px) but their positions scale with the canvas. At viewports below ~1400px, the projected HTML elements extend past any CSS container boundary. A hard border makes this overflow visually obvious and broken.
- **Also tried**: background wash on `.left-column`, `border-right` separator — same problem; any visual boundary highlights the 3D overflow
- **Conclusion**: containment requires 3D-layer changes (responsive node sizing or camera FOV adjustment), not CSS

### Lower breakpoints (768px, 820px, 900px)
- **Tried**: lowering the two-column breakpoint from 1024px to 768px, then 900px
- **Why it failed**: the diagram's HTML overlays need ~550px+ horizontal space. At 900px with `2fr 3fr` (40%), diagram gets only 360px — nodes overflow into text column or get clipped by `overflow: clip`
- **`overflow: clip`**: prevents overlap but clips diagram content visibly. `overflow: hidden` breaks `position: sticky` entirely (diagram disappears)
- **Conclusion**: reverted to 1024px breakpoint. iPad landscape (1024px+) gets two-column; portrait gets mobile stacked layout. True tablet support requires responsive 3D scene changes.

## Key Technical Insights

### Threlte `<HTML>` overflow is inherent
- The `<HTML>` component positions DOM elements based on Three.js camera projection
- DOM element widths are fixed in CSS (e.g. ServerCard 240px collapsed, 340px expanded)
- When canvas narrows, 3D positions scale down but HTML element widths stay fixed
- Result: elements overlap and extend past canvas bounds at narrow widths
- This was always happening at 1024-1200px — invisible because page background was uniform

### CSS cannot constrain 3D HTML overlays
- `overflow: hidden` on column → breaks `position: sticky` (diagram vanishes)
- `overflow: clip` on column → clips without breaking sticky, but content is visually cropped
- Any visible boundary (border, background, separator) makes the overflow obvious
- Fix path: adjust camera FOV or node positions responsively in `DiagramScene.svelte`

### Breakpoint arithmetic
- Diagram needs ~550px to contain all HTML overlays
- At `5fr 8fr` (38%): needs viewport ≥ 550/0.38 ≈ 1447px
- At `2fr 3fr` (40%): needs viewport ≥ 550/0.4 = 1375px
- Below these widths, overflow is unavoidable without 3D changes

## Files Modified

1. **`web/src/lib/components/case-study/ScrollStory.svelte`** — grid proportions (`5fr 8fr`), text padding (`3rem`), label font bumps
2. **`web/src/lib/components/case-study/StepCard.svelte`** — heading, body, transcript, label font size bumps

## Verification Notes

- UI verification hook repeatedly failed on tablet viewports due to diagram overflow / containment issues
- Final passing contract verified at 1440x900 (desktop) and 390x844 (mobile)
- `agent-browser` daemon became unresponsive during concurrent calls; Playwright inline scripts were used as fallback throughout
