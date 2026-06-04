# 005 — lint & typecheck fixes

## Goal
Get `npm run check --workspace=web` (svelte-check) and `npm run lint --workspace=web` (prettier + ESLint) to both exit 0 with no errors or warnings, picking up from the two open issues left at the end of session 004.

---

## Open issues inherited from session 004

| Issue | Description |
|-------|-------------|
| Fontsource declarations not taking effect | `declare module` stubs in `app.d.ts` weren't suppressing svelte-check errors |
| Prettier crash | `.prettierrc tailwindStylesheet` pointed to nonexistent `layout.css` |

---

## Root cause analysis (this session)

### Fontsource: `export {}` scoping problem
- `app.d.ts` has `export {};` which converts it into a TypeScript **module file**
- In module files, `declare module 'X'` is technically valid but svelte-check v4 + TypeScript 6 does not pick up ambient module declarations from module-scoped `.d.ts` files for side-effect imports in `.svelte` components
- Cannot simply remove `export {}` — TypeScript requires a module context for `declare global {}`
- **Fix:** create a separate `web/src/fonts.d.ts` with no `export {}` (pure script/ambient file) containing only the two declarations — TypeScript treats this as a global ambient file visible to all compilation units

### Prettier crash: wrong CSS path
- `.prettierrc` had `"tailwindStylesheet": "./src/routes/layout.css"` — this file never existed
- The actual Tailwind v4 entry point is `web/src/app.css` (contains `@import 'tailwindcss';`)
- Tailwind v4 uses CSS-first config (no `tailwind.config.js`); `prettier-plugin-tailwindcss` needs the CSS entry file for class sorting
- **Fix:** change path to `"./src/app.css"`

### ESLint `varsIgnorePattern` not applying (open issue)
- `{#each steps as _step, i (i)}` in `ScrollStory.svelte:90` — `_step` is syntactically required to access index `i` in Svelte's `#each` syntax, but is never used in the template body
- ESLint `@typescript-eslint/no-unused-vars` (from `ts.configs.recommended`) flags this
- Renamed from bare `_` to `_step` — still flagged (the default recommended config does NOT include `varsIgnorePattern: '^_'` in typescript-eslint v8)
- Added `'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }]` to the last rules block in `eslint.config.js`
- **Still failing as of session end** — the rule override is not suppressing the error; root cause unclear (may be rule merge order, svelte-specific variable handling, or the pattern not applying to template-scope variables)

---

## Changes made this session

### 1. `web/src/fonts.d.ts` — new pure ambient file (committed: 9d66b47)
```typescript
declare module '@fontsource-variable/inter';
declare module '@fontsource/jetbrains-mono';
```
No `export {}`. This makes the declarations globally ambient.

### 2. `web/src/app.d.ts` — removed duplicate declarations (committed: 9d66b47)
Removed the two `declare module` lines and the blank line before them. File now ends cleanly at `export {};`.

### 3. `web/.prettierrc` — fix tailwindStylesheet path (committed: e215497)
```json
"tailwindStylesheet": "./src/app.css"
```

### 4. Auto-format run — prettier `--write` (not separately committed)
6 files reformatted: `src/app.css`, `src/fonts.d.ts`, `src/lib/components/case-study/Hero.svelte`, `src/lib/components/case-study/ScrollStory.svelte`, `src/lib/components/case-study/StepCard.svelte`, `src/routes/+page.svelte`

### 5. `ScrollStory.svelte:90` — renamed `_` to `_step` (not separately committed)
`{#each steps as _step, i (i)}` — did not resolve the ESLint error.

### 6. `web/eslint.config.js` — added `varsIgnorePattern` (not committed, still failing)
```js
'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }]
```
Added to the last (empty) rules block. Despite correct syntax, ESLint still reports `_step` as unused.

---

## Current state

| Check | Status |
|-------|--------|
| svelte-check (0 errors, 0 warnings) | **Passed** ✓ |
| Prettier formatting | **Passed** ✓ |
| ESLint | **Failing** — 1 error: `'_step' is defined but never used` at `ScrollStory.svelte:90:22` |

---

## Uncommitted changes
- `web/src/lib/components/case-study/ScrollStory.svelte` — `_` renamed to `_step` (formatting also applied)
- `web/eslint.config.js` — `varsIgnorePattern` rule added
- `web/src/app.css`, `web/src/lib/components/case-study/Hero.svelte`, `web/src/lib/components/case-study/StepCard.svelte`, `web/src/routes/+page.svelte` — prettier reformatted
- `package-lock.json` — regenerated from clean install with vite overrides (session 004)
- `worklogs/004-npm-workspace-hoisting.md` — created this session

---

## Open issues / next steps

1. **ESLint `_step` error** — `varsIgnorePattern: '^_'` isn't suppressing the error. Investigate:
   - Whether `eslint-plugin-svelte` handles template-scope variable reporting separately (may need `svelte/no-unused-svelte-ignore` or a svelte-specific rule override)
   - Whether the rule override is being merged correctly given `ts.configs.recommended` is spread earlier in the config array
   - Alternative: change `{#each steps as _step, i (i)}` — in Svelte 5 you may be able to omit the binding entirely if using a different syntax, or use `#each { length: steps.length }` workaround
   - Alternative: scope the disable to that specific file only via an inline `// eslint-disable-next-line`

2. **Commit and push** — once ESLint is clean, commit all remaining changed files and push to remote

---

## Key insights for replication

- **Pure ambient `.d.ts` vs module `.d.ts`**: if a `.d.ts` file has any `import` or `export`, it becomes a module file — `declare module` inside it is valid TypeScript but svelte-check v4 won't pick it up for component side-effect imports. Always put CSS package stubs in a dedicated `fonts.d.ts` (or similar) with no exports.
- **Tailwind v4 CSS-first config**: no `tailwind.config.js` — the config lives in the CSS file itself via `@import 'tailwindcss'` in `app.css`. `prettier-plugin-tailwindcss` needs `tailwindStylesheet` to point to this file.
- **typescript-eslint v8 `no-unused-vars`**: the recommended preset does NOT include `varsIgnorePattern: '^_'` by default. Must add it manually. Whether it interacts correctly with `eslint-plugin-svelte`'s template variable tracking is an open question.
- **Svelte `{#each}` index-only pattern**: Svelte requires a binding before the index — you cannot skip it. The variable will always be flagged as unused by strict ESLint configs unless the rule is configured to allow `_`-prefixed names.
