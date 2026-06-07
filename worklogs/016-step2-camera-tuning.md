# 016 — Step 2 Camera Tuning & Verification Pass

## Context

Continuation session for the Step 2 expansion view (`feat/expanded-step2`). The prior session (015) implemented all code — camera zoom, expanded ServerCard, substep highlights, column expansion — but the final UI verification had not yet returned a verdict. This session focused on getting the automated Codex QA judge to pass.

## What Happened

### Verification Failure: Card Too Small

- The Codex judge rejected the initial camera (`z=5.4, fov=46`) even with the 60/40 column expansion — card "remains relatively small with large empty margins"
- Root cause: at `distanceFactor=8` and `z=5.4`, the 340px card renders at ~503px effective width in an 864px column (58% fill) — not enough for "filling the majority"

### Camera Tuning Iterations

| Attempt | z | fov | y | Result |
|---|---|---|---|---|
| Original | 5.4 | 46 | -0.1 | Rejected: too small (58% fill) |
| #1 | 4.0 | 42 | -0.1 | Too close: card clips top/bottom |
| #2 | 4.5 | 44 | -0.1 | Slight clip at top/bottom |
| #3 | 4.8 | 44 | 0 | Marginal clip at "DEV VM" header |
| #4 | 5.0 | 42 | 0 | Slightly clips vertically |
| **#5 (final)** | **5.0** | **44** | **0** | **Passes — card fills viewport, all elements readable** |

### Key Fix: Centering the Camera Vertically

- The original `y=-0.1` shifted the camera view slightly below the card center, pushing the card upward in frame and clipping "DEV VM" at the top
- Setting `y=0` for both `position` and `lookAt` centers the card properly in the viewport
- Combined with `fov=44` (wider than 42) to provide enough vertical room for the full card

### Agent-Browser Scroll Discovery

- `agent-browser scroll <selector>` did not reliably reach scroll-sentinel targets
- Solution: `agent-browser eval "document.querySelector('<selector>').scrollIntoView({block: 'start'}); 'done'"` works consistently
- Added this as documentation in CLAUDE.md under "Agent-browser manual validation"

### Verification Hook Behavior

- The Stop hook runs on every assistant response, checks for `UI_VERIFICATION_CONTRACT` text
- On **fail**: hook blocks with error message listing failures (visible to assistant)
- On **pass**: hook exits silently (`process.exit(0)`) — no message shown
- This caused confusion: multiple re-submissions thinking the hook hadn't fired, when it had already passed
- **Lesson**: check `/tmp/ccweb-verify/verdict.json` timestamps and content to determine if the hook passed silently

## Files Changed (This Session)

| File | Change |
|---|---|
| `animationData.ts` | Camera: `z=5.4→5.0`, `fov=46→44`, `y=-0.1→0` |
| `CLAUDE.md` | Added agent-browser scroll tip with sentinel mapping |
| `worklogs/015-step2-expansion-view.md` | Committed (was untracked from prior session) |

## Commits (This Session)

- `509f772` — fix(diagram): final camera tuning for Step 2 viewport fill
- `326f54b` — docs: add Step 2 expansion view worklog

## Insights for Replication

1. **Silent pass vs. blocking fail**: The UI verification hook only surfaces failures. A silent response after submitting `UI_VERIFICATION_CONTRACT` means it passed. Always check `verdict.json` before re-submitting.

2. **Camera y-offset matters**: Even small vertical offsets (0.1 world units) cause visible clipping when the card fills most of the viewport. Center the camera on the card's origin unless there's a specific reason to offset.

3. **fov vs. z tradeoff**: Reducing z (closer) increases the card's pixel size via `distanceFactor` scaling, but also reduces the visible world area. Increasing fov (wider angle) shows more of the scene. The sweet spot was z=5.0/fov=44 — card large enough to "fill the majority" while showing all content without clipping.

4. **agent-browser scroll reliability**: The `scroll` command with CSS selectors is unreliable for elements deep in scroll containers. Use `eval` with `scrollIntoView` and wait 1.5-2s for spring animations to settle before screenshotting.

5. **Verification loop pattern**: Set up a cron loop (`/loop 5m`) to keep re-presenting the contract, but check the verdict file early to avoid unnecessary iterations. The hook's silent-pass behavior can waste cycles if you don't check.
