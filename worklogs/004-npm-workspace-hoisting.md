# 004 — npm workspace hoisting fix

## Goal
Get `npm install` + `npm run check --workspace=web` (svelte-check) + `npm run lint --workspace=web` to pass cleanly. No errors, ideally no warnings.

---

## Root cause analysis

### Problem 1 — dual vite installations (type conflict)
- `web/package.json` declares `vite@^8.0.7` → npm resolves to **vite@8.0.16** (uses rolldown internally; Plugin types are rolldown-based)
- `@threlte/studio@0.4.3` depends on `vite-dev-rpc@1.1.0`, which declares vite peer dep capped at `^7.0.0-0` (no vite 8 support)
- npm interprets this constraint and hoists **vite@7.3.5** (rollup-based) to root `node_modules/`
- `vite@8.0.16` then stays isolated in `web/node_modules/`
- TypeScript resolves `Plugin` types from the root (vite@7, rollup) but `tailwindcss()` and `sveltekit()` return plugins typed against `vite@8` (rolldown) → incompatible types at `vite.config.ts:6:27`
- Also contributed by: `vitest@4.1.x` accepts `^6||^7||^8`; npm deduplicates to 7.3.5 as it satisfies the most dependents

### Problem 2 — stale `web/package-lock.json`
- A standalone `package-lock.json` inside `web/` was left over from before npm workspaces was configured
- npm workspaces use only the **root** lockfile; the nested one can cause incorrect resolution

### Problem 3 — fontsource side-effect import errors
- `@fontsource-variable/inter` and `@fontsource/jetbrains-mono` are CSS-only packages — they ship no `.d.ts` files
- svelte-check errors: `Cannot find module or type declarations for side-effect import`
- Packages install fine (hoisted to root `node_modules/`); the issue is purely type-level

### Problem 4 — prettier-plugin-tailwindcss crash (lint)
- `web/.prettierrc` has `"tailwindStylesheet": "./src/routes/layout.css"` pointing to a file that does not exist
- Crashes every prettier invocation with `ENOENT`, causing `npm run lint` to fail entirely

---

## What was already fixed (before this session)
- All Threlte v8 packages (`@threlte/core`, `@threlte/extras`, `@threlte/flex`, `@threlte/rapier`, `@threlte/studio`, `@threlte/theatre`) plus `three`, `@types/three`, `@dimforge/rapier3d-compat`, `@theatre/core`, `@theatre/studio` were previously misplaced in root `package.json` — moved to `web/package.json` (commit 9c1ef5f)
- Root `package.json` now contains only: `concurrently` (needed to run api+web in parallel from root), workspace config, and scripts

---

## Changes made this session

### 1. `package.json` — add npm overrides (commit 2853319)
```json
"overrides": {
  "vite": "^8.0.7",
  "vite-dev-rpc": "^2.0.0"
}
```
- `"vite": "^8.0.7"` forces every transitive dep in the entire tree to resolve to vite@8.x — eliminates the dual-version problem entirely
- `"vite-dev-rpc": "^2.0.0"` needed because vite-dev-rpc@1.1.0's peer range excludes vite@8; the 2.0.0 release is API-identical, only the peer range was widened to include `^8.0.0`
- After `npm install`, only **vite@8.0.16** exists in the tree (confirmed: root `node_modules/vite/` = 8.0.16; no vite in `web/node_modules/`)

### 2. `web/package-lock.json` — delete stale lockfile (commit 8eebdc6)
- Removed the workspace-conflicting nested lockfile

### 3. `web/src/app.d.ts` — ambient module declarations (commit 8eebdc6)
```typescript
declare module '@fontsource-variable/inter';
declare module '@fontsource/jetbrains-mono';
```
- Standard TypeScript approach for CSS-only packages with no type declarations
- **Status:** declarations added but svelte-check still reported errors — under investigation (see below)

---

## Current state (as of session end)

| Check | Status |
|-------|--------|
| vite Plugin type conflict | **Fixed** — single vite@8.0.16 in tree |
| stale web/package-lock.json | **Fixed** — deleted |
| fontsource side-effect imports | **Partially fixed** — declarations added, but svelte-check still erroring; root cause unclear (may be tsconfig include order or empty scope dirs in web/node_modules shadowing root) |
| prettier lint crash | **Not yet fixed** — `.prettierrc tailwindStylesheet` points to nonexistent `layout.css` |

---

## Open issues / next steps

1. **Fontsource declarations not taking effect** — investigate why `app.d.ts` `declare module` stubs aren't suppressing svelte-check errors. Likely culprits:
   - Empty `web/node_modules/@fontsource*/` scope directories shadowing root resolution
   - `.svelte-kit/tsconfig.json` not including `app.d.ts` in the way svelte-check processes component files
   - Try: create a standalone `web/src/fonts.d.ts` (no `export {}`) with only the two declarations

2. **Prettier tailwindStylesheet crash** — fix `.prettierrc` by either:
   - Pointing `tailwindStylesheet` to the correct CSS file (check which CSS file Tailwind is configured to use)
   - Or removing the `tailwindStylesheet` key if class sorting isn't needed

3. **Verify full clean install works** — after the lockfile regeneration, run `rm -rf node_modules web/node_modules && npm install` to confirm reproducibility for other engineers

---

## Key insights for replication

- **npm workspaces hoists aggressively** — any transitive dep that satisfies the most consumers gets pulled to root. In a vite@8 project, always check if any dep caps at vite@7 in its peer range.
- **`overrides` is the surgical fix** — `npm overrides` in root `package.json` enforces a single version across the entire workspace tree without restructuring anything
- **`vite-dev-rpc` is the hidden blocker** — not immediately obvious; comes via `@threlte/studio` → `vite-dev-rpc@1.1.0`
- **Nested lockfiles conflict** — if a workspace member has its own `package-lock.json`, delete it; only the root lockfile is authoritative
- **CSS-only packages need ambient stubs** — fontsource and similar CSS packages require `declare module 'pkg-name'` in a `.d.ts` file included by tsconfig
