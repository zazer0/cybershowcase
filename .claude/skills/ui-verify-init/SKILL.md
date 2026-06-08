---
name: ui-verify-init
description: Scaffolds the ui-verify automated visual verification system (Playwright + Codex judge) into a new project.
---

# UI Verify Init

Sets up the automated visual verification system: a Claude Code Stop hook that screenshots the running app with Playwright and sends images to Codex CLI for independent pass/fail judgment.

## Prerequisites

- Node.js project with a `package.json`
- `codex` CLI installed and on PATH
- A web dev server (Vite, Next, etc.)

## When to Use

User says "set up ui-verify", "add visual verification", "scaffold ui verification", or similar. MUST read [SCAFFOLDING.md](SCAFFOLDING.md) for the step-by-step process.

## What Gets Created

```
.claude/hooks/ui-verify.mjs          # Stop hook (screenshots + judge)
.claude/skills/ui-verify/            # Skill files (contract format docs)
  SKILL.md
  CONTRACT_FORMAT.md
  SCROLL_TARGETS.md
.ui-verify/
  config.json                        # Project config (dev server URL, etc.)
  reference/                         # Optional reference images
.claude/settings.local.json          # Hook registration (created/merged)
```

## Reference Files

All source files are in `ref/` alongside this skill. The scaffolding process copies them into the target project.
