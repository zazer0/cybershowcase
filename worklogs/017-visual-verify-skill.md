# 017 — Visual Verify-Fix Skill (Global)

## Goal

Extract the "agent-browser screenshot → evaluate → scoped fix agent → re-verify" pattern from this project into a reusable global skill, enforced across all web projects via global CLAUDE.md.

## What Was Created

### Skill: `~/.claude/skills/visual-verify-fix/SKILL.md`

- **Trigger**: MUST invoke after ANY web UI file change (.svelte, .tsx, .jsx, .vue, .css, .html) BEFORE proceeding to the next change — start the dev server if not already running
- **The loop**: change code → screenshot → evaluate → pass (proceed) or fail (delegate scoped fix agent → re-screenshot → re-evaluate)
- **Primary tool**: `agent-browser` (open, eval for scroll, screenshot, close)
- **Fallback**: Playwright via `webapp-testing` skill if agent-browser isn't installed
- **Key technique**: `agent-browser eval "document.querySelector('<sel>').scrollIntoView({block:'start'}); 'done'"` over `agent-browser scroll` for scroll-sentinel targets (reliability issue discovered during Step 2 work)
- **Anti-patterns documented**: skipping "small" changes, batching multiple changes, claiming correctness without reading screenshot, using unreliable `scroll` command
- **Line count**: 47 lines (within 50-line soft max per skill-editing guidelines)

### Global CLAUDE.md Addition

- 3 lines added under new `## Visual Verification on UI Changes` heading, before Agent Delegation section
- References the skill by name, enforces "no batching" rule
- Applies to all projects, not just this one

## Design Decisions

1. **Skill over hook**: A hook would auto-fire on every stop/tool-call — too aggressive and wasteful for non-UI changes. A skill gives control: invoked when doing UI work, skipped for backend/config/test-only changes.

2. **Single file, not progressive disclosure**: The pattern is simple enough (5 steps) to fit in one file under the 50-line soft max. No need for sub-guides.

3. **Description as enforcement**: The `description` field uses "MUST invoke" language so it appears as a strong directive in the skills list, not a suggestion. Iterated through 3 revisions:
   - v1: Descriptive ("After any web UI code change, screenshot...") — too passive
   - v2: Two sentences with "MUST" + "Do NOT batch" — too verbose
   - v3 (final): Single sentence with "MUST invoke... BEFORE proceeding... start dev server if needed" — concise, enforcing, not limited to already-running servers

4. **Global scope**: Placed in `~/.claude/skills/` (user-level) not project `.claude/skills/` so it applies to all web projects. Referenced in `~/.claude/CLAUDE.md` (global) not project CLAUDE.md.

## Origin Pattern

This skill codifies the orchestration pattern used throughout the Step 2 expansion work (worklogs 015-016):
- Each of 6 stages followed: delegate subagent → agent-browser screenshot → evaluate → fix if needed → commit
- This caught camera overflow/clipping issues incrementally (z=4.0 too close, z=5.4 too far) rather than discovering them at the end
- The automated QA judge (Codex CLI) as a final gate caught composition issues that manual checks missed — but the per-change agent-browser checks prevented most issues from reaching that gate

## Files Modified

| File | Location | Change |
|---|---|---|
| `SKILL.md` | `~/.claude/skills/visual-verify-fix/` | New skill (47 lines) |
| `CLAUDE.md` | `~/.claude/` | Added 3-line visual verification section |
