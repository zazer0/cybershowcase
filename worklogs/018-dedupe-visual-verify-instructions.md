# 018 — Deduplicate Visual Verification Instructions

## Context

A global `visual-verify-fix` skill was added to `~/.claude/skills/` covering the full agent-browser visual verification workflow (screenshot every UI change, eval+scrollIntoView technique, wait times, anti-patterns). The project CLAUDE.md and a project-level `agent-browser` skill both contained overlapping/duplicated versions of this guidance.

## Problem

Three layers of duplication existed:

| Instruction | Global CLAUDE.md | Global skill: visual-verify-fix | Project CLAUDE.md | Project skill: agent-browser |
|---|---|---|---|---|
| "Screenshot every UI change" | ✓ | ✓ | ✓ | — |
| agent-browser CLI workflow | — | ✓ | — | ✓ |
| eval+scrollIntoView technique | — | ✓ | ✓ | — |
| "Wait 1.5-2s for animations" | — | ✓ | ✓ | — |
| "agent-browser scroll unreliable" | — | ✓ | ✓ | — |

Additionally, the project `agent-browser` skill contained a contradictory `agent-browser scroll down 600` example — directly conflicting with both the global skill and project CLAUDE.md which warn that `agent-browser scroll` is unreliable for scroll sentinels.

## Changes Made

### Stage 1: Trim project CLAUDE.md (`fb75242`)

- **Removed** the "Browser verification" section (generic "install agent-browser, screenshot between changes" instruction) — fully covered by global CLAUDE.md → `visual-verify-fix` skill invocation.
- **Trimmed** "Agent-browser manual validation" subsection to retain only:
  - Project-specific sentinel nth-child mapping (Step 0–Output)
  - The concrete `scrollIntoView` example with this project's selectors
- **Removed** generic technique explanation, "wait 1.5-2s" guidance, and "scroll is unreliable" warning — all live in global skill.

### Stage 2: Delete project agent-browser skill (`7886815`)

- **Deleted** `.claude/skills/agent-browser/SKILL.md` entirely.
- Rationale: 100% redundant with global `visual-verify-fix` skill; the project-specific URL (localhost:5173) is obvious from context and doesn't warrant its own skill.

## Resulting Ownership Model

| Layer | Owns |
|---|---|
| Global CLAUDE.md | Mandate: "invoke visual-verify-fix after every UI file change" |
| Global skill: `visual-verify-fix` | Full workflow: open → screenshot → eval technique → wait times → anti-patterns → close |
| Project CLAUDE.md | Project-specific: UI Verification Contract format, scroll-targets registry, sentinel nth-child DOM mapping |

## Key Insight for Replication

When adding a global skill that codifies a workflow previously documented ad-hoc in project files:

1. **Audit** all project CLAUDE.md files and project-level skills for overlapping content.
2. **Keep in project** only what's structurally unique (DOM selectors, project-specific hooks/formats, architectural constraints).
3. **Delete project skills** that are strict subsets of the global skill — a project-specific URL alone doesn't justify a separate skill.
4. **Watch for contradictions** — project-level examples may conflict with the global skill's anti-patterns (as the `scroll down 600` example did here).
