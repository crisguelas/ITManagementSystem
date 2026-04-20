# Development History

**Project:** IT Management System (IT department use)  
**Started:** April 18, 2026

---

## Planning Phase — April 18, 2026

- Gathered requirements from IT department team
- Defined scope: asset tracking, stock management, location management, employee management, reporting
- Selected tech stack: Next.js 15+, TypeScript, Prisma, Neon PostgreSQL, Tailwind CSS v4
- Designed database schema with 12 models covering all tracking needs
- Planned 8 development phases
- Created project documentation: README.md, AGENTS.md, DEVELOPMENT_HISTORY.md

### Key Decisions
- **Auto-generated asset tags** using `{ASSET_TAG_PREFIX}-{category prefix}-{number}` (default global prefix configurable via env)
- **Separate PC number field** for PCs/laptops (e.g., C000001)
- **MAC address tracking** for network devices (primary identifier for PCs)
- **Serial number tracking** for other equipment
- **QR code generation** per asset for easy scanning
- **Separate stock categories** from asset categories
- **Role-based access**: Admin (full access) and Member (limited access)
- **Feature-based folder structure** for scalability
- **Tailwind CSS v4** for styling (no inline styles)
- **NextAuth.js v5** with credentials provider for authentication

---

## Phase 1: Project Setup & Foundation — April 18, 2026

- Initialized Next.js project with TypeScript and Tailwind CSS v4
- Installed all dependencies (Prisma, NextAuth, React Hook Form, Zod, Recharts, jsPDF, xlsx, etc.)
- Created feature-based folder structure
- Set up Prisma schema with full database model
- Configured strict TypeScript and ESLint
- Built design system with a professional blue theme
- Created base UI components (Button, Input, Modal, Badge, Card, Select, etc.)
- Created layout components (Sidebar, Header, Breadcrumb)
- Created error, loading, and empty state components

---

## Phase 2: Authentication & User Management — (Completed)
- NextAuth.js v5 setup
- Login page
- Role-based middleware
- User management (admin) 
- Seed default admin

---

## Phase 3: Asset Management — (Completed)
- Created robust Prisma schema and data layer.
- Added strict Zod schemas for Asset and Category validation.
- Auto-seeded default IT Categories (PC, Monitor, Laptop).
- Implemented `/assets` data table UI with `SkeletonTable` and local search.
- Created "Register Asset" form modal with dynamic auto-tag generation (prefix from config).
- Built Asset detail page `[id]/page.tsx` with dynamic QR Code Generation for print capabilities.

---

## Phase 4: Location & Employee Management — (Completed)
- Mapped Organization DB relationships (`Building`, `Room`, `Department`, `Employee`).
- Developed Centralized `/organization` UI Module with Dynamic Tabbing.
- Created Backend Data Services with unique restriction safeguards (`organization.service.ts`).
- Created React Hook Forms driven by Zod for Buildings and Departments.
- **Rooms UI** — Incremental: `RoomForm` + modal wired to **`POST /api/rooms`** from **Organization → Places** (Register Room).
- Passed full rigorous `npx tsc --noEmit` and internal compilation testing suite.

---

## Phase 5: Stock Room Management — (Completed)
- Created Zod validation schemas for stock categories, items, and transactions.
- Implemented `stock.service.ts` with atomic Prisma transaction processing.
- Built full CRUD automated REST API routes.
- Crafted Tabbed Interface (`Inventory Items`, `Stock Categories`).
- Designed fully-featured data tables and forms for items and transactions.
- Added dynamic Low-Stock Alert System integrated across components.

---

## Phase 6: Assignment & Tracking — (Completed)

- `assignment.schema.ts` — Zod validation for assign body (employee and/or room, optional notes).
- `assignment.service.ts` — `assignAsset` (closes any open `AssetAssignment` row, creates new history, sets asset `DEPLOYED`); `returnAsset` (sets `returnedAt`, asset `AVAILABLE`); guards for retired/disposed assets and inactive employees.
- `getAssetById` in `asset.service.ts` — single source for asset detail API include (category, `stockItem`, assignments with employee/room/building/`assignedBy`).
- API routes (authenticated): `POST /api/assets/[id]/assignments`, `POST /api/assets/[id]/assignments/return`; `GET /api/assets/[id]` uses service layer only.
- UI: `AssetAssignModal` (React Hook Form + Zod), Assign / Return on asset detail page, assignment history shows person, location, notes; status badge uses Prisma `AssetStatus` (e.g. `DEPLOYED`).

---

## Phase 7: Dashboard & Analytics — (Completed)

