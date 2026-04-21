/**
 * @file constants.ts
 * @description Application-wide constants and configuration values.
 * Centralizes magic numbers, labels, and configuration to avoid duplication.
 */

/* ═══════════════════════════════════════════════════════════════ */
/* PAGINATION                                                      */
/* ═══════════════════════════════════════════════════════════════ */

/* Default number of items per page in data tables */
export const DEFAULT_PAGE_SIZE = 20;

/* Maximum number of items per page */
export const MAX_PAGE_SIZE = 100;

/* Available page size options for the user to select */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET TAGGING                                                   */
/* ═══════════════════════════════════════════════════════════════ */

/* Number of digits in the auto-generated tag sequence (e.g. 0001). Global prefix: `ASSET_TAG_PREFIX` env — see `lib/asset-tag-config.ts` */
export const ASSET_TAG_DIGITS = 4;

/* ═══════════════════════════════════════════════════════════════ */
/* AUTHENTICATION                                                  */
/* ═══════════════════════════════════════════════════════════════ */

/* Minimum password length for user accounts */
export const MIN_PASSWORD_LENGTH = 6;

/* Number of bcrypt hashing rounds */
export const BCRYPT_SALT_ROUNDS = 10;

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK MANAGEMENT                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Default minimum quantity before low-stock alert triggers */
export const DEFAULT_MIN_QUANTITY = 5;

/* Available unit options for stock items */
export const STOCK_UNITS = [
  "pcs",
  "meters",
  "boxes",
  "rolls",
  "sets",
  "pairs",
  "liters",
  "kg",
] as const;

/* Prefix for auto-generated stock SKU values */
export const STOCK_SKU_PREFIX = "STK";

/* Number of digits in auto-generated stock SKU sequence (e.g. STK-000001) */
export const STOCK_SKU_DIGITS = 6;

/* ═══════════════════════════════════════════════════════════════ */
/* DISPLAY LABELS — Human-readable labels for enum values          */
/* ═══════════════════════════════════════════════════════════════ */

/* Asset status display labels */
export const ASSET_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  DEPLOYED: "Deployed",
  MAINTENANCE: "Maintenance",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

/* Asset status badge colors (Tailwind classes) */
export const ASSET_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEPLOYED: "bg-blue-100 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200",
  RETIRED: "bg-gray-100 text-gray-700 border-gray-200",
  DISPOSED: "bg-red-100 text-red-700 border-red-200",
};

/* Asset condition display labels */
export const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DEFECTIVE: "Defective",
};

/* Asset condition badge colors (Tailwind classes) */
export const CONDITION_COLORS: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GOOD: "bg-blue-100 text-blue-700 border-blue-200",
  FAIR: "bg-amber-100 text-amber-700 border-amber-200",
  POOR: "bg-orange-100 text-orange-700 border-orange-200",
  DEFECTIVE: "bg-red-100 text-red-700 border-red-200",
};

/* Room type display labels */
export const ROOM_TYPE_LABELS: Record<string, string> = {
  OFFICE: "Office",
  COMLAB: "ComLab",
  CLASSROOM: "Classroom",
  SERVER_ROOM: "Server Room",
  STORAGE: "Storage",
  CLINIC: "Clinic",
  OTHER: "Other",
};

/* Employee title display labels */
export const TITLE_LABELS: Record<string, string> = {
  DR: "Dr.",
  MR: "Mr.",
  MS: "Ms.",
  PROF: "Prof.",
};

/* Transaction type display labels */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  IN: "Stock In",
  OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
  RETURN: "Return",
};

/* Transaction type badge colors */
export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  IN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OUT: "bg-red-100 text-red-700 border-red-200",
  ADJUSTMENT: "bg-amber-100 text-amber-700 border-amber-200",
  RETURN: "bg-blue-100 text-blue-700 border-blue-200",
};

/* User role display labels */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  MEMBER: "Member",
};

/* ═══════════════════════════════════════════════════════════════ */
/* NAVIGATION                                                      */
/* ═══════════════════════════════════════════════════════════════ */

/* Sidebar navigation items — defines the main navigation structure */
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    label: "Assets",
    href: "/assets",
    icon: "Monitor",
    children: [
      { label: "All Assets", href: "/assets" },
    ],
  },
  {
    label: "Organization",
    href: "/organization",
    icon: "Building2",
  },
  {
    label: "Inventory",
    href: "/stock",
    icon: "Warehouse",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "FileBarChart",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    children: [
      { label: "User Accounts", href: "/settings/users", adminOnly: true },
      { label: "Categories", href: "/categories" },
    ],
  },
] as const;

/* ═══════════════════════════════════════════════════════════════ */
/* APPLICATION                                                     */
/* ═══════════════════════════════════════════════════════════════ */

/* Application name displayed in the header and title */
export const APP_NAME = "IT Management System";

/* Short application name for compact displays */
export const APP_SHORT_NAME = "ITMS";

/* Application description for SEO */
export const APP_DESCRIPTION =
  "IT asset and inventory management for your IT department.";
