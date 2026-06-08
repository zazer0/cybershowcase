# 024 — Agent-Browser Migration

Replaced Playwright with `agent-browser` CLI in the ui-verify Stop hook. Fixes a crash caused by Playwright's `waitForSelector` timing out on invisible scroll sentinel elements, and simplifies the screenshot pipeline.

## Problem

- Hook crashed with unhandled `TimeoutError` at `ui-verify.mjs:189` when Playwright's `waitForSelector` couldn't find `.scroll-story .scroll-sentinel:nth-child(4)` within 10s
- **Root cause 1**: `waitForSelector` defaults to `state: 'visible'`, but scroll sentinels are empty layout `<div>`s — invisible by design (used for IntersectionObserver). At base CSS, `.desktop-story { display: none }` hides them entirely; only `@media (min-width: 1024px)` reveals them. If the agent's code changes caused a Vite compile error, sentinels wouldn't exist in the DOM at all.
- **Root cause 2**: No try/catch around the scroll logic — `waitForSelector` throws, crashing the entire hook. Agent receives a cryptic stack trace instead of a useful verdict.

## Solution: Switch to agent-browser

`agent-browser` is a CLI browser automation tool using CDP (Chrome DevTools Protocol), already installed at `/Users/cazer/.config/nvm/versions/node/v23.7.0/bin/agent-browser`. Key advantages:
- `scrollintoview <selector>` handles wait + scroll in one command — replaces the fragile 3-step chain (`waitForSelector` → `page.$()` → `scrollIntoViewIfNeeded()`)
- CLI commands return non-zero exit codes on failure, trivially caught with try/catch around `execFileSync`
- No Playwright dependency required in the hook
- Session isolation via `--session ui-verify-${process.pid}`

## Changes made

### 1. `.claude/hooks/ui-verify.mjs` — core rewrite

- **`CONFIG_DEFAULTS`**: removed `navigationWaitUntil` and `playwrightLaunchOptions` (Playwright-specific, no longer applicable)
- **`checkDependencies`**: replaced `await import("playwright")` check with `which agent-browser`
- **`captureScreenshots`**: complete rewrite from Playwright Node.js API to `execFileSync` calls:
  - New `ab()` helper wraps `execFileSync("agent-browser", [...args, "--session", session])` with 30s timeout
  - Flow per route × viewport: `open <url>` → `set viewport <w> <h>` → `wait --load networkidle` → `scrollintoview <selector>` (try/catch) → `wait <ms>` → `screenshot <path>`
  - try/catch around scroll: if selector fails, takes screenshot of current view (error overlay, blank page) — Codex judge sees the broken state and reports meaningful failures
  - `finally` block ensures `agent-browser close --session` always runs
  - Function is now synchronous (was async due to Playwright's API)

### 2. `~/.claude/skills/ui-verify-init/ref/ui-verify.mjs` — synced copy

Updated to match the modified hook.

### 3. `~/.claude/skills/ui-verify-init/SCAFFOLDING.md` — step 7

- **Before**: "Install Playwright" — `$PM add -D playwright && npx playwright install chromium`
- **After**: "Check agent-browser" — `which agent-browser`, warn if missing with install instructions (`npm i -g agent-browser && agent-browser install`)

## Key design decisions

- **`execFileSync` over `execSync`**: avoids shell injection if URL or selector contains special characters
- **Session isolation**: `ui-verify-${process.pid}` prevents interference with any concurrent agent-browser session the user might have open
- **Graceful scroll failure**: screenshot is always taken, even when scroll target is missing. The Codex judge receives the broken-state screenshot and reports a FAIL with useful context — far better than crashing the hook with no verdict.
- **`finally` cleanup**: browser session is always closed, even if screenshot capture throws mid-loop

## Reference image update (pre-migration)

- Replaced `.ui-verify/reference/step-three_sysdiagram.png` with new reference showing SSH connection from Cyberclaw orchestrator to Dev VM (CLI Agent, automate_loop.sh, solution.sh with teal fill)

## Verification steps

1. `echo "step-three" > .ui-verify/active-target`
2. Start dev server: `npm run dev -w web`
3. Trigger hook via contract emission — confirm screenshots captured at correct scroll position
4. Test with bogus selector — confirm graceful fallback (screenshot of current view, no crash)
5. Confirm `agent-browser close --session ui-verify-*` cleans up
