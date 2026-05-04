/**
 * @file index.ts
 * @description Shared TypeScript type definitions used across the application.
 * These types extend Prisma-generated types with additional fields for UI use.
 */

import type {
  Asset,
  AssetAssignment,
  Building,
  Room,
  Department,
  Employee,
  StockCategory,
  StockItem,
  StockTransaction,
  User,
} from "@prisma/client";

/* ═══════════════════════════════════════════════════════════════ */
/* API RESPONSE TYPES                                              */
/* ═══════════════════════════════════════════════════════════════ */

/* Standard API success response shape */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/* Standard API error response shape */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/* Union type for all API responses */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/* Paginated API response with metadata */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/* Payload shape returned by list GET routes after server-side pagination (`data` field) */
export interface PaginatedListPayload<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ═══════════════════════════════════════════════════════════════ */
/* ASSET TYPES — Extended with relations                           */
/* ═══════════════════════════════════════════════════════════════ */

/* Asset with its category relation included */
export interface AssetWithCategory extends Asset {
  stockCategory: StockCategory;
}

/* Asset with all relations for the detail view */
export interface AssetWithRelations extends Asset {
  stockCategory: StockCategory;
  assignments: AssetAssignmentWithRelations[];
}

/* ═══════════════════════════════════════════════════════════════ */
/* ASSIGNMENT TYPES — Extended with relations                      */
/* ═══════════════════════════════════════════════════════════════ */

/* Assignment with employee, room, and user who assigned */
export interface AssetAssignmentWithRelations extends AssetAssignment {
  employee: Employee | null;
  room: (Room & { building: Building }) | null;
  assignedBy: Pick<User, "id" | "name">;
}

/* ═══════════════════════════════════════════════════════════════ */
/* LOCATION TYPES — Extended with relations                        */
/* ═══════════════════════════════════════════════════════════════ */

/* Building with its rooms included */
export interface BuildingWithRooms extends Building {
  rooms: Room[];
  _count?: {
    rooms: number;
  };
}

/* Room with its building information */
export interface RoomWithBuilding extends Room {
  building: Building;
}

/* ═══════════════════════════════════════════════════════════════ */
/* EMPLOYEE TYPES — Extended with relations                        */
/* ═══════════════════════════════════════════════════════════════ */

/* Employee with their department included */
export interface EmployeeWithDepartment extends Employee {
  department: Department;
}

/* ═══════════════════════════════════════════════════════════════ */
/* STOCK TYPES — Extended with relations                           */
/* ═══════════════════════════════════════════════════════════════ */

/* Stock item with category */
export interface StockItemWithCategory extends StockItem {
  category: StockCategory;
}

/* Stock transaction with performer and approver details */
export interface StockTransactionWithRelations extends StockTransaction {
  stockItem: StockItem;
  performedBy: Pick<User, "id" | "name">;
  approvedBy: Pick<User, "id" | "name"> | null;
}

/* ═══════════════════════════════════════════════════════════════ */
/* USER TYPES                                                      */
/* ═══════════════════════════════════════════════════════════════ */

/* User without sensitive password field — safe for client use */
export type SafeUser = Omit<User, "password">;

/* ═══════════════════════════════════════════════════════════════ */
/* DASHBOARD TYPES                                                 */
/* ═══════════════════════════════════════════════════════════════ */

/* Summary statistics for the dashboard cards */
export interface DashboardStats {
  totalAssets: number;
  deployedAssets: number;
  availableAssets: number;
  maintenanceAssets: number;
  totalEmployees: number;
  totalLocations: number;
  lowStockItems: number;
  totalStockValue: number;
}

/* Data point for charts */
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

/* Recent activity item for the dashboard feed */
export interface ActivityItem {
  id: string;
  type: "assignment" | "return" | "stock_in" | "stock_out" | "asset_created";
  description: string;
  performedBy: string;
  createdAt: Date | string;
}

/* ═══════════════════════════════════════════════════════════════ */
/* REPORT TYPES                                                    */
/* ═══════════════════════════════════════════════════════════════ */

/* Available report types for the report generator */
export type ReportType =
  | "asset_inventory"
  | "assets_by_location"
  | "assets_by_employee"
  | "assets_by_department"
  | "assignment_history"
  | "stock_inventory"
  | "stock_transactions"
  | "low_stock"
  | "assets_by_status";

/* Report configuration for the report generator */
export interface ReportConfig {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
}

/* Export format options */
export type ExportFormat = "pdf" | "excel";

/* ═══════════════════════════════════════════════════════════════ */
/* FORM TYPES                                                      */
/* ═══════════════════════════════════════════════════════════════ */

/* Generic select option for dropdowns */
export interface SelectOption {
  label: string;
  value: string;
}

/* Search and filter parameters for data tables */
export interface TableFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | undefined;
}
