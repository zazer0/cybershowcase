# 015 — Step 2 Expansion View (Camera Zoom + automate_loop Detail)

## Goal

Implement the Step 2 ("Diagnosis & Fix") expansion view per `VISUALS_SPECIFICATION.md`: when the user scrolls to Step 2, the camera zooms into the Server card, the card expands to show the 3-stage DIAGNOSE → PLAN → IMPLEMENT workflow inside `automate_loop.sh`, and the substeps highlight sequentially in a continuous loop.

## What Changed

### Stage 1: Camera Config Data (`animationData.ts`)

- Added `CameraConfig` interface (`position`, `lookAt`, `fov`) and two presets:
  - `DEFAULT_CAMERA`: `[0, 0, 10]`, fov 60 (full system view)
  - `STEP2_CAMERA`: `[3.0, -0.1, 5.4]`, fov 46 (zoomed to server card)
- Added `getCameraConfig(stepIndex)` — returns `STEP2_CAMERA` for step 2, default otherwise
- Added substep animation helpers: `getSubstepGlow(substepIndex, time)` cycles through 3 substeps on a 4-second loop, returning a sine-based 0→1 intensity per substep
- Tests added to `animation-data.spec.ts` — all 39 tests pass

### Stage 2: Prop Threading (`ScrollStory → CycleDiagram3D → DiagramScene → ServerCard`)

- Threaded `activeStepIndex` (already existed as `$state(0)` in ScrollStory) down the full component chain as a new prop
- Changed Step 2's `activeNodeId` from `'ssh'` to `'server'` in `+page.svelte` — this activates the ServerCard glow/borders while `activeArcId: 'ssh-arrow'` keeps the SSH arrow active
- Added `isExpanded = $derived(activeStepIndex === 2)` in ServerCard

### Stage 3: Spring-Animated Camera (`DiagramScene.svelte`)

- Replaced static `T.PerspectiveCamera` at `[0, 0, 10]` with spring-animated camera
- `useTask` callback interpolates position, lookAt, and fov toward `getCameraConfig(activeStepIndex)` target
- `CAMERA_SPRING = 4` (deliberately slower than glow spring of 8) for ~700-800ms transition per spec
- Camera ref captured via `oncreate` callback; `updateProjectionMatrix()` called after fov changes

### Stage 4: Expanded Detail View (`ServerCard.svelte`)

- Added `{#if isExpanded}` / `{:else}` conditional rendering in the HTML overlay
- Expanded view shows:
  - "DEV VM" / "ubuntu@cyberclaw-dev" header row
  - "CLI Agent" box with gold border + down arrow indicator (▾)
  - "automate_loop.sh" dashed container with bold header
  - Three substep boxes in a flex row: "1. DIAGNOSE", "2. PLAN", "3. IMPLEMENT" with subtitle text
  - Arrow indicators (▸) between substep boxes
  - "solution.sh · validate progress" dashed box below
- Collapsed view (all other steps): unchanged — original compact layout
- Expanded card width: 340px (tuned from initial 380px to avoid overflow at zoom distance)

### Stage 5: Sequential Highlight Animation (`ServerCard.svelte`)

- Time accumulator (`substepTime`) advances only when `isExpanded`
- Each substep's border-color lerps from muted (#cfcbc0) to gold (#c9a227) via `lerpColor()` helper
- Background gets gold tint (`rgba(201, 162, 39, glow * 0.08)`) proportional to glow intensity
- Cycle: DIAGNOSE ~1.3s → PLAN ~1.3s → IMPLEMENT ~1.3s → repeat
- Uses Svelte 5 `style:` directive for dynamic inline styles

### Stage 6: Column Expansion (`ScrollStory.svelte`)

- Grid layout transitions from `2fr 3fr` (40/60 split) to `3fr 2fr` (60/40 split) when Step 2 is active
- Smooth CSS transition: `transition: grid-template-columns 800ms cubic-bezier(0.25, 0.1, 0.25, 1)`
- Gives the diagram canvas ~60% viewport width so the zoomed card fills the primary view
- Toggled via `class:grid-layout--expanded={activeStepIndex === 2}`

## Camera Tuning Journey

Finding the right zoom required several iterations:
- `z=5.5, fov=50` — verification judge rejected as "too small" (card didn't dominate the viewport)
- `z=4.0, fov=45` — way too close, card overflowed and clipped on all sides
- `z=4.8, fov=48` — still clipped at top-left ("DEV VM" cut off)
- `z=5.0, fov=46` — still clipped slightly
- `z=5.4, fov=46, y=-0.1` — correct framing, but still rejected because left column was only 40% of viewport
- **Fix**: expanded left column to 60% via CSS grid change, keeping `z=5.4, fov=46`

**Key insight**: The camera zoom alone couldn't make the card "fill the viewport" because the 3D canvas was confined to a 40%-width CSS column. The fix required both camera zoom (3D layer) AND column expansion (layout layer). The `VISUALS_SPECIFICATION.md` describes the server card filling the viewport, but the two-column scroll story layout means this requires coordinated 3D + CSS changes.

## Files Modified

| File | Change |
|---|---|
| `animationData.ts` | Camera configs, substep glow helpers |
| `animation-data.spec.ts` | Tests for camera + glow functions |
| `ScrollStory.svelte` | Pass `activeStepIndex`, column expansion CSS |
| `CycleDiagram3D.svelte` | Thread `activeStepIndex` prop |
| `DiagramScene.svelte` | Spring-animated camera |
| `+page.svelte` | Step 2 `activeNodeId: 'server'` |
| `ServerCard.svelte` | Expanded detail view + highlight animation |

## Orchestration Pattern

Each stage followed: **delegate subagent → agent-browser visual verify → fix if needed → commit**. This caught the camera overflow/clipping issues incrementally rather than at the end. The verification hook (Codex CLI judge) caught the layout/composition issue that manual agent-browser checks had accepted, demonstrating the value of automated QA as a final gate.

## Key Insights for Replication

1. **Camera zoom ≠ viewport dominance**: In a multi-column layout, camera zoom is bounded by the canvas container width. Match camera zoom with layout expansion for the full effect.

2. **HTML overlay sizing at zoom**: Threlte's `distanceFactor` scales HTML overlays by camera distance. At closer zoom (z=5.4 vs z=10), the same 380px card appears ~1.5x larger. Reduce card width accordingly to prevent overflow.

3. **Spring constant tuning**: `CAMERA_SPRING = 4` (vs glow spring of 8) gives ~700-800ms transitions. Camera movement should feel slower/smoother than element highlights.

4. **activeNodeId vs activeStepIndex**: `activeNodeId` drives which card glows (existing pattern). `activeStepIndex` drives view-mode changes (new concept). Step 2 sets `activeNodeId: 'server'` (card glows) AND uses `activeStepIndex === 2` (camera zooms, card expands). These are independent concerns.

5. **CSS grid transitions**: `grid-template-columns` is animatable with CSS transitions. The 800ms cubic-bezier matches the camera spring timing for a coordinated expansion effect.

6. **Verification hook composition awareness**: The automated judge compares against the reference image holistically. A "too small" card that's technically correct in isolation fails because the judge sees the full viewport composition. Always consider what percentage of the screenshot your target element occupies.
