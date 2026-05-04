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
- Created layout components (Sidebar, Header)
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
- Audited navigation and interactions in dashboard pages/components (sidebar, quick links, forms, modals, CRUD action buttons, report export actions).
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
- **Responsive sidebar fix (April 21)** — Resolved regression where the mobile hamburger menu closed immediately and the desktop sidebar could disappear after mobile-state transforms. `ResponsiveDashboardShell` now passes stable open/close callbacks, and `Sidebar` explicitly resets desktop vertical transform (`md:translate-y-0`).
- **Desktop sidebar behavior update (April 21)** — Updated desktop toggle behavior to icon-only collapse (hide labels while keeping menu icons visible) and kept the sidebar pinned full-height during page scrolling.
- **Assets module tabs (April 23)** — Consolidated **All Assets** and **Categories** into tabs under `/assets` and simplified sidebar navigation to a single **Assets** item; legacy `/categories` now redirects to `/assets?tab=categories`.

### Data integrity and stock UI hardening — April 21, 2026

- **QR temporary mode (current)** — Updated asset QR payload to plain IMC ownership text (no URL redirect) while deferring dynamic public scan URLs to pre-deployment tasks.
- **Asset edit lock by history** — Prevented asset edits once any assignment history exists (service + API `409` + disabled Edit button in asset detail UI).
- **Stock item edit lock by history** — Prevented stock item edits when transaction history exists (service + API protection + disabled Edit button in Stock Room table).
- **Stock actions visual consistency** — Standardized Stock Room item action controls to labeled buttons (`Transact`, `View`, `Edit`, `Delete`) for layout parity with other sections.
- **Stock SKU automation** — Removed manual SKU entry from Stock Item forms and now auto-generate SKU codes in the service layer using `STK-######` sequencing to enforce consistent unique identifiers.

### Post-phase enhancements quality check — April 20, 2026

- `npx eslint src/components/layout/header.tsx` — pass.
- `npx eslint src/features/settings/users-management-view.tsx` — pass.
- `npx tsc --noEmit` — pass.

### Post-phase enhancements quality check — April 21, 2026

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass.
- `npm run build` — pass.

---

## Phase 9: Unified Catalog + Pull-from-Inventory Assets — (Completed)

### Goal

Unify inventory items and assets under a shared **Catalog** concept so that assets can be created by **pulling (converting)** from inventory while preserving:

- **Stock ledger integrity** (transactions + low-stock thresholds)
- **Asset lifecycle integrity** (per-unit identifiers, status, assignment history)
- **Strict conversion**: do **not** allow converting to an asset when stock quantity is \(< 1\)

### Key decisions

- Use a **Catalog + Instances** model:
  - **Catalog (what it is)** — shared fields like name/category/brand/model/unit
  - **Stock (how many)** — SKU + quantities + thresholds + storage location + transaction history
  - **Asset (this unit)** — tag/serial/MAC/specs/status + assignment history, linked back to Catalog
- Add a first-class “Create asset from inventory” flow that:
  - Prefills shared catalog fields from the selected inventory item
  - Creates an **OUT** stock transaction (or a dedicated conversion transaction type) to decrement quantity
  - Creates a new asset instance linked to the same catalog identity

### Planned tasks

#### Data model (Prisma)

- Add a shared `CatalogItem` (or `Product`) model for unified fields:
  - `name`, `category`, `brand`, `model`, `unit`
  - Optional: spec defaults/template fields if desired later
- Link `StockItem` → `CatalogItem` and `Asset` → `CatalogItem` (enforcing referential integrity).
- Decide how to unify **categories**:
  - Either merge asset categories + stock categories into Catalog categories, or keep existing tables and map them into Catalog.

#### Validation & services

- Add Zod schemas for:
  - Catalog creation/update
  - “Convert stock to asset” request payload (stock item id + asset instance fields)
- Add service-layer workflow for conversion:
  - Validate stock availability (strict mode)
  - Create stock transaction atomically with asset creation
  - Ensure consistent error handling and HTTP statuses

#### API routes

- Add routes for Catalog CRUD as needed (admin-gated where appropriate).
- Add an API endpoint to create an asset from a stock item (authenticated; admin-gated if consistent with asset creation rules).
- Update `README.md` → **API routes (summary)** to include any new handlers.

