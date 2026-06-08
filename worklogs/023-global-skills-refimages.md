# 023 — Global Skills & Scoped Reference Images

Continuation of 022. Moved all ui-verify skills to global `~/.claude/skills/`, added filename-prefix scoping for reference images, and created the `progress-uiverify-step` process skill.

## Changes made

### 1. Scoped reference images by filename prefix

- **Convention**: `{scroll-target-key}_{description}.{ext}` — prefix before first `_` matched against `.ui-verify/active-target`
- Files without `_` are global (always included regardless of target)
- **active-target is mandatory** — hook throws `ERROR: no active target set` and blocks if the file is missing. No fallback/backwards-compat.
- Modified `.claude/hooks/ui-verify.mjs` (~lines 336-355): reads active-target key, filters reference images by prefix match before sending to Codex judge
- Renamed existing reference images: `sysdiagram-step0.png` → `step-zero_sysdiagram.png`, `sysdiagram-step2.png` → `step-two_sysdiagram.png`
- Added `step-three_sysdiagram.png` from user-provided reference image

### 2. Global skill installation

- Copied `ui-verify-init` skill from hookcyber `.claude/skills/` → `~/.claude/skills/ui-verify-init/` (global)
- Deleted hookcyber's local copy — skill now exists only globally
- Removed hookcyber's local `.claude/skills/ui-verify/` directory (contract format, scroll targets, skill index) — all knowledge moved to global skills

### 3. Created `progress-uiverify-step` global skill

New skill at `~/.claude/skills/progress-uiverify-step/` — the complete end-to-end process for reference-image-driven UI work:

| File | Lines | Purpose |
|---|---|---|
| `SKILL.md` | 35 | Process steps: parse target → set active-target → read reference image → start dev server → engineer changes → emit contract. Verdict authority rules. |
| `CONTRACT_FORMAT.md` | 59 | Contract block format, field rules, example, criteria tips, reference image naming convention, scroll-targets.json format |

**Key design decision**: this is a *process* skill, not a *reactive* skill. It teaches agents the full workflow of "make section X match its reference image" rather than just "emit a contract after UI changes." The hook fires automatically; the skill teaches how to drive it.

### 4. Updated `ui-verify-init` scaffolding

- Removed step 4 ("Copy Skill Files") — no per-project skill files deployed anymore
- Renumbered steps 5-10 → 4-9
- Step 9 (formerly 10): references `progress-uiverify-step` global skill instead of project-local `ui-verify`
- Deleted `ref/skill-files/` directory from init skill — templates no longer needed
- Updated SKILL.md "What Gets Created" to remove `.claude/skills/ui-verify/` from the list

### 5. Updated hookcyber CLAUDE.md

- Line 81: pointer changed from `.claude/skills/ui-verify/` (deleted) to `progress-uiverify-step` global skill

## Architecture after these changes

```
~/.claude/skills/
  progress-uiverify-step/     # Process skill (how to use the system)
    SKILL.md
    CONTRACT_FORMAT.md
  ui-verify-init/              # Scaffolding skill (how to set up the system)
    SKILL.md
    SCAFFOLDING.md
    ref/
      ui-verify.mjs            # Reference hook script
      config.example.json      # Example config

Per-project (deployed by init or manually):
  .claude/hooks/ui-verify.mjs  # Stop hook (screenshots + Codex judge)
  .claude/settings.local.json  # Hook registration
  .ui-verify/
    config.json                # devServerUrl, viewports, judge settings
    scroll-targets.json        # Key → CSS selector mapping
    active-target              # Current target key (REQUIRED)
    reference/                 # {target-key}_{desc}.{ext} images
    screenshots/               # Hook output (gitignored)
```

**Zero project-local skills required.** All knowledge lives in global skills; only infrastructure (hook, config, targets, images) is per-project.

## Design decisions

- **No backwards compatibility on active-target** — strict enforcement over silent fallback. Missing active-target = blocking error. Rationale: agents must declare what they're verifying; silent "include everything" masks workflow bugs.
- **Filename prefix over subdirectories** — simpler flat structure, one `ls` shows all references, prefix parsing is trivial
- **Process skill over reactive skill** — `progress-uiverify-step` teaches the complete workflow (set target → read reference → engineer → verify), not just "emit a contract." Agents can be pointed at a step and know exactly what to do.
- **Global skills only** — eliminates per-project skill file maintenance and drift. Init skill deploys infrastructure; global skills provide knowledge.

## Syncing global copies

After modifying the hook locally, the updated `ui-verify.mjs` was copied to `~/.claude/skills/ui-verify-init/ref/ui-verify.mjs`. This manual sync is required after hook changes — no automated mechanism yet.

## PR status

PR #5 (`tidy/generalise-codexverify`) is open with the initial portable system commit. These additional changes (scoped ref images, global skill restructuring) are uncommitted on the same branch.
