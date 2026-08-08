# Dansship Admin UI — Technical Context

> Generated from the current `dansship-ui` codebase. This is a **separate repository** from the backend (`polership-api` / Dansship API). Product UI copy shown to users is **Spanish** (`public/locales/es/` only); English locales are not shipped. Example strings below are noted as Spanish where relevant rather than translated.

---

## Stack

| Layer | Choice | Evidence |
| --- | --- | --- |
| Framework | React 19 + Vite 8 | `package.json` |
| Language | TypeScript 5.8 | same |
| Styling | Tailwind v4 + `polpo-tailwind-config` | `vite.config.ts` |
| UI kits | Radix + shadcn-style primitives + `polpo/components` | `components.json`, `src/components/ui/*` |
| Routing | React Router 7 (`createBrowserRouter`, middleware) | `src/core/router.tsx` |
| i18n | i18next + http-backend + react-i18next | `src/core/i18n.ts` |
| Forms | react-hook-form + zod + `@hookform/resolvers` | e.g. login / plan modal |
| HTTP | Hand-written clients on `polpo-http-client` `HttpClient` | `src/core/api/dansship.api.ts` |
| State | No Redux/Zustand — React Context + service hooks | `src/contexts/*`, `src/hooks/services/` |
| Observability | Sentry (`@sentry/react`) | Vite plugin + init |
| Hosting | Vercel SPA (`vercel.json` rewrite → `index.html`) | public routes must stay SPA-safe |
| Package manager | `pnpm@11.2.2` (Node `>24.14.0`) | `package.json` |

### Base URL & auth token handling

- Base URL: `import.meta.env.VITE_DANSSHIP_API_URL`.
- Cookie session: HTTP client uses `credentials: 'include'` (backend JWT in HTTP-only cookies).
- `localStorage` flag `auth_session` (`AUTH_SESSION_KEY`) marks “logged in” for refresh decisions.
- On **401** (except signin/signup/signout/refresh): client calls `POST /auth/refresh-token`, then re-fetches; failure dispatches `auth:session-expired`.
- `AUTH_TOKEN_KEY` exists in constants but is **not** used for Bearer headers in the API layer.
- Profile load: `GET /auth/profile` when session flag is set.

### Permission-denied handling

- **Route-level:** `SecurityGuard` → `UnauthorizedPage` if authenticated but permissions fail.
- **Feature flag off:** `UnavailablePage` when `VITE_ARE_ADMIN_PAGES_ENABLED` / `FEATURE_FLAG.areAdminPagesEnabled` is false.
- **API-level:** error codes `FORBIDDEN` / `PERMISSION_DENIED` exist in `dansship.error.ts`; pages typically toast domain-specific errors — no global 403 interceptor beyond the 401 refresh path.

---

## Repository structure

**Separate repo from backend:** yes.

- UI: `dansship-ui` (e.g. `codership-co/dansship-ui`)
- API: `polership-api` (e.g. `codership-co/polership-api`)

```
dansship-ui/
  public/locales/es/     # Spanish copy only (no en/ tree)
  src/
    components/
      ui/                # shadcn-style primitives
      forms/             # shared forms
      form-fields/       # EmailField, PasswordField, etc.
      modules/           # feature UI (admin-inventory, admin-merch, …)
      layouts/
      navigation/
      modals/
    contexts/            # auth, feature-flags, onboarding
    core/                # router, api, permissions, constants, i18n, sentry
    helpers/
    hooks/services/      # data hooks wrapping DansshipAPI
    pages/               # route pages (+ pages/admin/)
  vite.config.ts
  components.json
  vercel.json
  package.json
```

### Path aliases (prefer these)

`@components/*`, `@contexts`, `@core/*`, `@helpers`, `@hooks`, `@pages`

### Conventions

| Concern | Location |
| --- | --- |
| Routes | `src/core/router.tsx` + `PageURLS` in `src/core/constants.ts` |
| Pages | `src/pages/` (+ `admin/`) and barrel exports |
| Feature UI | `src/components/modules/<feature>/` |
| Shared primitives | `src/components/ui/` + `polpo/components` |
| API clients | `src/core/api/<domain>/` |
| Data hooks | `src/hooks/services/` |
| Permissions | `src/core/permissions.ts` |

---

## Design system / component conventions

**UI library:** shadcn “new-york” style (`components.json`) over Radix, plus Codership `polpo` components (`Button`, `SmartTable`, `AsideModal`, `Tabs`, etc.).

### Admin list + filters pattern

- Page shell with title/subtitle → often `Tabs` → module with `Table` / `SmartTable`.
- Filters: local state + `useSearchParams`, or email search with debounce/min length (users, bookings).
- Examples: `user-list.tsx` (`SmartTable`), `product-list.tsx`, `admin-payment-list.tsx`, `rooms-tab.tsx` / `plans-tab.tsx`.