#### UI / UX

- Add a unified “Add” experience:
  - Create inventory item
  - Create asset
  - **Create asset from inventory** via **Register Asset** (optional stock source dropdown → submit converts)
- Ensure loading/error/empty states follow project standards (skeleton, retry, empty state).
- Ensure existing **edit locks** still apply:
  - Assets lock once assignment history exists
  - Stock items lock once transaction history exists (conversion should count as transaction history)

#### Reporting & dashboard implications (follow-up)

- Confirm reports that include assets and stock can now group/roll-up by Catalog identity.
- Optionally add a “Converted to assets” view/report for auditability.

### Phase 9 quality check — April 24, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test:
  - [x] **Register Asset** supports an optional **available stock** selector
  - [x] Converting stock → asset creates a new asset and records an OUT transaction (inventory decremented by 1)

### Phase 9 UX follow-up — April 25, 2026

- Moved the stock → asset conversion entry point to **Assets → Register Asset** (stock source dropdown) and removed the per-stock **Create Asset** button from stock item detail pages.

#### Phase 9 UX follow-up quality check — April 25, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Deployment — (Pending)

### Suggested next tasks (team)

1. **Phase 8 — Reporting follow-up** — Add filters/date ranges and wider report coverage as needed.
2. **API consistency sweep** — Align remaining routes to shared auth guard helpers where applicable.
3. **UX follow-up** — Organization / modals after API and reporting behavior is stable.
4. **Pre-deployment QR scan enhancement (required before go-live)** — Replace temporary plain-text QR payloads with dynamic public scan URLs (`/scan/assets/{id}`) served from a fixed production domain (for example `NEXT_PUBLIC_QR_BASE_URL`) so printed labels always show current assignment/availability without requiring app login or Vercel authentication.

---

## Unified category + reset migration — April 25, 2026

- Performed schema-only backup to `backups/db-schema-backup.sql` (no row data).
- Hard reset database to a zero-data baseline (including users and history tables).
- Removed `AssetCategory` model and switched assets to `StockCategory` relation (`stockCategoryId`).
- Switched stock identity fields from `name` to required `brand` + `model`.
- Updated conversion, reporting, dashboard activity, and notification naming to use `brand + model`.
- Simplified Assets module by removing the categories tab from `/assets`; legacy `/categories` now redirects to `/assets`.
- Updated seed behavior to require environment-provided admin credentials:
  - Email: `SEED_ADMIN_EMAIL`
  - Password: `SEED_ADMIN_PASSWORD`

### Migration quality check — April 25, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Organization employee contact + title UX polish — April 26, 2026

- Updated Employee registration/edit forms under **Organization → Teams & People**:
  - Renamed `Phone (optional)` to `Mobile (Optional)`.
  - Added `Phone Ext. (Optional)` and persisted it through Prisma, API validation, and employee CRUD handlers.
- Updated the **Registered Employees** table:
  - Title now renders with friendly display labels (`Mr.`, `Ms.`, `Dr.`, `Prof.`) instead of enum caps.
  - Added `Mobile / Ext` column to show contact details consistently.
- Updated docs in `README.md` to reflect the new employee contact fields and title display behavior.

### Employee contact/title quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Organization rooms table + room CRUD — April 26, 2026

- Added a **Rooms table** under **Organization → Places** (Manage Rooms) to display room data with consistent table styling.
- Extended **RoomForm** to support **edit mode** (PATCH) in addition to room registration (POST).
- Added room CRUD routes: `PATCH`/`DELETE /api/rooms/[id]` with service-layer uniqueness and assignment safety checks.

### Rooms table/CRUD quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Assets registration UX + IP address identifier + Building rooms view — April 26, 2026

- Assets → Register Asset: removed the explicit “None — register without consuming stock” dropdown option while keeping blank selection as the default non-consuming behavior.
- Assets: added `ipAddress` as an optional **unique** identifier (Prisma + Zod validation + API normalization + service uniqueness checks).
- Organization → Places & Locations: added a Buildings **View** action linking to `/organization/buildings/[id]` to display all rooms registered under the building.

