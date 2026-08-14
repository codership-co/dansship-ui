# design-sync notes — dansship-ui

## Scope

Synced: `src/components/{ui,form-fields,layouts,loaders,modals,navigation,containers,svg}`.

Excluded, by user decision (2026-08-12):
- `src/components/modules/*` — feature-specific business components tied to
  specific app pages (admin-inventory, classes, payments, onboarding, etc.),
  not reusable design-system pieces.
- `src/components/forms/*` — complete business forms wired directly to
  `@core/api` hooks (login-form, signup-form, checkout-payment-proof-form,
  profile forms, ...), same reasoning as modules/. `form-fields/*` (the
  actual reusable atoms — checkbox, text-field, phone-field, etc.) IS
  synced.

## Re-sync setup

No dist/library build exists for this repo (it's an app, not a published
package) — synth-entry mode is used, scoped via `cfg.srcDir` pointing at
`.design-sync/.cache/scoped-src/`, a gitignored scratch copy of only the
whitelisted folders above. **Run `.design-sync/prepare-scoped-src.sh` before
every `package-build.mjs` invocation** — it regenerates that copy and
compiles the CSS (see below). `cfg.entry` is a placeholder path
(`src/components/index.ts`, doesn't exist) — it exists only so PKG_DIR
walks up to the repo root's package.json; do not "fix" it by creating that
file.

### CSS

`src/core/styles/index.css` is raw Tailwind v4 SOURCE (bare
`@import "tailwindcss"`, `@import "polpo-tailwind-config/styles"`, etc.) —
copying it as-is (what the converter does by default for `cssEntry`)
ships broken `@import` statements no consumer can resolve.
`prepare-scoped-src.sh` compiles it via the standalone Tailwind CLI
(`.ds-sync/node_modules/.bin/tailwindcss`, installed as a dev dep of
`.ds-sync/`) into `.design-sync/.cache/compiled.css`, which `cfg.cssEntry`
points at. Tailwind's default content auto-detection scans the whole repo
(not just the scoped folders), so the compiled CSS is a superset — harmless,
just not minimal.

### Checkbox name collision

`src/components/ui/checkbox.tsx` and `src/components/form-fields/checkbox.tsx`
both export a component literally named `Checkbox` (raw Radix primitive vs.
the label+error composed field). Since synth-entry does `export * from`
over every scoped file, this is an ES-module ambiguous-star-export
collision — `prepare-scoped-src.sh` renames the form-fields copy's export
to `CheckboxField` (in the scratch copy only, matching its siblings'
naming convention: EmailField, TextField, PhoneField, ...) so both survive
as distinct synced components. If a future re-sync adds another same-name
collision across the scoped folders, the same treatment applies — check with
the node one-liner used to find this one (scan `export function/const/class
<PascalCase>` + `export { Name }` across the scoped dirs, group by name).

### The most important piece of setup: real `.d.ts` props (`/types/` + `/index.d.ts`)

Without extra setup, synth-entry mode has NO declaration tree at all —
`lib/dts.mjs`'s `propsBodyFor` couldn't find any `<Name>Props` interface
(our components use inline destructured params, not named types) and its
fallback path only looks in ONE file (`pkgJson.types || 'index.d.ts'` at
repo root, which didn't exist). Result: **every single one of the 97
components' emitted `.d.ts` was a `{ [key: string]: unknown }` stub** — no
variant/size/prop info at all, silently. This is the single highest-impact
fix in this setup; if it regresses on a re-sync, the design agent loses the
entire API contract for every component with no visible error.

`prepare-scoped-src.sh` fixes it in two steps:
1. `tsc -p .design-sync/tsconfig.dts.json --declaration --emitDeclarationOnly`
   emits real `.d.ts` files into `/types/src/components/**` (gitignored,
   regenerated every run). Two pre-existing type errors outside our scope
   print but don't block emit (`noEmitOnError` defaults to false).
2. `.design-sync/gen-dts-entry.mjs` barrels those into repo-root
   `/index.d.ts` (also gitignored) — this is what `propsBodyFor`'s fallback
   path actually reads. It special-cases `form-fields/checkbox.tsx` to
   re-export `Checkbox as CheckboxField` (matching the scoped-src rename).

**Verify after any re-sync**: spot-check `ds-bundle/components/general/Button/Button.d.ts`
(or any component) — if it comes back to `{ [key: string]: unknown }`,
this pipeline broke silently; check `/index.d.ts` was regenerated and
`/types/` has fresh output before assuming anything else is wrong.

### Forked lib: `.design-sync/overrides/css.mjs`

`rewriteBundleFontFaces`'s "did this url resolve?" check
(`/url\(\s*['"]?(?!https?:|data:|\.\/fonts\/)/`) let the optional quote group
backtrack to zero-width to dodge its own negative lookahead, so it
false-positived on **every** successfully-rewritten, quoted `./fonts/...`
url and dropped the whole `@font-face` block even after a correct rewrite.
Reproduced in isolation outside this repo — looks like an upstream bug, not
repo-specific. Fixed by tracking per-url resolution state during the loop
instead of re-scanning the mutated string. Declared in `cfg.libOverrides`.
On re-sync, diff this against the bundled `lib/css.mjs` and re-apply/retire
the fix if upstream has since fixed it.

### Fonts

- `guntertest` (brand font, `public/assets/fonts/guntertest-regular.otf`) —
  wired via `cfg.extraFonts` (bare file copy; the `@font-face` rule already
  ships from the compiled CSS and gets rewritten to point at it).
- "Montserrat Alternates" / "Josefin Sans" — loaded at runtime via Google
  Fonts `<link>` tags in `index.html`, not local `@font-face`. Wired via
  `cfg.runtimeFontPrefixes: ["Montserrat", "Josefin"]` to suppress the
  false FONT_MISSING warning — designs render these correctly as long as
  claude.ai/design also loads them at runtime (same as this app does); if
  it doesn't, they'll fall back to system fonts.

## Known render warns (checked against on re-sync)

- `[FONT_MISSING] "Cambria" (--font-serif)` — Tailwind v4's built-in default
  `--font-serif` theme token, present in every Tailwind v4 build regardless
  of usage. No scoped component uses `font-serif` intentionally; the stack
  ends in a generic `serif` fallback. Accepted as-is, not sourcing a font
  for it.

## Action required — not a sync-tool issue

- **`Switch`'s unchecked track (`data-[state=unchecked]:bg-input`) is very
  low-contrast against a white background** — visible in the authored
  preview's "Default"/"Disabled" cells (the plain circle is barely
  distinguishable from the page). This is the component rendering exactly as
  it does in the real app, not a preview-authoring artifact — the `--input`
  token itself appears to resolve close to white. Worth a design review; not
  changed here since it accurately reflects current app behavior.

- **`AdminPageLayout` (and several excluded modules/pages) reference bare
  `--error`, `--surface-container`, `--primary-container`,
  `--secondary-container`, `--tertiary-container` CSS custom properties**
  (e.g. `className="bg-[hsl(var(--surface-container))]"`) that are never
  defined anywhere in the app's actual token set — the app's real tokens are
  all `--color-*` prefixed (`--color-surface-container`,
  `--color-error-container`, etc., defined in
  `src/core/styles/index.css`'s `@theme` block). This looks like a real
  styling bug/inconsistency in the app source (possibly leftover from an
  earlier Material-3-style token naming before the `--color-` prefix
  convention), not something design-sync can or should paper over. Flagged
  to the user; `AdminPageLayout`'s preview may render with missing
  background colors as a result — that's accurately reflecting the real
  component's behavior in the app today.

## Preview authoring status

24 of 97 components have authored previews (real, graded-`good` story sets
in `.design-sync/previews/`); the rest ship the functional floor card
(honest, not a failure — authorable incrementally on any future sync).
Authored: Button, Table, CheckboxField, Badge, Input, Label, Switch,
Textarea, Checkbox, Card, Dialog, Tabs, Select, TextField, EmailField,
PasswordField, PhoneField, SelectField, DateField, Container, ConfirmDialog,
Popover, Section, SectionHeading — chosen for reuse frequency (grepped
import counts across the whole app) and to cover every major compound
family (Card/Dialog/Select/Table/Tabs) end-to-end. Compound subparts within
those families (CardHeader, DialogContent, TableRow, SelectItem, etc.) were
left as floor cards — they render fine (the `.d.ts` fix alone resolved most
of their earlier blank/thin renders) but weren't individually authored.
Good next candidates if continuing: those subparts, plus DatePicker,
Calendar, Navbar/Footer/MobileMenu, and the layout components.

## Re-sync risks

- `.design-sync/.cache/compiled.css` and `.design-sync/.cache/scoped-src/`
  are regenerated by `prepare-scoped-src.sh` and are NOT committed — if
  someone runs `package-build.mjs` directly without running that script
  first, the build will either fail (`[NO_DIST]` synthesizing from 0 files)
  or use a stale/missing compiled CSS.
- The Checkbox→CheckboxField rename lives only in the scratch copy; if
  `form-fields/checkbox.tsx`'s real export is ever renamed in the actual
  repo, update `prepare-scoped-src.sh`'s `sed` accordingly (or remove it if
  the collision is resolved upstream).
- `cfg.docsDir` defaults to `docs/` — this repo has a top-level `docs/`
  directory but it's product/engineering documentation, not per-component
  docs, so 0/97 components matched (expected, not a bug). `.prompt.md` files
  are synthesized from `.d.ts` + authored previews instead.
- No Storybook and no library build — every re-sync depends on
  `prepare-scoped-src.sh`'s Tailwind CLI compile step staying in sync with
  the app's real Tailwind version/config (currently pinned to `4.3.0` to
  match `package.json`'s `@tailwindcss/vite` version; bump both together).
