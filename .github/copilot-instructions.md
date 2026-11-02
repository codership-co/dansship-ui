# Copilot Cloud Agent Instructions

## What This Repository Is
Dansship UI is a React 19 + TypeScript single-page app built with Vite. It covers public pages, authenticated flows, admin screens, figure/class browsing, studio rental workflows, and Spanish/English localization.

The repo is front-end focused. The stack is Vite, React Router, i18next, Tailwind CSS v4, Radix/shadcn-style primitives, and a small set of app-specific helpers and API wrappers.

## Operating Assumptions
- Trust these instructions first. Only search further if a detail here is missing or clearly wrong.
- Preferred Node.js version: `>24.14.0` from `package.json`.
- Preferred package manager: `pnpm@11.2.2` from `packageManager`.
- If `pnpm` is not on PATH, use `corepack pnpm` in this workspace.
- The repo has a `package-lock.json`, but the real workflow is pnpm-oriented.

## Validation
Use the smallest command that can validate the change, then broaden only if needed.

1. Install dependencies before a fresh build if `node_modules` is missing or dependencies changed.
   - Preferred: `corepack pnpm install`
   - Fallback that worked here: `npm install`
2. Build the app: `corepack pnpm build`
   - Fallback that worked here: `npm run build`
   - Vite emits production assets into `dist/`.
3. Lint the app: `corepack pnpm lint`
   - Fallback that worked here: `npm run lint`
   - The lint script uses `--max-warnings 0`.
4. There is currently no `test` script in `package.json`.
   - If tests are added later, document the command here and run it before merging.

For most code changes, validate in this order: build, lint, then install first only if dependencies changed.

## High-Value Files
- [package.json](../package.json): scripts, dependencies, Node engine requirement, and pnpm pin.
- [vite.config.ts](../vite.config.ts): Vite plugins, manifest output, dev host, and React compiler setup.
- [eslint.config.js](../eslint.config.js): ESLint configuration.
- [tsconfig.json](../tsconfig.json): TypeScript config and path aliases.
- [vercel.json](../vercel.json): SPA rewrite to `index.html`.
- [src/main.tsx](../src/main.tsx): React root, providers, error boundary, analytics, toaster, and style imports.
- [src/core/router.tsx](../src/core/router.tsx): browser router and route map.
- [src/core/i18n.ts](../src/core/i18n.ts): i18next bootstrap and namespace list.
- [src/core/constants.ts](../src/core/constants.ts): language codes, option lists, and URL helpers.
- [src/core/api/](../src/core/api/): API clients, models, helpers, and error types.
- [src/components/layouts/](../src/components/layouts/): root, auth, and error layouts.
- [src/components/loaders/](../src/components/loaders/): root and spinner loaders.
- [src/components/ui/](../src/components/ui/): shared UI primitives.
- [src/components/modules/](../src/components/modules/): feature-level component groupings.
- [src/hooks/services/](../src/hooks/services/): data-fetching hooks for domain services.
- [src/pages/](../src/pages/): page modules; [src/pages/index.ts](../src/pages/index.ts) re-exports the route surface.

## Change Rules
- Prefer existing module boundaries instead of introducing new ones.
- If you touch routing or page exports, update both [src/core/router.tsx](../src/core/router.tsx) and the relevant re-export in [src/pages/index.ts](../src/pages/index.ts).
- If you touch copy or i18n, update the matching locale namespace JSON files under [public/locales/](../public/locales/).
- If you add new shared UI, keep it under [src/components/ui/](../src/components/ui/) or the closest feature module.
- If a change affects public routes, remember the Vercel SPA fallback behavior.
- Auth flows should use shared error-code constants from [src/core/constants.ts](../src/core/constants.ts) and normalize backend responses in the context layer when possible.
- Page components should route from normalized values like `errorCode`, not raw backend envelopes or nested API payloads.
- Use the existing path aliases from [tsconfig.json](../tsconfig.json) instead of long relative paths.

## Repo Notes
- Routing is centralized in [src/core/router.tsx](../src/core/router.tsx) and uses nested route objects with loaders and middleware.
- Localization is file-based under [public/locales/es/](../public/locales/es/), with namespaces declared in [src/core/i18n.ts](../src/core/i18n.ts).
- The [vercel.json](../vercel.json) rewrite means client-side routes must remain SPA-safe.
- The `.husky/` directory exists; pre-commit currently runs `pnpm lint:fix` and then `git update-index --again`.

## Efficiency
- Start with the files above before searching broadly.
- Prefer `rg` or workspace search only when one of those anchors is missing or inconsistent.
- Keep changes small, validate immediately, and do not assume tests exist unless `package.json` says so.