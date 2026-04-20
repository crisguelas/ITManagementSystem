# ITMS Manual QA Checklist

Use this checklist for release validation, UAT, and post-merge smoke testing.

- **Project:** IT Management System
- **Date:** ____________________
- **Environment:** ____________________
- **Tester:** ____________________
- **Build/Commit:** ____________________

---

## 1) Pre-flight checks

- [ ] App starts and login page loads.
- [ ] Database is reachable and seeded test data is available.
- [ ] Admin test account is available.
- [ ] Member test account is available.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes (or approved warnings only).
- [ ] `npm run build` passes.

---

## 2) Authentication and role access

### Login and session
- [ ] Valid admin credentials can log in.
- [ ] Valid member credentials can log in.
- [ ] Invalid credentials show clear error feedback.
- [ ] Logout returns user to login state.

### Route protection
- [ ] Unauthenticated access to dashboard routes redirects to login.
- [ ] Member cannot access admin-only settings routes.
- [ ] Admin can access `/settings` and `/settings/users`.

---

## 3) Global navigation (buttons and links)

### Sidebar
- [ ] `Dashboard` opens `/`.
- [ ] `Assets` opens `/assets`.
- [ ] `Assets -> Categories` opens `/categories`.
- [ ] `Organization` opens `/organization`.
- [ ] `Stock Room` opens `/stock`.
- [ ] `Reports` opens `/reports`.
- [ ] `Settings` (admin only) opens `/settings`.

### Breadcrumbs and quick links
- [ ] Breadcrumb home icon navigates to `/`.
- [ ] Intermediate breadcrumb links resolve correctly.
- [ ] Dashboard quick links open correct modules.

---

## 4) Dashboard (`/`)

- [ ] Summary cards render without errors.
- [ ] Charts render with expected labels/data.
- [ ] Recent activity list displays data or valid empty state.
- [ ] Loading state appears while data is fetching.
- [ ] Error state appears with retry action if API fails.

---

## 5) Assets module (`/assets`, `/assets/[id]`, `/categories`)

### Assets list
- [ ] `Register Asset` button opens modal/form.
- [ ] Search/filter controls update visible rows.
- [ ] Asset row detail links open `/assets/[id]`.
- [ ] Empty state appears when no assets exist.

### Asset create/edit/delete
- [ ] Creating asset succeeds with valid data.
- [ ] Validation blocks invalid submissions.
- [ ] Editing asset persists changes.
- [ ] Deleting asset requires confirmation and removes row when allowed.

### Asset detail page
- [ ] `Back` button/link returns to asset list.
- [ ] `Print` action works and includes correct asset data.
- [ ] `Assign` opens assignment modal.
- [ ] `Return` works for assigned assets.
- [ ] Assignment history updates correctly after assign/return.

### Categories page
- [ ] Add category works with valid name/prefix.
- [ ] Duplicate category name/prefix is rejected with clear error.
- [ ] Edit category updates data.
- [ ] Delete category works when not in use.

---

## 6) Organization module (`/organization`)

### Places tab
- [ ] `Add Building` opens building form and creates record.
- [ ] `Register Room` opens room form and creates room under building.
- [ ] Edit and delete building actions behave correctly.
- [ ] Room list reflects latest create/edit/delete operations.

### Teams and people tab
- [ ] `Add Department` creates department.
- [ ] Edit and delete department actions behave correctly.
- [ ] `Add Employee` opens employee form and creates employee.
- [ ] Edit employee updates fields correctly.
- [ ] Delete/deactivate employee action works as intended.

---

## 7) Stock module (`/stock`, `/stock/[id]`)

### Inventory items tab
- [ ] Add stock item works with valid category and quantity.
- [ ] Edit stock item updates values correctly.
- [ ] Delete item respects transaction safeguards.
- [ ] Details link opens `/stock/[id]`.

### Stock categories tab
- [ ] Add category works.
- [ ] Edit category works.
- [ ] Delete category works only when allowed.

### Transactions
- [ ] Add `IN` transaction increases quantity.
- [ ] Add `OUT` transaction decreases quantity with validation.
- [ ] Add `RETURN` transaction updates quantity correctly.
- [ ] Add `ADJUSTMENT` transaction updates quantity correctly.
- [ ] Transaction list/audit fields display expected values.

### Stock detail page
- [ ] Back link returns to stock list.
- [ ] Add transaction button opens transaction modal.
- [ ] Current quantity and recent transactions update after submit.

---

## 8) Reports module (`/reports`)

- [ ] Reports page loads for authenticated users.
- [ ] Date range filter applies and updates URL params.
- [ ] Clear filter resets state and URL.
- [ ] `Assets Excel` export downloads valid file.
- [ ] `Stock Transactions Excel` export downloads valid file.
- [ ] `Low Stock Excel` export downloads valid file.
- [ ] `Employees Excel` export downloads valid file.
- [ ] `Summary PDF` export downloads valid PDF with expected sections.

---

## 9) Settings and users (`/settings`, `/settings/users`)

- [ ] Settings hub opens for admin users.
- [ ] User accounts list loads successfully.
- [ ] Add user creates active account with selected role.
- [ ] Edit user role/active status persists correctly.
- [ ] Last active admin protection is enforced.

---

## 10) Cross-cutting UX checks

- [ ] Modal opens/closes correctly (close button, overlay, cancel).
- [ ] Confirm dialogs require explicit confirmation.
- [ ] Success and error toasts/messages are clear and accurate.
- [ ] Loading, empty, and error states appear where expected.
- [ ] Form controls are keyboard accessible.
- [ ] No clipped overlays or hidden action buttons in layout.
- [ ] Responsive checks pass at mobile/tablet/desktop breakpoints.

---

## 11) Final sign-off

- [ ] All critical flows pass.
- [ ] Known issues are documented with severity and owner.
- [ ] Release/UAT sign-off approved.

### Notes

- Issue log:
  - ________________________________________________________________
  - ________________________________________________________________
  - ________________________________________________________________

- Sign-off:
  - **Tester:** ____________________
  - **Date:** ____________________
  - **Approval:** ____________________
