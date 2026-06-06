# 014 — Agent Browser + Verification Hook Fixes

## Goal

Compact the 3D system diagram to match a reference screenshot, using the Vercel Agent Browser CLI as a mandatory visual check between each file change. Fix the existing UI verification hook so it properly scrolls to the diagram area.

## What Changed

### Agent Browser Setup (Stage 0)

- Installed `agent-browser@0.27.0` globally via `npm install -g agent-browser`
- Ran `agent-browser install` to download Chrome 149 for Testing (~171 MB) to `~/.agent-browser/browsers/`
- Validated with: `agent-browser open <url>` → `agent-browser scroll down 600` → `agent-browser screenshot <path>` → `agent-browser close`
- This provides a headless-Chrome CLI for taking screenshots between code changes — independent of the Playwright-based stop hook

### Diagram Compaction (Stages 1–5)

Five files changed, each followed by an agent-browser screenshot check:

| Stage | File | Change |
|---|---|---|
| 1 | `DiagramScene.svelte` | Card group positions ±3.0 → ±2.0 |
| 2 | `SSHArrow.svelte` | Arrow endpoints ±1.5 → ±1.0, dashes 4→3, dash width 0.35→0.30, inset 0.35→0.25 |
| 3 | `animationData.ts` | Particle start/end ±1.5 → ±1.0 |
| 4 | `diagramData.ts` | Static data x-positions from ±3.0 → ±2.0 (7 elements) |
| 5 | `diagram-data.spec.ts` | Test assertions updated to match new positions |

All 31 unit tests pass after changes.

### Verification Hook Fix (discovered during Stage 6)

**Problem:** The stop hook (`ui-verify-subagent.mjs`) uses a scroll-targets registry to scroll Playwright to the correct page section before screenshotting. Two issues:

1. **`scroll-targets.json` didn't exist** — the hook's `loadScrollTarget()` returned `null`, falling back to `>> .selector` from the contract route (or no scroll at all)
2. **Registry value format was wrong on first attempt** — the hook accesses `registryTarget.scrollTo` (line 83–84), so registry values must be objects like `{ "scrollTo": ".selector" }`, not bare strings

**Fix:** Created `.ui-verify/scroll-targets.json` with correct object format:

```json
{
  "first-load": { "scrollTo": null },
  "step-zero": { "scrollTo": ".scroll-story .scroll-sentinel:nth-child(1)" },
  "step-one": { "scrollTo": ".scroll-story .scroll-sentinel:nth-child(2)" },
  ...
  "bottom": { "scrollTo": "__BOTTOM__" }
}
```

The active target is set by writing a key name to `.ui-verify/active-target` (e.g. `step-zero`).

**Mobile viewport caveat:** The 3D diagram is `display: none` below 1024px (by design in `ScrollStory.svelte`). Verification contracts for diagram work should use only `1440x900`, not the default dual-viewport.

### Project Config Updates

- **CLAUDE.md** — added `## Browser verification` section requiring `agent-browser` installation before any UI work
- **`.claude/skills/agent-browser/SKILL.md`** — created skill stub so other Claude Code sessions auto-discover agent-browser with usage patterns and allowed-tools config
- **`.ui-verify/scroll-targets.json`** — created with correct `{ "scrollTo": "<selector>" }` object format for all step targets
- **`.ui-verify/active-target`** — set to `step-zero` for current work

## Remaining Work

- The verification judge flagged that the SSH arrow's **dot and arrowhead are too small** to be clearly visible at the new compact scale — needs size increase in `SSHArrow.svelte` (dot geometry radius, cone geometry dimensions)
- After fixing, re-run verification contract with desktop-only viewport

## Key Insights for Replication

1. **Agent-browser as intermediate check:** `npm install -g agent-browser && agent-browser install` gives you a standalone browser CLI. Use `open` → `scroll` → `screenshot` → `close` as a fast visual sanity check between file changes — cheaper than triggering the full stop-hook pipeline each time.

2. **Stop hook scroll-targets format:** Values in `scroll-targets.json` must be `{ "scrollTo": "<selector>" }` objects, not bare selector strings. The hook reads `registryTarget.scrollTo` on line 83 of `ui-verify-subagent.mjs`.

3. **Granular change + check cadence:** Each UI file change gets its own agent-browser screenshot before proceeding. This catches regressions incrementally rather than debugging a batch of 5 file changes.

4. **Selectors for scroll positions:** The scroll sentinels are `.scroll-story .scroll-sentinel:nth-child(N)` where N=1 is step-zero, N=2 is step-one, etc. These are invisible full-height divs in the right column whose IntersectionObserver triggers drive `activeStepIndex`.

5. **Subagent delegation pattern:** Each stage delegated to a `typescript-fullstack-engineer` subagent with exact line numbers and old→new values. The orchestrator only runs agent-browser checks and reviews screenshots — never edits files directly.
