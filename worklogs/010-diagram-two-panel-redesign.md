# 010 — Diagram Two-Panel Redesign

## What Changed

Replaced the existing 5-node cycle diagram (Trigger → Orchestrate → Coding Agent → Validator → Resolution) with a two-panel system architecture diagram matching a reference screenshot: an **Agent card** on the left, a **dashed SSH arrow** in the center, and a **Server card** on the right. The Threlte v8 (Three.js) Canvas is fully preserved — the diagram still renders in 3D with HTML overlays layered over 3D glow meshes to appear flat/2D.

---

## Architecture

### Approach: 3D glow planes + HTML overlays
Each panel is a `PlaneGeometry` mesh (gold, transparent, spring-animated opacity) sitting at `z = -0.1` behind a Threlte `<HTML pointerEvents="none" center distanceFactor={8}>` overlay containing real DOM card markup. This gives crisp text and borders at any zoom while retaining the 3D glow/depth effect.

### Component hierarchy (unchanged wrappers, new internals)
```
+page.svelte                  ← step data (activeNodeId/activeArcId)
  └── ScrollStory.svelte       ← scroll IntersectionObserver (unchanged)
        └── CycleDiagram3D.svelte  ← Threlte Canvas (unchanged)
              └── DiagramScene.svelte  ← REWRITTEN
                    ├── AgentCard.svelte   ← NEW
                    ├── SSHArrow.svelte    ← NEW
                    └── ServerCard.svelte  ← NEW
```

---

## File-by-File Changes

### Rewritten
| File | What changed |
|------|-------------|
| `diagramData.ts` | `NodeData`/`ArcData` → `ElementData`/`ConnectionData`; `NODES`/`ARCS` → `ELEMENTS`/`CONNECTIONS`; 9 elements, 1 connection; utility fn signatures preserved |
| `animationData.ts` | 3 cycle animation types → single `ssh-flow`; `getSSHParticlePosition` linear lerp along arrow path |
| `DiagramScene.svelte` | Camera `z=7` → `z=10`; removed `{#each NODES/ARCS}` and I/O cylinders; now composes `<AgentCard>`, `<SSHArrow>`, `<ServerCard>` in T.Group wrappers |
| `__tests__/diagram-data.spec.ts` | Tests updated for new element/connection structure |
| `__tests__/animation-data.spec.ts` | Tests updated for ssh-flow animation helpers |

### Created
| File | Purpose |
|------|---------|
| `AgentCard.svelte` | Left panel: glow plane + HTML card with bullseye SVG icon, "CYBERCLAW" heading, dashed "orchestrator" sub-card, status bar (dots + "7/11"), "AGENT" label |
| `ServerCard.svelte` | Right panel: glow plane + HTML card with "DEV VM"/"ubuntu" header, three stacked items (CLI Agent solid gold border, automate_loop.sh/solution.sh dashed), "SERVER" label |
| `SSHArrow.svelte` | Center: 9 shared-geometry BoxGeometry dashes + sphere dot + ConeGeometry arrowhead + HTML "SSH"/"result" labels + 6 flow particles from animationData |

### Deleted
- `DiagramNode.svelte` — replaced by AgentCard + ServerCard
- `DiagramArc.svelte` — replaced by SSHArrow
- `StepAnimations.svelte` — particle logic folded into SSHArrow

### Modified
- `+page.svelte` — only `activeNodeId`/`activeArcId` values updated per step:
  - step-0: `agent` / `null`
  - step-1: `orchestrator` / `null`
  - step-2: `ssh` / `ssh-arrow`
  - step-3: `server` / `null`
  - success: `result` / `null`

### Unchanged
- `CycleDiagram3D.svelte`, `ScrollStory.svelte`, `StepCard.svelte`, `Hero.svelte`

---

## Key Implementation Patterns

- **Spring animation:** All glow/color transitions use `useTask` + `SPRING = 8` exponential smoothing (`current += (target - current) * SPRING * dt`, dt clamped to 0.1). ~550ms convergence.
- **Geometry sharing:** SSHArrow creates one `BoxGeometry` instance reused across all 9 dashes — no per-dash allocation. All geometries disposed in `onDestroy`.
- **`untrack()` for static geometry:** Not needed in new components since positions are passed as inline constants, not reactive props.
- **`lerpHexColor`:** Inlined in SSHArrow for `#cfcbc0` ↔ `#c9a227` color interpolation.
- **HTML overlay sizing:** `distanceFactor={8}` on `<HTML>` gives appropriate card scale at camera `z=10`.
- **Active state cascade:** AgentCard receives `isActive` when `activeNodeId === 'agent' || activeNodeId === 'orchestrator'` so it glows on both steps 0 and 1. ServerCard similarly active for both `server` and `result`.

---

## Scroll Step → Element Mapping

| Step | activeNodeId | activeArcId | What highlights |
|------|-------------|-------------|-----------------|
| 0 — User Input | `agent` | `null` | Agent card outer glow |
| 1 — Orchestration | `orchestrator` | `null` | Agent card + orchestrator sub-card dashed border turns gold |
| 2 — Diagnosis & Fix | `ssh` | `ssh-arrow` | SSH arrow turns gold, flow particles animate L→R, server card begins glow |
| 3 — Validation | `server` | `null` | Server card + CLI Agent/automate_loop/solution borders turn gold |
| 4 — Success | `result` | `null` | Server card remains active, "result" label appears below arrow |

---

## Responsive Behavior (unchanged)
- **Desktop (≥1024px):** 3D diagram visible in sticky left column, single card swaps on right.
- **Mobile (<1024px):** `.left-column { display: none }` — diagram intentionally hidden, stacked fade-in cards shown instead. Acceptance criteria for diagram appearance scoped to desktop viewport only.

---

## Verification
- `npm run test:unit -w web` — 31 tests pass (rewritten diagram-data + animation-data specs)
- `npm run check -w web` — 0 TypeScript errors
- UI verified via Stop hook at 1440×900: two-panel layout matches reference screenshot
