# IT Management System

**A web-based IT asset and inventory system for your IT department** — track hardware, locations, employees, stock, and assignments in one place.

---

## Overview

The IT Management System (ITMS) helps IT teams manage the full lifecycle of equipment: procurement through disposal, stock room inventory with transaction logs, and reporting (PDF/Excel) where implemented. It is intended for internal use; **run it on trusted networks**, protect your database, and **never commit secrets** (see [Security](#security)).

---

## Features

### Core
- **Asset management** — CRUD for PCs, laptops, monitors, printers, peripherals; auto-generated asset tags (`{GLOBAL_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}`), QR labels currently encode an IMC ownership text notice (temporary pre-deployment mode), specs. **Register Asset** can optionally **pull 1 unit** from a stock line that still has available quantity, creating the asset and recording a stock **OUT** transaction
- **PC numbering** — Optional separate PC numbers (e.g. `C000001`)
- **MAC & serial** — Track network devices and equipment identifiers
- **Unified categories** — Asset classification now uses **Stock categories** as the single source of truth
- **Audit lock on edits** — Assets with assignment history are read-only for edits to preserve historical integrity

### Locations & people
- **Buildings & rooms** — Campus or office structure; register buildings and **rooms** under **Organization → Places** (room form posts to `/api/rooms`)
- **Departments** — Organizational units
- **Employees** — Names, titles, departments, contact info; add staff from **Organization → Teams & People** (**Add Employee** opens a dialog; `POST /api/employees`). Employee forms support **Mobile (Optional)** and **Phone Ext. (Optional)**, and the employees table shows human-readable titles (`Mr.`, `Ms.`, `Dr.`, `Prof.`). The **Add Employee** action stays visible while departments load (only the table area shows a skeleton). Modals render in a **portal** above the dashboard UI.

### Stock room
- **Stock categories & items** — Quantities, low-stock thresholds
- **Auto-generated SKU** — New stock items receive system-generated SKU values (`STK-000001`, `STK-000002`, ...)
- **Transactions** — IN, OUT, RETURN, ADJUSTMENT with audit fields
- **Audit lock on edits/deletes** — Stock items with transaction history cannot be edited or deleted

### Assignment & tracking
- **Assignments** — Assign assets to employees and/or rooms; return workflow and history

### Dashboard
- **Summary metrics**, **charts** (category, status, location), **recent activity**, **quick links**
- **Responsive dashboard shell** — Mobile uses a hamburger-triggered top-sheet sidebar with backdrop/close controls; desktop collapses to an icon-only rail (hides labels) and keeps the sidebar pinned to viewport height while content scrolls

### Reporting
- **Reports hub** — **`/reports`** with Excel (assets, stock transactions, **low-stock lines**, **employees**) and a multi-section PDF summary
- **Date range** — Optional query `?from=YYYY-MM-DD&to=YYYY-MM-DD` filters assets, stock transactions, and **employees** by **created** time (UTC day bounds); leave either side open for an open-ended range. **Low-stock** exports are always a current snapshot (quantity vs minimum), not limited by that range

### Security & access
- **Roles** — Administrator and Member (extend as needed)
- **Authentication** — NextAuth.js with hashed passwords
- **Settings (administrators only)** — Sidebar **Settings** is visible only to users with role `ADMIN`. Under **`/settings`** you can open **User accounts** (`/settings/users`) to add IT staff logins, set roles, and activate/deactivate users instead of deleting them so historical records remain intact. Deactivated accounts are blocked from sign-in until reactivated (the first admin still comes from `npm run db:seed`)
- **Audit-oriented** fields on key actions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v5 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL (local, cloud, or container)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd it-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and **seed credentials** (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) before running the seed script.

4. **Database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Run locally**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or your `NEXTAUTH_URL`).

### First login

After a successful seed, sign in with:
- Email: `admin@itms.imc`
- Password: `admin123`

Change the password after first login.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (use strong DB credentials; restrict network access) |
| `NEXTAUTH_SECRET` | Session encryption — use a long random value (e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL of the app |
| `SEED_ADMIN_EMAIL` | Email for the initial admin user (optional; defaults in `.env.example`) |
| `SEED_ADMIN_PASSWORD` | **Required** for `npm run db:seed` — choose a strong password; not stored in the repo |
| `ASSET_TAG_PREFIX` | Optional. Global part of auto-generated tags (A–Z / 0–9, max 8 chars). Default: `AST` |

See `.env.example` for placeholders. **Do not commit `.env`.**

---

## Security

- **Never commit** `.env` or real connection strings, API keys, or session secrets.
- Use **strong, unique** `NEXTAUTH_SECRET` and database passwords in every environment.
- Restrict database access by **firewall/VPC**; use TLS for remote PostgreSQL where possible.
- Treat this app as **internal** — deploy behind authentication and HTTPS in production.
- Review **seed and admin** access after deployment; rotate credentials if a secret was exposed.

---

## Project structure (abbreviated)

```
src/
├── app/           # App Router: pages & API routes
├── components/    # Shared UI
├── features/      # Feature modules
├── lib/           # Prisma, auth, services, validations
prisma/
├── schema.prisma
└── seed.ts
```

---

## API routes (summary)

Handlers live under `src/app/api/`. Most responses use **`{ success: true, data }`** or **`{ success: false, error }`**.

| Methods | Path | Purpose |
|---------|------|---------|
| *(NextAuth)* | `/api/auth/[...nextauth]` | Sign-in, session, callbacks |
| `GET`, `POST` | `/api/assets` | List / create IT assets |
| `GET`, `PATCH`, `DELETE` | `/api/assets/[id]` | Single asset (detail), update, delete |
| `GET`, `POST` | `/api/assets/categories` | Compatibility alias for unified stock categories |
| `PATCH`, `DELETE` | `/api/assets/categories/[id]` | Compatibility alias for unified stock categories |
| `POST` | `/api/assets/[id]/assignments` | Assign asset to employee and/or room |
| `POST` | `/api/assets/[id]/assignments/return` | Return asset from assignment |
| `GET`, `POST` | `/api/buildings` | List / create buildings |
| `PATCH`, `DELETE` | `/api/buildings/[id]` | Update / delete a building |
| `GET`, `POST` | `/api/rooms` | List / create rooms |
| `PATCH`, `DELETE` | `/api/rooms/[id]` | Update / delete a room |
| `GET`, `POST` | `/api/departments` | List / create departments |
| `PATCH`, `DELETE` | `/api/departments/[id]` | Update / delete a department |
| `GET`, `POST` | `/api/employees` | List / create organization employees |
| `PATCH`, `DELETE` | `/api/employees/[id]` | Update / deactivate an employee |
| `GET`, `POST` | `/api/stock-categories` | List / create stock categories |
| `PATCH`, `DELETE` | `/api/stock-categories/[id]` | Update / delete stock category |
| `GET`, `POST` | `/api/stock-items` | List / create stock items |
| `GET`, `PATCH`, `DELETE` | `/api/stock-items/[id]` | Get / update / delete stock item |
| `POST` | `/api/stock-items/[id]/convert-to-asset` | Convert 1 stock unit into a tracked asset (strict, atomic) |
| `GET`, `POST` | `/api/stock-transactions` | List / create stock transactions |
| `GET`, `POST` | `/api/catalog-items` | List / create unified catalog items |
| `GET`, `PATCH`, `DELETE` | `/api/catalog-items/[id]` | Get / update / delete a catalog item |
| `GET`, `POST` | `/api/users` | List / create **IT staff login** users |
| `PATCH`, `DELETE` | `/api/users/[id]` | Update login user (name, role, active, password) or delete |
| `POST` | `/api/account/change-password` | Change password for current authenticated user |

**Auth notes (current code):** Shared guards from `src/lib/api-auth.ts` are used across `app/api`: **`requireSession`** for authenticated reads and staff actions (stock listings/transactions, asset assignments/returns, **`/api/rooms` GET**), **`requireAdmin`** for privileged mutations (assets/categories/buildings/departments/employees, **`/api/rooms` POST**, and **`/api/users`**). **Update this table** when you add or change routes.

---

## Next steps (suggested)

1. **Phase 8 — Reporting** — Extend report exports (filters/date ranges and additional datasets) after the initial `/reports` delivery.
2. **Remaining API hardening sweep** — Keep aligning any route not yet covered by `requireSession` / `requireAdmin` to a consistent authorization pattern.
3. **UX polish** — Revisit any UI deferred during API/reporting work (e.g. organization modals) once responses and errors are stable.

---

## Functional verification log (April 20, 2026)

This run focused on verifying that system navigation, interactive controls (buttons/links), and core user actions are wired correctly and compile cleanly.

### Build and code-quality checks

- `npx tsc --noEmit` — **Pass**
- `npm run lint` — **Pass** with **2 warnings** (`react-hooks/incompatible-library` on React Hook Form `watch()` usage in stock forms; no lint errors)
- `npm run build` — **Pass** (all dashboard and API routes compiled and generated)

### Navigation and link checks

- Sidebar navigation (`Dashboard`, `Assets`, `Organization`, `Stock Room`, `Reports`, `Settings`) maps to existing pages.
- Dashboard quick-action links route to `assets`, `organization`, and `stock`.
- Detail-page links (`/assets/[id]`, `/stock/[id]`) and back links are present and correctly targeted.
- Settings links route to `/settings/users` and remain role-gated by admin checks.

### Button and action wiring checks

- Form submit/cancel controls are connected via `react-hook-form` `handleSubmit` and modal close handlers.
- CRUD action buttons exist and are wired in key modules:
  - Assets (`create`, `edit`, `delete`, assignment `assign/return`, print)
  - Asset categories (`create`, `edit`, `delete`)
  - Buildings/rooms/departments/employees (`create`, `edit`, `delete/deactivate`)
  - Stock items/categories/transactions (`create`, `edit`, `delete`, add transaction)
  - Reports (`apply/clear date filter`, export buttons for all datasets)
  - User accounts (`create`, role/active updates)
- Confirmation and modal actions (`confirm-dialog`, `modal` close/overlay controls) are wired and reusable.

### Scope note

This verification run confirms compile-time integrity and code-path wiring for links/buttons/functions. Final UI behavior should still be validated with the manual smoke checklist before production deployment (especially DB-backed CRUD with environment-specific data and roles).

Use the release sign-off checklist in `MANUAL_QA_CHECKLIST.md` for a strict, screen-by-screen QA run.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:migrate` | Migrations (when used) |
| `npm run db:seed` | Seed data (requires `SEED_ADMIN_PASSWORD`) |
| `npm run db:studio` | Prisma Studio |

---

## Deployment (overview)

- **Cloud (e.g. Vercel):** connect the repo, set environment variables in the provider dashboard (same variables as above; never paste secrets into public issues). The build runs **`prisma db push`** then **`prisma generate`** before `next build` (and again after `npm install` via `postinstall`) so the database schema stays in sync and Prisma Client is always generated on Vercel’s cached installs.
- **Self-hosted:** build with `npm run build`, run `npm run start`, protect with HTTPS and a reverse proxy, and keep secrets in environment variables or a secrets manager.

---

## License

Use and redistribution are at **your organization’s discretion**. This template does not grant a specific public license unless you add one.

---

## Contributing / maintainers

Maintained by **your IT department** or project owners. Replace this section with your own policy if you open the repo to collaborators.

---

## Asset tags & QR codes

- **Format:** `{ASSET_TAG_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}` (e.g. `AST-PC-0001`). Set optional **`ASSET_TAG_PREFIX`** in `.env` (default **`AST`**). Category prefixes come from your asset categories.
- **QR labels:** The QR code points to **`/assets/{id}`** (the database id), not the tag string, so labels stay scannable even if you change the tag prefix later.
- Existing rows in the database are **not** rewritten when you change `ASSET_TAG_PREFIX`; only **new** assets use the new prefix.
