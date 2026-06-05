# 011 — Threlte HMR `node.remove` Fix

## Problem

Runtime error in dev (HMR only, not production):

```
TypeError: node.remove is not a function
  at remove_effect_dom (effects.js:575)
  at destroy_effect (effects.js:519)
  at CycleDiagram3D (CycleDiagram3D.svelte:29)
```

Triggered on hot reload of any component in the `ScrollStory → CycleDiagram3D` subtree.

---

## Root Cause

- Svelte 5's HMR wrapper (`hmr.js`) creates a `branch()` effect to host each component, then on hot reload calls `destroy_effect()` to tear it down.
- `destroy_effect` walks `effect.nodes.start → effect.nodes.end` and calls `.remove()` on each, expecting standard DOM nodes (`Element`, `Text`, `Comment`).
- Threlte v8's `<T>` component (used in `AgentCard`, `ServerCard`, `SSHArrow`) sets the Svelte effect anchor to a **Three.js object** (e.g. `THREE.Group`) via `createParentContext(() => internalRef)`.
- `THREE.Group.remove()` exists but removes child 3D objects — incompatible signature. Svelte's teardown path therefore throws.
- This is a **known Threlte v8 + Svelte 5 compatibility issue** — not a project-level bug. Dev only; production builds are unaffected.

---

## Fix Applied

**File:** `web/svelte.config.js`

Added `vitePlugin.hot.preserveLocalState: false`:

```js
vitePlugin: {
  hot: {
    preserveLocalState: false
  }
},
```

**Mechanism:** This instructs `@sveltejs/vite-plugin-svelte` to perform a full component remount on hot reload rather than a surgical in-place teardown. The teardown code path that calls `.remove()` on effect node anchors is bypassed entirely. HMR still fires on file save — only the state-preservation/teardown strategy changes.

**Why this is safe:** The Threlte canvas scene is entirely prop-driven (`activeNodeId`, `activeArcId`). There is no meaningful local state to preserve across hot reloads, so the full-remount behaviour is functionally equivalent.

---

## Fallback (not applied — held in reserve)

If the global `preserveLocalState: false` proves insufficient, add per-component pragma to `CycleDiagram3D.svelte`:

```svelte
<!-- @hmr:keep-all -->
<script lang="ts">
```

This disables HMR entirely for that one component (triggers full page reload on edits to it), but is surgical — no other component is affected.

---

## Commit

```
fix(hmr): disable preserveLocalState to prevent Threlte node.remove error
eaf7422 on feat/codex-verify-hook
```

---

## Key Insights for Scale

- **Svelte 5 HMR assumes DOM-node anchors** — any Svelte library that uses non-DOM objects as effect anchors will hit this in dev. Threlte v8 is the primary known offender.
- **`preserveLocalState: false` is the minimal global fix** — low risk for 3D/canvas components because they are always rebuilt from props.
- **The per-file `<!-- @hmr:keep-all -->` pragma** is the surgical alternative if global config causes unexpected regressions elsewhere.
- **Production builds are unaffected** — `hmr.js` is vite-plugin-svelte dev infrastructure only.
- **Investigation workflow used:** Explore subagent (read source + node_modules) → planning subagent (evaluate fix options + show exact diffs) → approval gate → TypeScript engineer subagent (apply edit) → commit.
