# 009 — Stop Hook UI Verify

## What We Did

### Problem
- `ui-verify-subagent.mjs` was registered under the `SubagentStop` event in `.claude/settings.local.json`
- Hook was silently not firing — `SubagentStop` does **not** provide `last_assistant_message` in its stdin payload, which the script requires to parse the `UI_VERIFICATION_CONTRACT` block
- Root cause: wrong hook event for the intended trigger point

### Fix
- Changed hook event from `SubagentStop` → **`Stop`**
- `Stop` fires when the main Claude session ends its turn and **does** provide `last_assistant_message` in stdin
- Removed the empty `matcher: ""` (not needed on lifecycle events like `Stop`)
- Added `statusMessage: "Verifying UI..."` so the spinner shows feedback while the hook runs
- Validated JSON structure with `jq -e` to confirm schema is correct

### How the Hook Works
1. Claude ends a turn with a `UI_VERIFICATION_CONTRACT` block in the final message
2. `Stop` event fires → Claude Code pipes the session context (including `last_assistant_message`) as JSON to stdin
3. Script parses the contract block: extracts `task`, `routes`, `viewports`, `acceptance`
4. Playwright launches headless Chromium, screenshots each route/viewport combo (with optional `>> .css-selector` scroll targeting)
5. Screenshots are persisted to `.ui-verify/screenshots/` with 4-digit sequential prefix
6. If `.ui-verify/reference/` images exist, they're prepended as reference targets for Codex
7. Codex CLI is invoked with `--output-schema verdict.schema.json` — returns structured `{ pass, summary, failures[] }`
8. If `pass: false` → hook outputs `{ decision: "block", reason: "..." }` to stdout → Claude is forced back to fix failures
9. If `pass: true` → script exits 0 → Claude turn completes normally

### Contract Format (Claude must output this to trigger verification)
```
UI_VERIFICATION_CONTRACT
task: <one-line description>
routes:
  - http://localhost:5173/
  - http://localhost:5173/ >> .scroll-story
viewports:
  - 1440x900
  - 390x844
acceptance:
  - <visually verifiable criterion>
  - <another criterion>
```

### Key Files
| Path | Purpose |
|------|---------|
| `.claude/hooks/ui-verify-subagent.mjs` | Hook script (Playwright + Codex) |
| `.claude/settings.local.json` | Hook registration (`Stop` event, 240s timeout) |
| `.claude/ui-verifier/verdict.schema.json` | JSON schema Codex must conform to |
| `.ui-verify/screenshots/` | Persisted screenshots (auto-created) |
| `.ui-verify/reference/` | Optional reference images for visual diffing |

### Gotchas for Replication
- `Stop` event is what carries `last_assistant_message` — not `SubagentStop`, `PostToolUse`, etc.
- `${CLAUDE_PROJECT_DIR}` must be set in the Claude Code environment; it resolves to the project root
- `codex` CLI must be installed and on PATH for the verification step; Playwright (`chromium`) must also be installed (`npx playwright install chromium`)
- Dev server must be running on the expected port when the hook fires, or screenshots will be blank/error
- Hook timeout is 240s — Playwright + Codex can take ~60–120s on cold start
- `settings.local.json` is gitignored — each engineer must configure their own local copy
- After editing `settings.local.json`, open `/hooks` in Claude Code or restart the session to reload config