### Assets/Buildings updates quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Organization declutter two-step (step 1 + split workspace) — April 26, 2026

- Removed the global **Registered Rooms** table from **Organization → Places & Locations** to declutter the main page and keep Places focused on buildings.
- Added building-context room management on **`/organization/buildings/[id]`**:
  - `Add Room` modal on the building detail page
  - row-level `Edit` and `Delete` actions in the rooms table
- Extended `RoomForm` with a fixed-building mode so room CRUD in building detail no longer needs a building selector.
- Updated **`/organization`** from tab-style controls to a split workspace layout:
  - Left navigation panel (`Teams & People`, `Places & Locations`)
  - Right focused content area with **Employees as default**

### Organization declutter quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test (manual flow verification):
  - [x] Organization defaults to Teams & People view
  - [x] Places page shows buildings only with View/Edit/Delete actions
  - [x] Building detail supports room Add/Edit/Delete via modals
  - [x] Loading/error/empty states still render for organization/building views

---

## Organization top tabs + UI-only department split — April 26, 2026

- Reverted the Organization landing page back to a **top-tab** layout.
- Set **Registered Employees** as the default Organization tab.
- Split Organization views into:
  - `Registered Employees`
  - `Academic Departments` (with in-view toggle to `Admin`)
  - `Places & Locations`
- Extracted department management into a dedicated `DepartmentsView` and moved department CRUD out of `EmployeesView`.
- Implemented **UI-only Academic/Admin grouping** with keyword matching on department names and an **Unclassified** indicator for unmatched names.
- Kept existing Places flow intact (buildings table in Organization and room CRUD in building detail page).

### Organization top tabs quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test (manual flow verification):
  - [x] `/organization` opens on Registered Employees by default
  - [x] Top tabs switch correctly between Employees, Departments, and Places
  - [x] Department view toggles Academic/Admin and shows Unclassified entries
  - [x] Employee CRUD and Places/building-room flows remain functional

---

## Organization departments bucket rollback — April 26, 2026

- Removed the UI-only Academic/Admin department bucket split from **Organization → Academic Departments**.
- Removed keyword-based bucket classification and the Unclassified indicator from department management UI.
- Kept the Organization top-tab layout and tab naming intact while returning department management to a single unified list.

### Organization departments bucket rollback quality check — April 26, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test (manual flow verification):
  - [x] Departments tab lists all departments in one table without Academic/Admin toggle
  - [x] Department Add/Edit/Delete actions remain functional
  - [x] Employees and Places tabs remain functional

---

## Global search + employee profile delivery — April 27, 2026

- Added an authenticated global search API (`GET /api/search`) for employee-first suggestions across:
  - employee ID, employee name, employee email, mobile, assigned PC number, and assigned room number
  - unassigned asset matches (PC/asset identifiers) as fallback results that route to `/assets/[id]`
