# Scaffolding Steps

Execute in order. Each step is idempotent — check before creating.

## 1. Detect Package Manager

Check lockfiles: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock`/`bun.lockb` → bun, else npm.

## 2. Ask Dev Server URL

Ask the user: "What is your dev server URL? Default: `http://localhost:5173`"

## 3. Copy Hook Script

Copy `ref/ui-verify.mjs` → `.claude/hooks/ui-verify.mjs`

## 4. Copy Skill Files

Copy all files from `ref/skill-files/` → `.claude/skills/ui-verify/`

## 5. Create Config

Write `.ui-verify/config.json`: `{ "devServerUrl": "<answer from step 2>" }`
Create `.ui-verify/reference/` directory (empty).

## 6. Register Hook

Create or merge `.claude/settings.local.json`:
```json
{ "hooks": { "Stop": [{ "hooks": [{ "type": "command", "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/ui-verify.mjs", "timeout": 240, "statusMessage": "Verifying UI..." }] }] } }
```
If file exists, merge — do not overwrite other settings.

## 7. Gitignore

Append to `.gitignore` (if not already present): `.ui-verify/screenshots/` and `.ui-verify/active-target`

## 8. Install Playwright

Run: `$PM add -D playwright && npx playwright install chromium`

## 9. Verify Codex

Run `which codex`. If missing, warn: "codex CLI not found — install before verification will work."

## 10. Update CLAUDE.md

Add: "This project uses the `ui-verify` skill for automated visual verification."
