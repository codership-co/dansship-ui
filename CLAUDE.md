# CLAUDE.md

Guidance for Claude Code when working in `dansship-ui` (React SPA for Dansship; admin and public screens). Workspace-wide rules (language, working agreement, safety, git, API↔UI flow) live in `../CLAUDE.md` — read it too. These rules were ported from the former `.cursor/rules/*.mdc`.

## Stack
React 19 + TypeScript SPA on Vite. React Router 7, i18next, Tailwind v4, Radix/shadcn-style UI, `polpo` / `polpo-http-client`, react-hook-form + zod, Sentry. No Redux/Zustand: React Context + service hooks. Hosted on Vercel (SPA).

Deeper technical context: `docs/admin-ui-architecture.md`. The backend is a separate repo (`../polership-api`); error codes are in `../polership-api/docs/ERROR_CODES.md`.

## Tooling
- Node `>24.14.0`, `pnpm@11.2.2` (use `corepack pnpm` if `pnpm` isn't on PATH). Don't use npm (`package-lock.json` is stale).
- Commands: `pnpm dev`, `pnpm build`, `pnpm lint` (`--max-warnings 0`), `pnpm lint:fix`, `pnpm exec tsc --noEmit`, `pnpm test` (vitest, jsdom; setup in `src/test/setup.ts`).
- After meaningful changes validate in this order: `pnpm build` → `pnpm lint` → `pnpm exec tsc --noEmit` → `pnpm test` (CI runs lint + tsc; the pre-commit hook runs `lint:fix` + `tsc`).
- Local dev runs at `http://localhost.dansship.com` (hosts entry required so cookies work). Env via `vercel env pull`; never commit `.env.local`.
- Add shadcn primitives with `pnpm create-component <name>`.

## Path aliases (prefer over relative paths)
`@components/*`, `@contexts`, `@core/*`, `@helpers`, `@hooks`, `@pages`

## Where code lives
| Concern | Location |
| --- | --- |
| Routes | `src/core/router.tsx` |
| Pages | `src/pages/` + `src/pages/index.ts` |
| API clients | `src/core/api/<domain>/` via `DansshipAPI` |
| Data hooks | `src/hooks/services/` |
| Layouts / UI / features / forms | `src/components/{layouts,ui,modules,forms,form-fields}/` |
| Locales | `src/locales/es/<ns>.json` (glob-loaded in `src/core/i18n.ts`) |
| URLs / option lists | `src/core/constants.ts` (`PageURLS`) |
| Permissions | `src/core/permissions.ts` |
| Contexts | `src/contexts/` (auth, feature-flags, onboarding) |

## Change rules
- Reuse existing module boundaries; **do not invent new top-level folders**.
- Changed/new routes: update `router.tsx` **and** the page barrel exports.
- Every folder keeps an `index.ts` barrel; import via aliases.
- Public routes must stay SPA-safe (`vercel.json` rewrites to `index.html`).
- Auth/errors: use constants from `@core/constants`; pages consume normalized values (`errorCode`), never raw API envelopes.
- Start from the files above before searching broadly; keep diffs small.

## Pages & routing
- Files named `*.page.tsx`; folder `index.ts` barrels; root surface `src/pages/index.ts`.
- Pages stay thin: layout + feature form/module. Business UI goes in `components/modules/<feature>`, not pages.
- Export a `Secure*` wrapper via `SecurityGuard(Page, { requiresAuth | requiresNoAuth, andPermissions: [PERMISSION.*], featureFlags: [FEATURE_FLAG.*], redirect })` when auth/flags/permissions apply (admin: `requiresAuth: true`, `redirect: PageURLS.auth.login`).
- New page checklist: (1) `*.page.tsx` in `auth/`, `admin/` or root `pages/`; (2) re-export from folder + `src/pages/index.ts`; (3) register in `router.tsx` under the right layout (`RouterAuthLayout` / `RouterPageLayout`); (4) add a URL helper on `PageURLS`; (5) wire `SecurityGuard` + flags/permissions like peers.
- Use `PageURLS.*` and `viewTransition` on links; no hard-coded paths.

## Components
| Folder | Use for |
| --- | --- |
| `layouts/` | Route shells |
| `forms/`, `form-fields/` | Form compositions; field controls |
| `modules/<feature>/` | Feature UI (admin-*, payments, figures, …) |
| `ui/` | Shared primitives; promote here only when truly shared |
| `modals/`, `loaders/`, `navigation/`, `containers/`, `svg/` | Cross-cutting UI |

- Use `cn` from `@helpers` for class names; Tailwind utilities matching neighbors.
- Prefer existing `polpo/components` (Button, shared controls) before building new ones; for any new React UI/forms/layouts, use the `polpo` skill instead of other UI kits.
- Keep feature work in its `modules/<feature>/` package.

## API clients & service hooks
- Domain layout `src/core/api/<domain>/`: `*.api.ts` (client class using `HttpClient` + `callNoError`), `*.admin.api.ts` (admin endpoints), `*.models.ts` (request/response types), `*.helpers.ts` (mappers).
- Wire new clients on `DansshipAPI` in `dansship.api.ts` and re-export models from `core/api/index.ts`.
- Hooks `src/hooks/services/use-<domain>.ts`; re-export from `hooks/services/index.ts` and `@hooks`. Call `DansshipAPI.<domain>.*` through `useCallablePromise` (or existing promise helpers); loading/pagination/filter state stays in the hook.
- Never fetch raw envelopes in page components — normalize in API helpers/context and expose clean domain types.

## Forms & i18n
- `react-hook-form` + `zod` + `zodResolver`; build the schema with `t` inside the component factory (e.g. `createLoginSchema(t)`).
- Prefer existing fields (`EmailField`, `PasswordField`, …) over raw inputs.
- Copy keys are `namespace:path` (e.g. `auth:login.email`, `validation:required`). Spanish is the only shipped language: files `src/locales/es/<ns>.json`. A new namespace = a new JSON file (auto-picked by the glob).
- Option lists in `constants.ts` store **i18n keys** as labels, not translated strings.
- Never hard-code user-facing text where a namespace key exists or should exist.

## UI conventions
- Keep list rows/cards clean: no itemized breakdowns in list rows (e.g. cuentas de cobro); put detail in the PDF/detail view.

## Testing
- Vitest, co-located `*.test.ts(x)` next to the source (see `src/core/*.test.ts`, `src/hooks/*.test.tsx`). Add tests for new hooks, helpers and API clients; run `pnpm test` before finishing.

## Safety (UI specifics)
Needs explicit approval: auth contexts/`SecurityGuard`/permission logic, session/cookie handling in the HTTP client, `vercel.json`, `.husky`, `.github/workflows`, env handling. Never edit `dist/`, `ds-bundle/`, `.ds-sync/`, `.design-sync/` or `claude_design/` by hand unless asked (generated/design-sync assets).
