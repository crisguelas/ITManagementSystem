# AGENTS.md — Coding Standards & Rules

This document defines the strict coding standards and rules for this project.
All contributors (human and AI agents) MUST follow these rules without exception.
These rules are designed to be general and reusable across projects.

---

## Language & Framework

- **TypeScript strict mode** is mandatory. No `any` types allowed.
- **Next.js App Router** is the routing standard. Do not use Pages Router.
- **Tailwind CSS** is the only styling approach. Inline and Outline styles are strictly forbidden.
- All code must compile without TypeScript errors (`npx tsc --noEmit`).

---

## Core Libraries & Imports

Future developers must strictly use these approved libraries for their respective purposes to maintain consistency:

| Purpose | Approved Library | Import Example |
|---------|-----------------|----------------|
| **Form Handling** | `react-hook-form` | `import { useForm } from "react-hook-form";` |
| **Data Validation** | `zod` | `import * as z from "zod";` |
| **Form Resolvers** | `@hookform/resolvers/zod` | `import { zodResolver } from "@hookform/resolvers/zod";` |
| **Icons** | `lucide-react` | `import { Lock, Mail } from "lucide-react";` |
| **Database ORM** | `@prisma/client` | `import { prisma } from "@/lib/prisma";` |
| **Authentication** | `next-auth` (v5) | `import { signIn } from "next-auth/react";` |
| **Date Formatting** | Native `Intl` or `utils` | `import { formatDate } from "@/lib/utils";` |
| **Class Merging** | `clsx` via `cn` helper | `import { cn } from "@/lib/utils";` |

---

## Code Style & Formatting

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files & folders | kebab-case | `asset-form.tsx`, `stock-transactions/` |
| React components | PascalCase | `AssetForm`, `StockTable` |
| Variables & functions | camelCase | `getAssetById`, `handleSubmit` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_ROLE` |
| Types & interfaces | PascalCase | `AssetWithCategory`, `CreateAssetInput` |
| Enum values | SCREAMING_SNAKE_CASE | `AVAILABLE`, `IN_MAINTENANCE` |
| API routes | kebab-case | `/api/stock-transactions` |
| Database fields | camelCase | `serialNumber`, `createdAt` |
| CSS/Tailwind classes | Tailwind utility classes only | `className="bg-primary-500"` |

### General Rules
- Use `const` over `let`. Never use `var`.
- Use arrow functions for callbacks and component definitions.
- Use template literals over string concatenation.
- Destructure objects and arrays when possible.
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate.

---

## Comments & Documentation

### Mandatory Comments
Every piece of logic — whether small or large — must have a descriptive comment explaining:
1. **What** the code does
2. **Why** it exists (if not immediately obvious)

### Comment Format
```typescript
/* Calculates the total stock quantity after applying the transaction adjustment */
const updatedQuantity = currentQuantity + adjustmentAmount;

/* Checks if the user has admin privileges before allowing the delete operation */
if (user.role !== Role.ADMIN) {
  throw new UnauthorizedError("Only administrators can delete assets");
}
```

### Component Comments
Every component must have a top-level JSDoc comment:
```typescript
/**
 * AssetForm — Handles creation and editing of IT assets.
 * Supports all asset types with dynamic fields based on category.
 * Uses React Hook Form with Zod validation.
 */
export function AssetForm({ asset, onSubmit }: AssetFormProps) { ... }
```

### File Header Comments
Every file must start with a brief description:
```typescript
/**
 * @file asset-form.tsx
 * @description Form component for creating and editing IT assets
 */
```

---

## Component Architecture

### Loading & Error States
Every component that fetches data MUST implement:
1. **Loading state** — Show a skeleton loader or spinner while data is being fetched
2. **Error state** — Display a user-friendly error message with a retry option if the fetch fails
3. **Empty state** — Show a helpful message when no data exists

```typescript
/* Example pattern for data-fetching components */
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorDisplay message={error.message} onRetry={refetch} />;
if (data.length === 0) return <EmptyState message="No assets found" />;
return <DataTable data={data} />;
```

### Component Structure
1. File header comment
2. Imports (grouped: React/Next → third-party → local)
3. Type definitions
4. Component definition with JSDoc
5. Internal helper functions
6. Export

### Reusability
- Extract repeated patterns into shared components in `/components/ui/`
- Feature-specific components go in `/features/<feature-name>/`
- Custom hooks for shared logic go in `/hooks/`

---

## API & Data Layer

### API Routes
- Use Next.js App Router API routes (`app/api/`)
- **Canonical route list:** Keep the **API routes (summary)** section in `README.md` updated whenever you add or change a handler under `src/app/api/`.
- Always validate request bodies with Zod schemas
- Return consistent JSON response shapes:
  ```typescript
  /* Success response */
  { success: true, data: { ... } }
  
  /* Error response */
  { success: false, error: "Error message here" }
  ```
- Handle all errors with try/catch and return appropriate HTTP status codes
- Never expose raw database errors to the client

### Database Access
- All database queries go through **service functions** in `/lib/` or feature-specific service files
- Never call Prisma directly in API route handlers or components
- Use the Prisma client singleton from `/lib/prisma.ts`

### Validation
- All user inputs must be validated with Zod schemas
- Schemas are defined in `/lib/validations/`
- Reuse schemas between client (forms) and server (API routes)

---

## Console & Logging

### Development
- `console.log()` is allowed during development for debugging
- Use descriptive messages: `console.log("[AssetService] Fetching asset:", id)`

### Production
- **No `console.log()` in production code** — use proper error handling instead
- `console.error()` is allowed for genuine error logging
- `console.warn()` is allowed for deprecation or important warnings
- All errors should be caught and displayed via the UI error state components

### ESLint Enforcement
```javascript
/* ESLint rule: warn on console.log, allow console.error and console.warn */
"no-console": ["warn", { "allow": ["warn", "error"] }]
```

---

## Styling Rules

### Tailwind CSS Only
- **No inline styles** — Inline styles are strictly forbidden.
- **No CSS modules** — use Tailwind utility classes
- **No arbitrary values** unless absolutely necessary (prefer extending the theme)
- Use the project's custom Tailwind theme tokens (colors, spacing, etc.)

### Class Organization
Order Tailwind classes logically:
1. Layout (display, position, flex/grid)
2. Sizing (width, height, padding, margin)
3. Typography (font, text, color)
4. Visual (background, border, shadow, opacity)
5. Interactive (hover, focus, transition, animation)

```typescript
/* Good: organized class order */
className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg shadow-md hover:bg-primary-600 transition-colors"

