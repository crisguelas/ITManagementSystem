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

### Phase 8 quality check — April 20, 2026

- `npx tsc --noEmit` — pass.
- `npx eslint` on Phase 8 paths — pass (no issues).
- `npm run build` — pass.
- Smoke test — `/reports` loads for authenticated users and export buttons generate files.

---

## Incremental delivery — April 18, 2026

*(Features and fixes shipped after the initial GitHub push; see commit history for details.)*

- **Vercel / Prisma** — `package.json` runs `prisma generate` in **`postinstall`** and before **`next build`**, so hosted builds do not fail with an outdated Prisma Client when dependencies are restored from cache.
- **Asset categories route** — New dashboard page **`/categories`** with `CategoriesView` + `CategoryForm` (uses existing `GET`/`POST /api/assets/categories`). Fixes sidebar link that previously returned 404.
- **Organization — rooms** — `RoomForm` + modal from **Register Room** on **Organization → Places**; `roomSchema` updated so `type` is explicit for forms/API alignment.
- **Organization — employees** — `EmployeeForm` + modal from **Add Employee** on **Organization → People**; `employeeSchema.title` made explicit (no Zod default) for form typing; posts to **`POST /api/employees`**.
- **Modal / dialogs** — `Modal` now renders via **`createPortal(..., document.body)`** with a higher `z-index` so overlays (Add Employee, Add Department, etc.) are not clipped or hidden by the dashboard layout’s overflow/stacking. Organization tab buttons use **`type="button"`** to avoid accidental submit behavior.
- **Add Employee UX** — `EmployeesView` no longer replaces the whole tab with a loading skeleton (which hid **Manage Staff** until `/api/departments` finished); only the departments table area skeletons. **`Button`** wraps `leftIcon` / `rightIcon` in **`pointer-events-none`** so SVGs cannot block clicks. **`Modal`** uses **`useLayoutEffect`** to mark portaled content ready before paint.
- **Settings & IT staff users (admin-only)** — `settings/layout.tsx` gates all `/settings/*` routes to `ADMIN`. **`/settings`** hub and **`/settings/users`** for listing users, **Add user**, role (`ADMIN`/`MEMBER`), active flag; APIs `GET`/`POST /api/users`, `PATCH /api/users/[id]`; `user.service.ts` prevents demoting or deactivating the last active administrator. Sidebar **Settings** uses `adminOnly` + `isAdmin` from the dashboard layout. First admin remains from **`db:seed`**.
- **Asset detail actions (admin workflow)** — Asset detail page (`/assets/[id]`) now supports **Edit Asset** (prefilled modal form using `PATCH /api/assets/[id]`) and **Delete Asset** (confirmation + `DELETE /api/assets/[id]`, with active-assignment safeguards from the service layer).
- **Asset category management (admin workflow)** — Categories page (`/categories`) now supports in-row **Edit** and **Delete** actions; `CategoryForm` is reused for create/edit, and API now includes `PATCH`/`DELETE /api/assets/categories/[id]` with duplicate-name/prefix and in-use delete protection.
- **API hardening (admin/member access)** — Added shared route guards in `src/lib/api-auth.ts` and applied them to assets/categories/buildings/departments/employees APIs: authenticated access for reads and admin-only mutations. Extended the same pattern to **rooms** (was previously open), **stock** routes, **asset assignments**, and **users** APIs for consistent `401`/`403` handling.
- **Reports (Phase 8 initial slice)** — Implemented `/reports` page with summary metrics and Excel/PDF exports driven by `report.service.ts`.

---

## Deployment — (Pending)

### Suggested next tasks (team)

1. **Phase 8 — Reporting follow-up** — Add filters/date ranges and wider report coverage as needed.
2. **API consistency sweep** — Align remaining routes to shared auth guard helpers where applicable.
3. **UX follow-up** — Organization / modals after API and reporting behavior is stable.