### Create/edit modal pattern

Discounts UI was removed. The current archetype is **Create/Edit Plan**:

- List: `src/components/modules/admin-inventory/plans-tab.tsx`
- Modal: `src/components/modules/admin-inventory/plan-modal.tsx`
- Flow: table + create button → `Dialog` → react-hook-form + zod → hook (`usePlans`) → `DansshipAPI.billingAdmin.*`

Same pattern also in:

- `room-modal.tsx` / `class-modal.tsx` (inventory)
- `product-form.tsx` (merch)
- Inline figure create/edit `Dialog` in `figures.page.tsx`

### Client-side validation

- Preferred (auth/onboarding): factory schema with `t` → `zodResolver` (e.g. `createLoginSchema(t)` in `login-form.tsx`).
- Admin modals often use **hard-coded English** zod messages (`plan-modal.tsx`, `product-form.tsx`) — inconsistent with Spanish i18n elsewhere.
- Shared fields under `form-fields/`.

### Locale note

User-facing Admin copy is Spanish (`public/locales/es/*.json`). Do not assume English UI strings. Leftover discount wording still appears in some locale files (e.g. inventory subtitle mentioning descuentos) even though the Discounts tab/UI is gone.

---

## Admin screens ↔ backend domains

All under `/admin`, wrapped with `SecurityGuard` + admin feature flag + `AdminPermissions.*` groups. Route constants: `PageURLS.admin` in `src/core/constants.ts`.

### Hub

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin` | `admin.page.tsx` → `SecureAdminPage` | schedules, studio_rentals | `GET /admin/agenda/events`, `GET /admin/studio-rentals/requests?status=pending_approval` |

### Agenda / schedules

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/agenda` | `agenda.page.tsx` | schedules | `GET /admin/agenda/events` |
| `/admin/agenda/conflicts` | `agenda-conflicts.page.tsx` | schedules | same agenda events + client-side conflict helper |
| `/admin/schedule-builder` | `schedule-builder.page.tsx` | schedules, rooms, class_catalog, instructors | `/admin/schedules/weeks`, publish/archive, classes CRUD, published-edit/cancel, inventory/instructor lookups |

### Inventory (rooms, class catalog, plans)

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/inventory` (tabs: rooms, classes, plans) | `inventory.page.tsx` | rooms, class_catalog, class_groups, plans, taxes | Rooms: `/admin/rooms` CRUD + image upload; Classes: `/admin/class-catalog`; Class groups: **GET only** `/admin/class-groups`; Plans: `/admin/plans`; Tax types: `GET /admin/tax-types` |

Locale still mentions a **Discounts** tab in places; the page code only has rooms / classCatalog / plans.

### Users / instructors

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/users` | `user-list.page.tsx` | auth/users | `GET /admin/users` |
| `/admin/users/:userId` | `user-details.page.tsx` | auth/users, instructors | `GET /admin/users/:id`, deactivate/reactivate user; invite/deactivate/reactivate instructor (`/admin/instructors/...`) |

### Bookings (manual)

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/bookings` | `bookings.page.tsx` | bookings, schedules, users | `POST /admin/bookings`, `GET /admin/users?email=`, `GET /schedules/classes` |

### Payments

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/payments` | `payments.page.tsx` → `AdminPaymentList` | payments | `GET /admin/payments`, `GET /admin/payments/:id`, proof view/upload/confirm, `POST .../review`, `POST .../bold/sync` |

### Merch

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/merch` | products + orders tabs | merch | `/admin/merch/products`, `/admin/merch/orders` (+ cancel, image upload) |
| `/admin/merch/pos` | POS checkout | merch | `POST /admin/merch/orders`, product list, customer search |

### Figures

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/figures` | CRUD + bulk import tabs | figures | `/admin/figures` CRUD, approve, images, `POST /admin/figures/import` |

