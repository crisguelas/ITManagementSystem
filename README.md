# IT Management System

**A web-based IT asset and inventory system for your IT department** — track hardware, locations, employees, stock, and assignments in one place.

---

## Overview

The IT Management System (ITMS) helps IT teams manage the full lifecycle of equipment: procurement through disposal, stock room inventory with transaction logs, and reporting (PDF/Excel) where implemented. It is intended for internal use; **run it on trusted networks**, protect your database, and **never commit secrets** (see [Security](#security)).

---

## Features

### Core
- **Asset management** — CRUD for PCs, laptops, monitors, printers, peripherals; auto-generated asset tags (`{GLOBAL_PREFIX}-{CATEGORY_PREFIX}-{NUMBER}`), QR codes link to the asset record (by id), specs
- **PC numbering** — Optional separate PC numbers (e.g. `C000001`)
- **MAC & serial** — Track network devices and equipment identifiers
- **Categories** — Custom asset categories with tag prefixes; dedicated UI at **`/categories`** (sidebar: Assets → Categories) to list and add categories

### Locations & people
- **Buildings & rooms** — Campus or office structure; register buildings and **rooms** under **Organization → Places** (room form posts to `/api/rooms`)
- **Departments** — Organizational units
- **Employees** — Names, titles, departments, contact info

### Stock room
- **Stock categories & items** — Quantities, low-stock thresholds
- **Transactions** — IN, OUT, RETURN, ADJUSTMENT with audit fields

### Assignment & tracking
- **Assignments** — Assign assets to employees and/or rooms; return workflow and history

### Dashboard
- **Summary metrics**, **charts** (category, status, location), **recent activity**, **quick links**

### Security & access
- **Roles** — Administrator and Member (extend as needed)
- **Authentication** — NextAuth.js with hashed passwords
- **Settings (administrators only)** — Sidebar **Settings** is visible only to users with role `ADMIN`. Under **`/settings`** you can open **User accounts** (`/settings/users`) to add IT staff logins, set roles, and activate/deactivate users (the first admin still comes from `npm run db:seed`)
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

After a successful seed, sign in with the **email** you set in `SEED_ADMIN_EMAIL` and the **password** from `SEED_ADMIN_PASSWORD`. **Change the password** after first login if your deployment allows user password updates.

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

- **Cloud (e.g. Vercel):** connect the repo, set environment variables in the provider dashboard (same variables as above; never paste secrets into public issues). The build runs **`prisma generate`** before `next build` (and again after `npm install` via `postinstall`) so Prisma Client is always generated on Vercel’s cached installs.
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