/* Bad: random order */
className="hover:bg-primary-600 text-sm px-4 flex shadow-md bg-primary-500 items-center text-white"
```

### Responsive Design
- Desktop-first approach with mobile breakpoints
- Use Tailwind responsive prefixes: `md:`, `lg:`, `xl:`
- Test all views at common breakpoints: 375px, 768px, 1024px, 1440px

---

## Git & Version Control

### Commit Messages
Follow Conventional Commits format:
```
feat: add asset CRUD operations
fix: correct stock quantity calculation
docs: update README with setup instructions
style: format dashboard components
refactor: extract reusable table component
chore: update dependencies
test: add asset service unit tests
```

### Branching
- `main` — production-ready code
- `develop` — integration branch
- `feature/<name>` — new features
- `fix/<name>` — bug fixes

---

## Security

- Never commit `.env` files — use `.env.example` as a template
- Hash all passwords with bcrypt (minimum 10 rounds)
- Validate and sanitize all user inputs
- Use middleware for route protection
- Check user roles before performing privileged operations
- Never expose internal error details to clients

---

## Performance

- Use Next.js Server Components where possible (reduce client bundle)
- Implement pagination for all list views (never load all records)
- Use `loading.tsx` files for route-level loading states
- Optimize database queries (select only needed fields, use proper indexes)
- Lazy load non-critical components with `dynamic()` imports

---

## File Organization

### Import Order
```typescript
/* 1. React / Next.js imports */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* 2. Third-party library imports */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

/* 3. Local imports — lib/utils */
import { cn } from "@/lib/utils";
import { createAsset } from "@/lib/services/asset-service";

/* 4. Local imports — components */
import { Button } from "@/components/ui/button";
import { AssetForm } from "@/features/assets/asset-form";

/* 5. Local imports — types */
import type { Asset, CreateAssetInput } from "@/types";
```

### Folder Structure Rules
- Feature-based organization for scalability
- Shared/reusable code in `/components/` and `/lib/`
- Feature-specific code in `/features/<feature-name>/`
- Types in `/types/` (shared) or colocated with feature
- One component per file (except small, tightly-coupled helpers)

---

## Quality gate — new code & end of phase

These checks apply to **human and AI contributors** on every non-trivial change, and again **at the end of each development phase** before the phase is marked complete in `DEVELOPMENT_HISTORY.md`.

### After every meaningful change (new or changed functions, services, API routes, or non-trivial UI logic)

1. **TypeScript (project-wide, strict)** — Run `npx tsc --noEmit` and fix all errors before considering the change done.
2. **ESLint** — Run `npm run lint`, or narrow with `npx eslint <paths>` while iterating; do not leave new errors in files you touched.
3. **New or changed API routes** — Confirm Zod validation, consistent `{ success, data | error }` JSON, correct HTTP status codes, and `auth()` / role checks where the project already uses them; **update `README.md` → API routes (summary)** if paths or methods changed.

Doc-only edits (pure Markdown with no code) may skip steps 1–2 unless the editor reports issues.

### End of each development phase (before closing the phase in `DEVELOPMENT_HISTORY.md`)

Add a short **“Phase N quality check — (date)”** subsection under that phase listing what was run and the outcome. At minimum:

- [ ] `npx tsc --noEmit` — pass  
- [ ] `npm run lint` — pass (or note scoped paths if only part of the tree changed)  
- [ ] `npm run build` — pass  
- [ ] **Smoke test** — main user flows introduced in the phase (CRUD, loading / error / empty states, auth where relevant)

This is in addition to the **Testing Checklist (Manual)** below before merge or deployment.

---

## Testing Checklist (Manual)

Before any merge or deployment, verify:
- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Loading states display correctly
- [ ] Error states display with retry option
- [ ] Empty states display helpful messages
- [ ] Form validation catches invalid inputs
- [ ] Role-based access works (admin vs member)
- [ ] Responsive layout works on mobile and desktop
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