### Reports + notification config

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/reports` | dashboard, instructor performance, notifications | reports, notifications | `/admin/reports/class-occupancy`, `attendance`, `instructor-performance`, `revenue-indicators`; `/admin/notifications/config` GET + PUT by type |

### Studio rental ops

| Route | Page | Backend domain(s) | Primary endpoints |
| --- | --- | --- | --- |
| `/admin/studio-rental` (tabs: approval, reserved-use, rules) | `studio-rental.page.tsx` | studio_rentals | requests list/approve/reject; internal reserved uses; availability rules CRUD under `/admin/studio-rentals/*` |

---

## Permission handling in the UI

**No dedicated `my-permissions` endpoint.** Permissions arrive on the user profile:

1. Login / `getProfile` → `GET /auth/profile` returns `permissions: string[]` and `roles`.
2. Mapped in `auth.helpers.ts` onto `User.permissions`.
3. UI checks via `useOrPermissions` / `useAndPermissions` / `usePermissions` against the `PERMISSION` enum and `AdminPermissions` groups in `src/core/permissions.ts`.
4. Route gating: `SecurityGuard(..., { orPermissions: AdminPermissions.X, requiresAuth: true })`.
5. In-page gating: hub cards, nav items (`nav-items.ts`, `mobile-menu.tsx`), action buttons (e.g. user details).

**Also gated by env feature flags:** `VITE_ARE_ADMIN_PAGES_ENABLED` → `FEATURE_FLAG.areAdminPagesEnabled`.

**Token decode:** not used for permissions; cookie session + profile payload.

### `AdminPermissions` groups (current)

| Group | Permission strings |
| --- | --- |
| `users` | `manage:user` |
| `scheduleBuilder` | `manage:schedule` |
| `inventory` | `manage:room`, `manage:class_catalog`, `manage:class_group`, `manage:plan` |
| `bookings` | `manage:booking` |
| `payments` | `manage:payment` |
| `merch` | `manage:product` |
| `merchPos` | `create:order` |
| `figures` | `manage:figure` |
| `reports` | `read:report` |
| `studioRental` | `manage:studio_rental` |

**Stale leftover:** `PERMISSION.DISCOUNT_MANAGE = 'manage:discount'` remains in the enum but is unused in `AdminPermissions` (discount admin UI removed).

---

## API client conventions

**Hand-written**, not OpenAPI-generated.

Typical wiring for a new backend endpoint:

1. Add/update `src/core/api/<domain>/*.models.ts` (request/response types; often snake_case matching API).
2. Optional `*.helpers.ts` mappers (API → camelCase UI model).
3. `*.api.ts` / `*.admin.api.ts` class taking `HttpClient<DansshipAPIError>`, methods via `httpClient.call` or `callNoError`.
4. Register on `DansshipAPI` in `src/core/api/dansship.api.ts`.
5. Re-export models from `src/core/api/index.ts`.
6. Optional service hook under `src/hooks/services/use-*.ts`.

**Implication for backend changes:** frontend types and clients must be updated manually; there is no codegen pipeline from OpenAPI.

### Admin client surfaces on `DansshipAPI` today

`billingAdmin`, `bookingsAdmin`, `figuresAdmin`, `instructorsAdmin`, `inventoryAdmin`, `merchAdmin`, `notificationsAdmin`, `paymentsAdmin`, `reportsAdmin`, `schedulesAdmin`, `studioRentalAdmin`, `usersAdmin`.

---

## Notable gaps

### Benefits / discounts (highest priority)

- Backend `benefits` domain has **no HTTP router** and no Admin API.
- Definitions are seeded via `polership-api/scripts/seed_benefits.py` (`FIRST_PLAN_PCT_10`, trial class, launch bonus, etc.).
- Historical discounts → `benefit_definitions` migration; checkout may still accept a `discount_code` and show benefit snapshots, but **there is no Admin CRUD** for benefit definitions.
- UI leftovers: Spanish discount strings in locales, inventory copy mentioning descuentos, `PERMISSION.DISCOUNT_MANAGE`.

### Backend capabilities with little/no Admin UI

| Backend area | UI coverage |
| --- | --- |
| `benefits` | None (seed + checkout/orchestration consume) |
| Auth RBAC admin (`manage:role` / `manage:policy`) | No UI for roles/policies |
| `class_groups` | GET only for plan allowances; **no create/patch UI** (backend supports more) |
| `taxes` | Tax types read for plan forms; no full tax catalog / rate history admin |
| `template` | No UI |
| `favorites` | Student-facing only |
| Subscriptions admin ops (`manage:subscription`) | Student subscription pages exist; no dedicated admin subscription manager |
| Cancellation policy admin (`manage:cancellation_policy`) | No dedicated Admin screen found |
| Financial report permission (`read:financial_report`) | Reports page uses `read:report`; financial gating may be incomplete or server-side only — confirm before assuming UI respects it |

### API clients vs pages

- Clients exist for all current admin pages listed above.
- Class groups: client exposes `getClassGroups` only.
- No benefits/discount API client.

### UX / i18n leftovers

- Inventory subtitle / admin locale strings may still say “planes y descuentos”.
- Admin form validation often English hard-coded vs Spanish locales elsewhere.

---

## Quick reference — Admin `PageURLS`

```
/admin
/admin/agenda
/admin/agenda/conflicts
/admin/inventory
/admin/schedule-builder
/admin/users
/admin/users/:userId
/admin/bookings
/admin/payments
/admin/merch
/admin/merch/pos
/admin/figures
/admin/reports
/admin/studio-rental
```

Evidence roots: `src/core/router.tsx`, `src/pages/admin/`, `src/core/api/`, `src/core/permissions.ts`, `public/locales/es/`.
