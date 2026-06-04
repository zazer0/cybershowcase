# Claude → OpenCode Config Port

## Objective

One-time migration of `~/.claude/` configuration (commands, agents, skills, CLAUDE.md) to `~/.config/opencode/` so they work natively with OpenCode's TUI/CLI without ongoing sync.

---

## What Was Migrated

| Source (`~/.claude/`) | Destination (`~/.config/opencode/`) | Count |
|---|---|---|
| `CLAUDE.md` | `AGENTS.md` | 1 file |
| `commands/*.md` | `commands/*.md` | 14 commands |
| `agents/*.md` | `agents/*.md` | 12 agents |
| `skills/<name>/` | `skills/<name>/` | 9 skill dirs |

The file structure and content of skills (`SKILL.md` per dir) is identical between both tools — direct copy, no reformatting needed.

---

## Schema Fixes Required (3 categories)

### 1. Null `description` in commands
- **Affected:** `0_initialize_prd.md`, `1_generate_tasks.md`
- **Cause:** Claude Code allows bare `description:` (YAML null); OpenCode schema requires `string | undefined`
- **Fix:** Replaced with real description strings

### 2. CSS color names in agents
- **Affected:** All 11 agents with a `color:` field
- **Cause:** Claude Code uses CSS color names (`green`, `blue`, `purple`, `cyan`, `yellow`); OpenCode only accepts its own design tokens or `#rrggbb` hex
- **Fix:** Mapped via `sed` across all files:
  - `green` → `success`
  - `blue` → `primary`
  - `purple` → `accent`
  - `cyan` → `info`
  - `yellow` → `warning`

### 3. `tools` field as string in agents
- **Affected:** `flutter-app-engineer`, `systems-engineer`, `neovim-lua-expert`, `gcp-k8s-platform-engineer`, `systems-architect`, `typescript-fullstack-engineer`
- **Cause:** Claude Code stores `tools:` as a comma-separated string listing allowed tools; OpenCode expects `tools` as an object (different schema)
- **Fix:** Removed the `tools:` line entirely — OpenCode defaults to unrestricted tool access

---

## Schema Fixes Required (post-migration, round 2)

### 4. Invalid `model` values in agents
- **Affected:** All 12 agents — values were `inherit` (Claude-specific token) or `opus` (shorthand not valid in OpenCode)
- **Cause:** OpenCode requires fully-qualified `provider/model` format; `inherit` and `opus` are Claude Code conventions
- **Fix:** Replaced all values with `lmstudio/gemma-4-26b-a4b` (the only configured provider/model in `opencode.json`)
- **How to find model ID:** provider key + model key from `~/.config/opencode/opencode.json` → `provider.<key>.models.<key>`

### 5. Agent `mode` defaulting to `all` breaks Tab/plan-mode cycling
- **Symptom:** After migration, Shift+Tab cycled through all 12 migrated agents instead of switching to plan mode
- **Cause:** Agents with no `mode:` field default to `all` in OpenCode, making them appear as primary agents in the Tab cycle. Pre-migration, only built-in primaries (`build`, `plan`, etc.) existed in the cycle
- **Fix:** Inserted `mode: subagent` as second line of frontmatter in all 12 agent files
- **Correct semantic:** These agents were subagents in Claude Code (spawned by the orchestrator); `subagent` is the right OpenCode equivalent — invokable via `@mention` by the primary agent, not directly by Tab
- **Sed gotcha:** `s/^---$/---\nmode: subagent/` replaces ALL `---` lines (both opening and closing frontmatter delimiters). Must scope to line 1 only: `sed '1s/^---$/---\nmode: subagent/'`

---

## Fields Safely Ignored by OpenCode

These Claude Code-specific frontmatter fields appear in migrated files but are silently ignored by OpenCode (no schema error):
- `globs:` — file glob triggers (commands)
- `alwaysApply:` — auto-inject flag (commands)

---

## Validation Method

```bash
opencode agent list        # schema-validates all agents + commands on load
opencode run --command shellscripts-improve "test"  # confirmed command executed
opencode run "list skills" # confirmed skills enumerated correctly
```

- `agent list` surfaced all 3 schema errors iteratively; fixed between each run
- Final `agent list` output: all 12 agents loaded cleanly
- Skills confirmed: `editing-code`, `molty`, `molty-slack`, `skill-editing`, `webapp-testing` + others visible in runtime

---

## Notes for Replication

- **This is one-way/one-time** — no sync mechanism; changes to either side must be manually replicated
- **OpenCode also reads `CLAUDE.md`** as a fallback, but `AGENTS.md` takes precedence when both exist — always write to `AGENTS.md` going forward
- **Skills are fully portable** — the `SKILL.md` + subdirectory format is shared between Claude Code and OpenCode; maintain once, use in both
- **Provider errors are separate** — `ProviderModelNotFoundError` during validation is expected (no Anthropic key in `opencode.json`); unrelated to config port correctness
