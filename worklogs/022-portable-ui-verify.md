# 022 — Portable UI Verify System

Extracted the hookcyber-specific UI verification loop into a generalised, repo-agnostic system composed of three portable pieces.

## What existed before

- **`ui-verify-subagent.mjs`** (296 lines) — Stop hook hardcoded to this repo: `/tmp/ccweb-verify` workdir, port 5173, direct `codex exec` call, separate `verdict.schema.json` file, absolute-only route URLs
- **CLAUDE.md lines 79–152** — contract format spec, enforcement rules, scroll-targets registry docs all inline
- **`verdict.schema.json`** — standalone file in `.claude/ui-verifier/`
- No project-level config file; all behaviour baked into the hook script

## What was built

### Piece 1: `ui-verify` skill (`.claude/skills/ui-verify/`)

Three-file progressive disclosure skill replacing the CLAUDE.md inline docs:

| File | Lines | Purpose |
|---|---|---|
| `SKILL.md` | 33 | Index — verdict authority, when to use, cross-refs |
| `CONTRACT_FORMAT.md` | 54 | Block format spec, field rules, example, criteria tips |
| `SCROLL_TARGETS.md` | 44 | Optional scroll registry (active-target + scroll-targets.json) |

All within skill-editing line limits (index ≤40, guides ≤60).

### Piece 2: Generalised hook (`.claude/hooks/ui-verify.mjs`)

Key generalisations over the old script:

- **`.ui-verify/config.json`** — new per-project config with `devServerUrl`, `screenshotWaitMs`, `defaultViewports`, `judge.model`, `judge.extraInstructions`, `judge.timeoutMs`, `navigationWaitUntil`, `playwrightLaunchOptions`, `workDir`
- **Zero-config defaults** — all fields optional; bare install works identical to old behaviour (port 5173, 500ms wait, networkidle, codex judge)
- **Embedded verdict schema** — the 39-line JSON schema is a constant in the script, written to workDir at runtime. Eliminates `.claude/ui-verifier/` file dependency
- **Relative route resolution** — contract routes like `/pricing` resolve against `config.devServerUrl`; agents no longer need to know the port
- **Graceful degradation** — `checkDependencies()` probes for playwright import, `codex` on PATH, and dev server reachability before any work. Missing deps → stderr warning + exit 0 (never blocks the agent)
- **Codex-only judge** — no backend abstraction layer; codex is the sole judge. Supports `judge.model` override and `judge.extraInstructions` for project-specific context

### Piece 3: `ui-verify-init` scaffolding skill (`.claude/skills/ui-verify-init/`)

A Claude Code skill (not a shell script) that bootstraps the system into any repo:

- `SKILL.md` (36 lines) — prerequisites, when to invoke
- `SCAFFOLDING.md` (48 lines) — 10-step idempotent process: detect package manager → ask dev server URL → copy hook + skill files → create config → register Stop hook in settings.local.json → gitignore entries → install playwright → verify codex → update CLAUDE.md
- `ref/` directory contains reference copies of all files (hook script, skill files, example config) that get copied into the target project

### Migration applied to hookcyber

- CLAUDE.md: 152 → 97 lines. Contract format/enforcement/registry docs replaced with one-liner pointing to skill. Project-specific scroll-target table + sentinel mapping preserved
- `settings.local.json`: hook path updated to `ui-verify.mjs`
- `.ui-verify/config.json` created with `devServerUrl: "http://localhost:5173"`
- Deleted: `ui-verify-subagent.mjs`, `.claude/ui-verifier/verdict.schema.json`

## Design decisions

- **Codex only** — no claude/command judge backends. Keeps the hook lean; avoids abstraction for theoretical alternatives
- **Build in hookcyber first** — refactor existing system in-place, test against the live project, extract to standalone repo later
- **Init as a skill, not a shell script** — skill can hold reference files in `ref/`, guides Claude through scaffolding interactively, leverages existing Claude Code tooling
- **`confirming-webui-edit` kept separate** — it's a different concern (per-change interactive agent-browser loop) from the automated end-of-turn judge gate. The ui-verify SKILL.md references it but doesn't bundle it

## File inventory

```
.claude/hooks/ui-verify.mjs                              # Generalised hook (NEW, replaces ui-verify-subagent.mjs)
.claude/skills/ui-verify/SKILL.md                        # Skill index
.claude/skills/ui-verify/CONTRACT_FORMAT.md              # Contract format guide
.claude/skills/ui-verify/SCROLL_TARGETS.md               # Scroll registry guide
.claude/skills/ui-verify-init/SKILL.md                   # Init skill index
.claude/skills/ui-verify-init/SCAFFOLDING.md             # 10-step scaffolding guide
.claude/skills/ui-verify-init/ref/ui-verify.mjs          # Reference hook copy
.claude/skills/ui-verify-init/ref/config.example.json    # Example config
.claude/skills/ui-verify-init/ref/skill-files/SKILL.md   # Reference skill copies
.claude/skills/ui-verify-init/ref/skill-files/CONTRACT_FORMAT.md
.claude/skills/ui-verify-init/ref/skill-files/SCROLL_TARGETS.md
.ui-verify/config.json                                   # Project config (NEW)
CLAUDE.md                                                # Trimmed (MODIFIED)
.claude/settings.local.json                              # Hook path updated (MODIFIED)
```

## Deleted

```
.claude/hooks/ui-verify-subagent.mjs                     # Old hardcoded hook
.claude/ui-verifier/verdict.schema.json                   # Old standalone schema
```

## Next steps

- End-to-end test: make a UI change, include contract, verify the full loop fires with the new hook
- Test zero-config: temporarily remove `.ui-verify/config.json`, confirm defaults work
- Test graceful degradation: verify missing codex/playwright warns and exits 0
- Extract to standalone GitHub repo for distribution to other projects
- Test init skill on a fresh Vite/React/Next project
