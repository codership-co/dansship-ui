#!/usr/bin/env bash
# Prep step for design-sync — run before every package-build.mjs invocation.
# Both outputs are gitignored scratch state under .design-sync/.cache/.
#
# 1. Regenerates .design-sync/.cache/scoped-src/ — a scoped copy of the
#    design-system-relevant component folders (excludes src/components/modules/
#    and src/components/forms/, which are app-specific business logic, not
#    reusable design-system pieces).
#
#    Renames form-fields/checkbox.tsx's `Checkbox` export to `CheckboxField`
#    in the copy only — it collides with ui/checkbox.tsx's `Checkbox` (the
#    raw Radix primitive vs. the label+error composed field), and matches
#    its siblings' naming convention (EmailField, TextField, PhoneField, ...).
#
# 2. Compiles src/core/styles/index.css (raw Tailwind v4 source — bare
#    `@import "tailwindcss"` etc., not consumable as-is) into a real
#    stylesheet via the standalone Tailwind CLI staged in .ds-sync/, so
#    cfg.cssEntry can point at actual generated CSS (tokens, utilities used
#    by the scoped components, the polpo-tailwind-config preset resolved).
#
# 3. Emits real .d.ts declarations for the scoped folders into /types/ (via
#    tsc -p .design-sync/tsconfig.dts.json), then barrels them into a
#    repo-root /index.d.ts (see gen-dts-entry.mjs for why the barrel itself
#    is required, not just the declarations). Without this, the converter's
#    synth-entry mode has no declaration tree to extract props from at all,
#    and every single component's <Name>.d.ts silently comes out as a
#    `{ [key: string]: unknown }` stub — no variant/size/prop info, which
#    defeats the entire point of the sync (the design agent codes against
#    this contract). findTypesRoot() picks /types/ up automatically (no
#    dist/, no package.json "types" field, so it's next in the fallback
#    scan). Two pre-existing type errors outside our scope
#    (src/contexts/feature-flags.context.tsx, src/core/api/dansship.api.ts —
#    both `ImportMeta.env` typing, unrelated to our components) print but
#    don't block emit (noEmitOnError defaults to false).
set -euo pipefail
cd "$(dirname "$0")/.."

DEST=.design-sync/.cache/scoped-src
rm -rf "$DEST"
mkdir -p "$DEST"
for d in ui form-fields layouts loaders modals navigation containers svg; do
  cp -r "src/components/$d" "$DEST/$d"
done

sed -i '' \
  -e 's/export function Checkbox(/export function CheckboxField(/' \
  "$DEST/form-fields/checkbox.tsx"

./.ds-sync/node_modules/.bin/tailwindcss \
  -i src/core/styles/index.css \
  -o .design-sync/.cache/compiled.css

rm -rf types index.d.ts
node_modules/.bin/tsc -p .design-sync/tsconfig.dts.json || true
node .design-sync/gen-dts-entry.mjs
