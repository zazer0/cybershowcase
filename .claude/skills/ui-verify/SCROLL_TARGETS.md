# Scroll Targets

Optional registry that controls which page section the hook screenshots. Useful for scroll-driven sites with multiple sections on one route.

## Files

- **`.ui-verify/scroll-targets.json`** — maps named keys to CSS selectors
- **`.ui-verify/active-target`** — plain text file containing the active key

## scroll-targets.json Format

```json
{
  "hero": { "scrollTo": null },
  "features": { "scrollTo": ".features-section" },
  "pricing": { "scrollTo": "#pricing" },
  "bottom": { "scrollTo": "__BOTTOM__" }
}
```

- `null` — no scroll (top of page)
- CSS selector string — hook calls `scrollIntoViewIfNeeded()` on that element
- `"__BOTTOM__"` — scrolls to bottom of page

## How Resolution Works

The hook resolves scroll position in this order:
1. **Active target from registry** — reads key from `active-target`, looks up in `scroll-targets.json`
2. **Contract `>> .selector`** — falls back to the selector appended to the route
3. **No scroll** — if neither exists, screenshots from top of page

## Setting the Active Target

Before starting a task on a specific section, write the key to `active-target`:
```sh
echo "pricing" > .ui-verify/active-target
```

The hook reads this file on every verification run. Update it when you move to a different section.

## See Also

- [CONTRACT_FORMAT.md](CONTRACT_FORMAT.md) — the `>> .selector` fallback syntax
- [SKILL.md](SKILL.md) — when and why to include verification contracts
