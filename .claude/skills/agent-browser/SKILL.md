---
name: agent-browser
description: Browser automation via agent-browser CLI. Use for visual checks, screenshots, page interaction, form filling, and web testing. Run `agent-browser skills get core` for the full workflow guide.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*)
---

# agent-browser

Browser automation CLI for AI agents. Installed globally (`npm i -g agent-browser`).

## Core workflow

```bash
agent-browser open <url>        # 1. Open a page
agent-browser snapshot -i       # 2. See interactive elements with @eN refs
agent-browser click @e3         # 3. Act on refs from the snapshot
agent-browser screenshot <path> # 4. Capture current state
agent-browser close             # 5. Close browser
```

## Visual check pattern (used in this project)

```bash
agent-browser open http://localhost:5173
agent-browser scroll down 600
agent-browser screenshot /tmp/check.png
agent-browser close
```

## Full documentation

Run `agent-browser skills get core` for the complete usage guide, or `agent-browser --help` for all commands.