- `dashboard.service.ts` — `getDashboardStats()`: asset totals by status, category slices, deployment counts by building (and “With user (no room)”), org counts (buildings, rooms, employees), low-stock count, merged recent assignment + stock activity feed.
- Home route (`/`) — async server page with `auth()` guard; client `DashboardView` with Recharts (pie by status, bar by category, horizontal bar by location).
- `loading.tsx` — skeleton for dashboard route.
- Quick actions link to `/assets`, `/organization`, `/stock`.

### Phase 7 quality check — April 18, 2026

- `npx tsc --noEmit` — pass (project-wide strict TypeScript).
- `npx eslint` on Phase 7 paths: `dashboard.service.ts`, `features/dashboard/dashboard-view.tsx`, `app/(dashboard)/page.tsx`, `app/(dashboard)/loading.tsx` — pass (no issues).
- `npm run build` — pass (Next.js production compile + route generation).

---

## Phase 8: Reporting (PDF + Excel) — (In progress)

- Added dashboard route **`/reports`** with server-side session guard and route-level `loading.tsx`.
- Added `report.service.ts` to assemble report datasets (asset export rows, stock transaction rows, and key summary metrics).
- Added `ReportsView` with export actions:
  - **Assets Excel** (`.xlsx`)
  - **Stock transactions Excel** (`.xlsx`)
  - **Summary PDF** (`.pdf`) with metrics and compact tables
- **Date-range filter** — `getReportsData({ from, to })` applies Prisma `createdAt` bounds (UTC) for asset rows, stock transactions, and **employees**; page reads `searchParams`; UI **Apply filter** / **Clear** updates the URL. Export filenames and PDF header include the active period.
- **Wider exports** — **Low-stock** detail Excel + extra PDF table (current levels vs minimum). **Employee roster** Excel + PDF table (respects date scope on `Employee.createdAt`).

### Phase 8 quality check — April 20, 2026

- `npx tsc --noEmit` — pass.
- `npx eslint` on Phase 8 paths — pass (no issues).
- `npm run build` — pass.
- Smoke test — `/reports` loads for authenticated users; date filter updates assets, transactions, and employees; low-stock and employee Excel exports work; PDF includes new sections.

---

## Consolidated quality check — Phases 1–8 — April 20, 2026

**Automated (repository-wide)**

| Check | Result |
|--------|--------|
| `npx prisma validate` | Pass |
| `npx tsc --noEmit` | Pass (strict) |
| `npm run lint` | Pass — **0 errors**, **0 warnings** (after replacing `watch()` with `useWatch()` in stock forms) |
| `npm run build` | Pass |

**Code hygiene (this run)** — Resolved prior ESLint **errors** so full-repo lint is clean: portal mount in `Modal` now uses `useSyncExternalStore` (no `setState` in layout effect); client data loads use `queueMicrotask` + stable callbacks where needed; removed `any` / unused imports; `StockTransactionTable` allows `performedBy.name` to be null.

**Manual smoke (recommended before release)** — Log in → **Dashboard** (charts) → **Assets** (list, register, detail, assign/return if data exists) → **Categories** → **Organization** (places/people) → **Stock** (items, categories, transactions, item detail) → **Reports** (filters + Excel/PDF) → **Settings / Users** (admin only).

---

## Incremental delivery — April 18, 2026

*(Features and fixes shipped after the initial GitHub push; see commit history for details.)*

### Ordered by task area (post-initial push)

1. **Build/deployment reliability**
   - **Vercel / Prisma** — `package.json` runs `prisma generate` in **`postinstall`** and before **`next build`**, so hosted builds do not fail with an outdated Prisma Client when dependencies are restored from cache.

2. **Navigation and route completeness**
   - **Asset categories route** — Added dashboard page **`/categories`** with `CategoriesView` + `CategoryForm` (existing `GET`/`POST /api/assets/categories`), fixing the sidebar link that previously returned 404.

3. **Organization module completion**
   - **Rooms** — Added `RoomForm` + modal from **Register Room** on **Organization → Places**; updated `roomSchema` so `type` is explicit for forms/API alignment.
   - **Employees** — Added `EmployeeForm` + modal from **Add Employee** on **Organization → People**; made `employeeSchema.title` explicit for stronger typing; posts to **`POST /api/employees`**.

4. **Modal and interaction stability**
   - **Portal rendering** — `Modal` now renders via **`createPortal(..., document.body)`** with higher `z-index`, preventing clipping under dashboard layout stacking/overflow.
   - **Button behavior hardening** — Organization tab switches use **`type="button"`** to avoid accidental submit behavior.
   - **Employee UX polish** — `EmployeesView` keeps top actions visible while department data loads; `Button` icon wrappers use `pointer-events-none`; `Modal` uses `useLayoutEffect` to mark portal readiness before paint.

