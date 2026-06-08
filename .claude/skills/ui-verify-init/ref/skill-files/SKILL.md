---
name: ui-verify
description: MUST invoke after ANY web UI file change to trigger automated visual verification via the Stop hook.
---

# UI Verification

A Stop hook screenshots the running app with Playwright and sends images to an independent Codex CLI judge. The judge returns a structured pass/fail verdict. On failure, you are blocked until all failures are fixed.

## When to Include a Contract

After completing any UI-visible change. The `UI_VERIFICATION_CONTRACT` block MUST be the last thing in your message. MUST read [CONTRACT_FORMAT.md](CONTRACT_FORMAT.md) for the exact format.

## Verdict Authority

Verdicts are **authoritative and non-negotiable**:
- Every listed failure is a confirmed visual bug from real screenshots
- Fix ALL failures, then include a new contract to trigger re-verification
- Do NOT argue, dismiss, or claim the UI "looks correct"
- Do NOT skip re-verification — you are blocked until it passes

## When to Skip

- Non-visual changes (logic-only, tests, config, backend)
- No running dev server (build-only tasks)

## Scroll Targets

If this project uses scroll-based sections, MUST read [SCROLL_TARGETS.md](SCROLL_TARGETS.md) for the registry system that controls which section gets screenshotted.

## Related

The `confirming-webui-edit` skill (if installed) handles per-change interactive checks during development. This skill is the automated end-of-turn judge gate.