- Added global search UI in the shared dashboard header with:
  - debounced query requests
  - suggestion dropdown states (loading, empty, error)
  - keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`)
- Added an employee profile API (`GET /api/employees/[id]/profile`) returning:
  - employee identity/contact fields
  - active assignment location fields (building, room number/name, floor)
  - assigned asset details for conditional rendering scenarios
- Added employee profile page at `/organization/employees/[id]`:
  - employee info card (name, ID, department, contact, position)
  - active assignments with location context
  - conditional asset details:
    - desktop/laptop: PC number, brand/model, IP, MAC, OS, RAM, storage
    - VoIP phone: phone extension, brand/model, MAC
    - printer/other: available non-empty fields only

### Global search/profile quality check — April 27, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Documentation + comment standardization sweep — April 27, 2026

- Updated `README.md` to align current behavior and naming:
  - inventory/navigation wording
  - header notifications and global search feature notes
  - expanded auth-guard notes for API routes
  - QR behavior description aligned to current temporary mode
- Performed a full-repo comment quality pass aligned to `AGENTS.md`:
  - added missing function-level comments in service layers
  - added handler-level comments in API routes
  - added missing file headers and component JSDoc in prioritized dashboard/feature components

### Documentation/comment sweep quality check — April 27, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Prisma schema cleanup + full DB map — April 27, 2026

- Performed pre-change backups before schema updates:
  - Data snapshot: `backups/db-data-backup-20260427-221407.json`
  - Schema snapshot: `backups/schema-prisma-backup-20260427-221319.prisma`
- Cleaned unused Prisma schema items verified as non-operational in current code paths:
  - Removed `Asset.specs`
  - Removed `Asset.purchaseDate`
  - Removed `Asset.warrantyExpiry`
  - Removed `Asset.notes`
  - Removed unused direct `StockItem.assetId -> Asset` relation
- Aligned service/type usage after schema cleanup:
  - Removed `stockItem` include from asset detail service response
  - Removed `stockItem` field from `AssetWithRelations` shared type
- Added full schema architecture documentation and chart:
  - `docs/db-schema.md` with model summary, enum list, relationship map, cardinality notes, and Mermaid diagram.
- Updated README project structure/features wording to match cleaned schema and new DB documentation.

### Prisma schema cleanup quality check — April 27, 2026

- [x] `npx prisma validate` — pass
- [x] `npm run db:push` — pass
- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test scope (code-path validation):
  - [x] Assets list/detail/update/delete and assignment API flows still compile and pass build/type checks
  - [x] Stock, conversion, dashboard, reporting, and auth APIs still compile and pass build/type checks

---

## Secrets exposure audit + hardening — April 27, 2026

- Removed hard-coded seed credentials from `prisma/seed.ts` and switched bootstrap admin creation to required env values (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- Added seed safeguards:
  - explicit failure when credentials are missing
  - minimum password length validation
  - removed plaintext password logging
- Removed explicit default password references from tracked docs:
  - `README.md`
  - `DEVELOPMENT_HISTORY.md`
- Added backup leak prevention in `.gitignore` for local generated backup artifacts:
  - `backups/db-data-backup-*.json`
  - `backups/schema-prisma-backup-*.prisma`
  - `backups/db-full-backup-*.sql`
- Added credential exposure assessment document:
  - `docs/secret-exposure-report.md`
- Added automated CI secret scan workflow:
  - `.github/workflows/secret-scan.yml` (gitleaks on `push`/`pull_request`).

### Secrets hardening quality check — April 27, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Authentication session hardening — April 28, 2026

- Configured NextAuth JWT sessions to use an explicit **12-hour absolute expiration**.
- Kept the existing JWT session strategy and route protection flow unchanged, so authenticated users continue to access protected routes normally until the token expires.
- Updated `README.md` to document the enforced 12-hour sign-in window.

### Authentication session hardening quality check — April 28, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [x] Smoke test scope — verified the JWT session strategy still protects authenticated pages/APIs through the existing middleware and `requireSession` / `requireAdmin` guards, and confirmed the new configuration enforces a 12-hour absolute session lifetime at the auth layer

---

## Login cleanup + moderate hardening — April 29, 2026

- Re-audited the repository auth paths and confirmed temporary debug workflow instrumentation is fully removed (no debug ingest endpoints/session traces remain in tracked source files).
- Added lightweight credentials login abuse protection in `src/lib/auth-rate-limit.ts` and integrated it into `src/lib/auth.ts`:
  - Per email + client IP failure tracking
  - Temporary lockout after repeated failed attempts
  - Short progressive backoff delay on failures
- Kept login responses generic (`null` from credentials authorize on failure paths) to avoid user/account enumeration leakage.
- Updated `README.md` authentication notes to include credentials sign-in throttling behavior.

### Login cleanup/moderate hardening quality check — April 29, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for valid login, invalid credentials, and repeated-failure lockout/backoff behavior

---

## Sidebar settings dropdown + mobile header search UX fix — April 29, 2026

- Updated `src/components/layout/sidebar.tsx` so the **Settings** submenu still opens on active `/settings*` routes, while manual dropdown state is auto-cleared when navigating away from Settings pages.
- Updated the global header search UX for mobile in `src/components/layout/header.tsx` + `src/components/layout/global-search.tsx`:
  - Mobile now shows a clickable search icon by default.
  - Clicking search expands the input inline in the header.
  - Added an explicit close button and Escape-key close support for the expanded mobile search state.
  - Prevented header title/action overlap at mobile widths by conditionally hiding non-search actions while search is expanded.

### Sidebar/search UX fix quality check — April 29, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for Settings submenu auto-hide on non-settings routes, mobile search icon expand/collapse behavior, and no title/search overlap on small screens

---

## Organization table mobile UX + toolbar unification — April 29, 2026

- Updated `src/features/organization/employees-view.tsx` toolbar to a responsive Assets-like layout:
  - Search field now uses full-width mobile behavior with `sm` constrained width.
  - **Add Employee** button now remains visible and tappable on small screens.
- Updated all Organization tab tables for mobile horizontal scrolling behavior consistent with Assets:
  - `src/features/organization/employees-view.tsx`
  - `src/features/organization/departments-view.tsx`
  - `src/features/organization/locations-view.tsx`
- Added `overflow-x-auto` table wrappers, table `min-w-*` constraints, and `whitespace-nowrap` on key columns/action cells to prevent clipping of right-side action buttons on narrow widths.
- Standardized top toolbar/action spacing in Departments and Locations tabs to match Employees/Assets visual rhythm.

### Organization table UX quality check — April 29, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for horizontal scroll visibility in all 3 Organization tabs and Add Employee action visibility on small-screen widths

---

## Sidebar auto-hide + employee button stability follow-up — April 29, 2026

- Updated `src/components/layout/sidebar.tsx` dropdown open logic to prevent **Settings → User Accounts** from staying visible after navigating to non-settings routes.
- Kept route-aware behavior for settings pages while preserving parent/child active styling.
- Updated `src/features/organization/employees-view.tsx` toolbar responsiveness to avoid Add Employee text wrapping/splitting:
  - Delayed side-by-side search/button layout to larger widths (`lg`).
  - Kept button one-line with `whitespace-nowrap` and stable width behavior.
  - Kept button right-aligned on wider layouts and full-width fallback on narrower layouts.

### Sidebar/button follow-up quality check — April 29, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for settings submenu hide behavior and Add Employee one-line rendering at narrow desktop/tablet widths

---

## Assets/Inventory add-button responsive parity — April 29, 2026

- Updated add-action button behavior to match Organization `Add Building` responsiveness (full-width on mobile, auto-width from `sm` and up):
  - `src/features/assets/asset-table.tsx` (`Register Asset`)
  - `src/features/stock/stock-items-tab.tsx` (`Add Item`)
  - `src/features/stock/stock-categories-tab.tsx` (`Add Category`)
- Updated Inventory tab card headers to use mobile-stacked layout with consistent spacing and alignment, then switch to horizontal alignment on larger screens.

### Assets/Inventory button parity quality check — April 29, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for mobile button width behavior and desktop alignment on Assets/Inventory pages

---

## Organization terminology alignment (Units) + employees email column — April 30, 2026

- Updated organization tab and table terminology from department-centric labels to unit-centric labels:
  - Organization tab: **Academic Departments** → **Academic & Administrative Units**
  - Departments table header: **Department Name** → **Unit Name**
  - Employees table header: **Department** → **Unit**
- Added **Email** column to **Organization → Registered Employees** table.
- Updated related Organization modal/button/empty-state labels to use **Unit** terminology consistently.
- Updated `README.md` location/people feature wording to reflect unit naming and employee table email visibility.

### Organization terminology/email quality check — April 30, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Organization terminology follow-up (Unit naming consistency) — April 30, 2026

- Updated **Organization → Registered Employees** form terminology:
  - Employee form label `Department` → `Unit`
  - Employee form placeholder `Select department` → `Select unit`
  - Empty-state helper text now instructs users to add a **unit** first.
- Updated **Organization** unit tab naming:
  - Tab title `Academic & Administrative Units` → `Academic & Administrative`
  - In-tab card/table title `Academic & Administrative Units` → `Academic & Administrative`
- Updated **Unit form** terminology:
  - Field label `Department Name` → `Unit Name`
  - Add action button `Add Department` → `Add Unit`
- Updated employee profile page (`/organization/employees/[id]`) field label:
  - `Department` → `Unit`
- Updated `README.md` feature wording to match the final tab name.

### Organization terminology follow-up quality check — April 30, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Organization terminology rollback (Department labels) — April 30, 2026

- Rolled back Organization-facing terminology from **Unit** to **Department** in key employee/department screens while keeping inventory measurement `unit` unchanged.
- Updated **Organization → Registered Employees**:
  - Table header `Unit` → `Department`
  - Search placeholder wording to use `department`
  - Employee form label/placeholder `Unit`/`Select unit` → `Department`/`Select department`
  - Empty-state helper copy to instruct adding a **department** first
- Updated **Organization → Academic & Administrative**:
  - Table header `Unit Name` → `Department Name`
  - Action/button labels `Add Unit` → `Add Department`
  - Modal titles/descriptions `Add/Edit Unit` → `Add/Edit Department`
  - Department form field label `Unit Name` → `Department Name`
  - Department form submit label `Add Unit` → `Add Department`
- Updated employee profile page field label:
  - `/organization/employees/[id]`: `Unit` → `Department`
- Updated `README.md` feature wording to restore department terminology under Locations & People.
- Investigation result for recent unit rename scope:
  - Most recent naming commits (`39abbc7`, `a1be381`) changed UI/docs files only.
  - No database model/field rename was introduced (Prisma remains `Department` / `departmentId`).

### Organization terminology rollback quality check — April 30, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Authentication strict 12-hour forced re-login enforcement — April 30, 2026

- Added explicit absolute session-cutoff enforcement so authenticated users are forced to re-login after 12 hours from initial sign-in, even with continued activity.
- Persisted immutable `loginIssuedAt` in JWT/session callbacks for deterministic cutoff checks.
- Enforced absolute lifetime in both:
  - Edge route protection (`authorized` callback in auth config)
  - API guards (`requireSession` in `src/lib/api-auth.ts`) to return `401 Session expired` when cutoff is exceeded.
- Updated auth TypeScript declarations to include `loginIssuedAt` in Session/JWT typing.
- Updated `README.md` authentication wording to reflect strict forced re-login behavior.

### Authentication strict forced re-login quality check — April 30, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass

---

## Assets register form spec presets + condition removal — May 03, 2026

- Removed asset `condition` from the Prisma `Asset` model and removed all related condition handling in form validation, conversion logic, and reporting exports.
- Updated **Assets → Register Asset** system spec inputs to dropdown presets with an `Other` path that reveals editable custom fields:
  - Operating system: `Windows 10 Pro`, `Windows 11 Pro`, `Windows 7 Pro`, `Windows XP`, `Other`
  - RAM: `4GB DDR3`, `8GB DDR3`, `8GB DDR4`, `16GB DDR3`, `16GB DDR4`, `Other`
  - Storage: `512GB HDD`, `512GB SSD`, `1TB HDD`, `1TB SSD`, `Other`
- Preserved edit-mode compatibility: existing custom values that are not in presets automatically load as custom (`Other`) entries.
- Updated shared constants and reporting payloads so exports and downstream code no longer expect `condition`.

### Assets spec presets/condition removal quality check — May 03, 2026

- [x] `npx prisma generate` — pass
- [x] `npx prisma db push --accept-data-loss` — pass (`assets.condition` dropped)
- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for register/edit asset flows (preset selection, custom `Other` entry, reports export)

---

## Assets identifiers expansion + assignment duplicate-type warning — May 03, 2026

- Added new asset identifier fields in **Register Asset**:
  - `Remote Address` (for current AnyDesk/future remote tool address usage)
  - `Data Port` (for switch/data port tracking)
- Propagated the new fields through API normalization, validation, service-layer persistence, asset details view, employee profile asset details, and assets table identifier rendering.
- Enforced uniqueness safeguards for optional identifiers:
  - `MAC Address` now treated as unique (service checks + Prisma unique key)
  - `Serial Number` remains unique
  - `Remote Address` added as unique
  - (`PC Number` and `IP Address` uniqueness kept as-is)
- Added assignment safety warning flow on asset detail page:
  - When assigning to an employee who already has an active asset in the same category/type, the API returns a confirmation warning.
  - UI now prompts the user to continue or cancel instead of hard-blocking.

### Assets identifiers/assignment warning quality check — May 03, 2026

- [x] `npx prisma generate` — pass
- [x] `npx prisma db push --accept-data-loss` — pass
- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual browser verification for duplicate-assignment warning and new identifier fields

---

## Register asset identifiers layout + org employee view + building placeholders + assignment duplicate refinement — May 03, 2026

- **Register Asset** — **Identifiers (Optional)** uses a responsive grid with up to **three fields per row** (`md:grid-cols-3`) so six fields wrap to **two rows** on typical desktop widths (narrower breakpoints stack fewer columns).
- **Organization → Registered Employees** — Added row **View** action linking to `/organization/employees/[id]` (employee profile), consistent with Places **View** pattern.
- **Add Building** form placeholders updated: name `e.g. Building 01`, short code `B01`, description `Admin Building`.
- **Assign asset** — Same-category duplicate warning on submit (confirm to continue) unchanged in UX; **duplicate detection** now ignores the **current asset** so assigning the same unit again does not falsely warn against itself.

### Register/org/assignment polish quality check — May 03, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual verification (identifiers two-row layout, employee View navigation, building placeholders, assign duplicate warning for a second same-category asset)

---

## Assign asset duplicate warning — in-app alert UI — May 03, 2026

- Replaced the browser-native `confirm()` for same-category assignment conflicts with an **in-modal warning panel** in `AssetAssignModal` (amber alert styling aligned with low-stock / dashboard warning patterns).
- **Register New Asset** — Verified form fields, `assetSchema`, and `POST /api/assets` normalization remain aligned (identifiers, specs, stock link); no code changes required after review.
- **Continue assigning** retries `POST /api/assets/[id]/assignments` with `allowDuplicateTypeAssignment: true`; banner **Cancel** dismisses the prompt and shows a short helper message; main **Assign** stays disabled until the prompt is cleared.

### Assign duplicate in-app UI quality check — May 03, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test scope — pending manual verification (duplicate same-category assign → styled warning → continue vs cancel)

---

## Register Asset placeholders + RAM preset expansion — May 04, 2026

- **Register / edit asset** (`AssetForm`): updated example placeholders — Model `e.g. Optiflex 7020`, Data Port `e.g. Data 24`, IP Address `e.g. 10.1.7.155`.
- **RAM** dropdown presets in `src/lib/constants.ts`: `4GB DDR3`, `8GB DDR3`, `8GB DDR4`, `16GB DDR3`, `16GB DDR4`, `16GB DDR5`, `32GB DDR5`, plus existing **Other** path for custom RAM.
- **Lint** — `AssetAssignModal` body unmounts on close (content renders only when `isOpen`) so state resets between sessions without effect-driven `setState`; `prefer-const` applied on assignment fetch response.

### Register Asset placeholders/RAM quality check — May 04, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test — Assets → Register Asset (placeholders, RAM presets + Other)

---

## Server-side pagination for primary tables — May 04, 2026

- **List APIs** — `GET` on `/api/assets`, `/api/buildings`, `/api/departments`, `/api/employees`, `/api/stock-categories`, `/api/stock-items`, and `GET /api/assets/categories` now accept `page` / `pageSize` (defaults 1 / 20; allowed sizes 10–100) and return `data: { items, total, page, pageSize }`. Optional `q` supports server-side text search on assets, employees, stock lines/categories, buildings, and departments.
- **`GET /api/stock-items`** — optional `availableForAsset=true` filters to `quantity > 0` for register-from-stock pickers.
- **Notifications** — `GET /api/stock-items/low-stock` (DB-side `quantity <= minQuantity`, capped) and `GET /api/assets/recent-assignments` (latest open assignments) power the inventory low-stock banner and header bell without loading full inventories.
- **UI** — Shared `TablePagination` footer on Assets, Inventory (items + categories), Places & locations, Academic & administrative, and Registered employees; stock page uses dedicated low-stock fetch for the banner.
- **Validation** — Shared Zod list query parsing in `src/lib/validations/list-query.schema.ts`.

### Server-side pagination quality check — May 04, 2026

- [x] `npx tsc --noEmit` — pass
- [x] `npm run lint` — pass
- [x] `npm run build` — pass
- [ ] Smoke test — paginate/search each table; register asset stock source; header notifications; assign / stock transact employee dropdowns