5. **Admin settings and IT user accounts**
   - **Settings guard** — `settings/layout.tsx` gates `/settings/*` routes to `ADMIN`.
   - **Users management** — Added `/settings` hub and `/settings/users`; APIs `GET`/`POST /api/users`, `PATCH /api/users/[id]`; `user.service.ts` protects the last active administrator from demotion/deactivation.
   - **Sidebar visibility** — Settings nav item uses `adminOnly` + `isAdmin` state from dashboard layout.

6. **Asset workflow expansion**
   - **Asset detail actions** — `/assets/[id]` supports **Edit Asset** (`PATCH /api/assets/[id]`) and **Delete Asset** (`DELETE /api/assets/[id]`) with active-assignment safeguards.
   - **Category management** — `/categories` supports in-row **Edit**/**Delete** with duplicate/in-use protections via `PATCH`/`DELETE /api/assets/categories/[id]`.

7. **API security consistency**
   - **Auth guard standardization** — Introduced shared helpers in `src/lib/api-auth.ts`; applied authenticated-read/admin-mutation patterns across assets, categories, buildings, departments, employees, rooms, stock routes, assignments, and users APIs for consistent `401`/`403` handling.

8. **Reporting delivery**
   - **Phase 8 reports** — Implemented `/reports` with summary metrics, optional created-date range (`?from` / `to`), and Excel/PDF exports via `report.service.ts`.

---

## Phase 8 follow-up: system interaction verification — April 20, 2026

### What was checked

- Reviewed `README.md`, `AGENTS.md`, and current phase history for route/feature expectations.
- Audited navigation and interactions in dashboard pages/components (sidebar, breadcrumbs, quick links, forms, modals, CRUD action buttons, report export actions).
- Confirmed all declared App Router pages compile and are generated in production build output.

### Results

- `npx tsc --noEmit` — pass
- `npm run lint` — pass with 2 warnings (React Hook Form `watch()` compatibility warning; no lint errors)
- `npm run build` — pass
- Button/link/function handlers are wired in the current UI modules and map to existing pages/API handlers.

### Notes

- This run validates wiring and build integrity. Keep using the manual smoke checklist for environment-specific runtime checks (database data permutations, role edge cases, and browser/device behavior).

### Follow-up fix — April 20, 2026

- Replaced React Hook Form `watch()` usage with `useWatch()` in:
  - `src/features/stock/stock-item-form.tsx`
  - `src/features/stock/stock-transaction-form.tsx`
- Re-ran quality gates:
  - `npx tsc --noEmit` — pass
  - `npm run lint` — pass (**0 warnings**)
  - `npm run build` — pass
- Outcome: stock-form compiler compatibility warnings are fully resolved while preserving existing form behavior.

---

## Post-phase enhancements — April 20, 2026

### Notifications and account lifecycle

- **Header notifications (bell icon)** — Replaced the placeholder bell with a working notification panel in `src/components/layout/header.tsx`.
- **Low-stock alerts in bell** — Bell now fetches `/api/stock-items`, shows unread count, and lists low-stock items (`quantity <= minQuantity`) with links to `/stock/[id]`.
- **Assignment alerts in bell** — Bell also fetches `/api/assets` and surfaces recent asset assignment notifications with links to `/assets/[id]`.
- **User account lifecycle (no hard delete needed)** — In `src/features/settings/users-management-view.tsx`, replaced row-level delete with explicit **Activate / Deactivate** actions and confirmation prompts so user records remain in the system.
- **Sign-in enforcement** — Inactive users are blocked from authentication (already enforced in `src/lib/auth.ts`; now aligned with settings UI behavior).
- **Documentation update** — Updated `README.md` (Features → Security & access) to state activate/deactivate behavior, preserved records, and login blocking for deactivated accounts.

### Sidebar navigation

- **Asset categories** — Moved the **Categories** link from the **Assets** submenu to **Settings** (`NAV_ITEMS` in `src/lib/constants.ts`), alongside **User accounts**, so category/tag prefix configuration sits with other admin configuration.

### Post-phase enhancements quality check — April 20, 2026

- `npx eslint src/components/layout/header.tsx` — pass.
- `npx eslint src/features/settings/users-management-view.tsx` — pass.
- `npx tsc --noEmit` — pass.

### Post-phase enhancements quality check — April 21, 2026

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass.
- `npm run build` — pass.

---

## Deployment — (Pending)

### Suggested next tasks (team)

1. **Phase 8 — Reporting follow-up** — Add filters/date ranges and wider report coverage as needed.
2. **API consistency sweep** — Align remaining routes to shared auth guard helpers where applicable.
3. **UX follow-up** — Organization / modals after API and reporting behavior is stable.
