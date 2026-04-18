# Development History

**Project:** IT Management System (IT department use)  
**Started:** April 18, 2026

---

## Planning Phase — April 18, 2026

- Gathered requirements from IT department team (4 members)
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

## Phase 8: Reporting (PDF + Excel) — (Current)

---

## Deployment — (Pending)
