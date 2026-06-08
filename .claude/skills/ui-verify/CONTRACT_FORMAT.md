# Contract Format

The `UI_VERIFICATION_CONTRACT` block triggers the Stop hook. It must be the **last thing** in your message.

## Format

```
UI_VERIFICATION_CONTRACT
task: <one-line description of what was implemented>
routes:
  - <URL or path, e.g. /pricing or http://localhost:5173/>
  - <another route> >> .css-selector
viewports:
  - <WIDTHxHEIGHT, e.g. 1440x900>
acceptance:
  - <visually verifiable criterion>
  - <another criterion>
```

## Field Rules

- **`task`** — required, single line describing the change
- **`routes`** — required, ≥1. Relative paths (`/`, `/pricing`) resolve against `devServerUrl` in `.ui-verify/config.json`. Append `>> .css-selector` to scroll to a specific element
- **`viewports`** — optional. Defaults to `1440x900` and `390x844` (desktop + mobile)
- **`acceptance`** — required, ≥2 items. Must be visually verifiable from a screenshot

## Example

```
UI_VERIFICATION_CONTRACT
task: added pricing cards with responsive grid layout
routes:
  - /pricing
viewports:
  - 1440x900
  - 390x844
acceptance:
  - three pricing cards visible in a horizontal row on desktop
  - cards stack vertically on mobile viewport
  - each card shows plan name, price, and CTA button
```

## Writing Good Criteria

Describe what a human **sees**, not implementation details:
- ✅ "hero text is readable and not clipped at mobile width"
- ❌ "the CSS grid has 3 columns"
- ✅ "navigation links are visible and not overlapping"
- ❌ "the flex container has gap: 1rem"

## See Also

- [SKILL.md](SKILL.md) — verdict authority and when to include contracts
- [SCROLL_TARGETS.md](SCROLL_TARGETS.md) — registry-based scroll positioning
