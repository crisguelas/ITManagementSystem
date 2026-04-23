/**
 * @file report.service.ts
 * @description Service layer for report-ready datasets and summary metrics.
 */

import type { Prisma } from "@prisma/client";

import { TITLE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export interface ReportAssetRow {
  assetTag: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  serialNumber: string;
  pcNumber: string;
  assignedTo: string;
  location: string;
  createdAt: string;
}

export interface ReportStockTransactionRow {
  itemName: string;
  category: string;
  type: string;
  quantity: number;
  recipientName: string;
  recipientDepartment: string;
  performedBy: string;
  createdAt: string;
}

/** Current stock-room lines at or below minimum (not filtered by report date range) */
export interface ReportLowStockRow {
  name: string;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
}

/** Organization employees; `createdAt` respects the report period when a range is set */
export interface ReportEmployeeRow {
  employeeId: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  active: string;
  createdAt: string;
}

/** Normalized query range for UI and exports (YYYY-MM-DD or null) */
export interface ReportsPeriod {
  from: string | null;
  to: string | null;
}

export interface ReportsData {
  period: ReportsPeriod;
  summary: {
    totalAssets: number;
    deployedAssets: number;
    availableAssets: number;
    lowStockItems: number;
    totalStockTransactions: number;
    employeesInScope: number;
  };
  assets: ReportAssetRow[];
  stockTransactions: ReportStockTransactionRow[];
  lowStockRows: ReportLowStockRow[];
  employees: ReportEmployeeRow[];
}

export interface GetReportsDataOptions {
  /** Inclusive start date `YYYY-MM-DD` (UTC midnight) */
  from?: string | null;
  /** Inclusive end date `YYYY-MM-DD` (UTC end of day) */
  to?: string | null;
}

/* Parses a date-only string into UTC start-of-day; returns null if invalid */
const parseStartUtc = (value: string | null | undefined): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const d = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/* Parses end date into UTC end-of-day inclusive */
const parseEndUtc = (value: string | null | undefined): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const d = new Date(`${value.trim()}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Builds a Prisma date range on `createdAt` from optional `from` / `to` query params.
 * Returns undefined when no valid range (all rows).
 */
const buildCreatedAtFilter = (
  from: string | null | undefined,
  to: string | null | undefined
): Prisma.DateTimeFilter | undefined => {
  let start = parseStartUtc(from ?? undefined);
  let end = parseEndUtc(to ?? undefined);

  if (start && end && start > end) {
    const tmp = start;
    start = new Date(`${end.toISOString().slice(0, 10)}T00:00:00.000Z`);
    end = new Date(`${tmp.toISOString().slice(0, 10)}T23:59:59.999Z`);
  }

  if (start && end) {
    return { gte: start, lte: end };
  }
  if (start) {
    return { gte: start };
  }
  if (end) {
    return { lte: end };
  }
  return undefined;
};

/**
 * Normalizes successful parse back to YYYY-MM-DD for stable URLs and labels.
 */
const toYyyyMmDd = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Builds report data for the Reports page and export actions.
 * Optional `from` / `to` filter asset, stock-transaction, and **employee** rows by `createdAt` (UTC day bounds).
 * **Low-stock** lines are always a current snapshot (quantity vs threshold), not date-filtered.
 */
export async function getReportsData(options: GetReportsDataOptions = {}): Promise<ReportsData> {
  let fromStr = options.from?.trim() || null;
  let toStr = options.to?.trim() || null;

  /* Swap inclusive range when dates are reversed (string order matches YYYY-MM-DD) */
  if (fromStr && toStr && fromStr > toStr) {
    const tmp = fromStr;
    fromStr = toStr;
    toStr = tmp;
  }

  const createdAt = buildCreatedAtFilter(fromStr, toStr);

  const period: ReportsPeriod =
    createdAt?.gte || createdAt?.lte
      ? {
          from: createdAt?.gte ? toYyyyMmDd(createdAt.gte as Date) : null,
          to: createdAt?.lte ? toYyyyMmDd(createdAt.lte as Date) : null,
        }
      : { from: null, to: null };

  const assetWhere: Prisma.AssetWhereInput | undefined = createdAt
    ? { createdAt }
    : undefined;

  const stockTxWhere: Prisma.StockTransactionWhereInput | undefined = createdAt
    ? { createdAt }
    : undefined;

  const employeeWhere: Prisma.EmployeeWhereInput | undefined = createdAt
    ? { createdAt }
    : undefined;

  const [assets, stockItems, stockTransactions, employees] = await Promise.all([
    prisma.asset.findMany({
      where: assetWhere,
      include: {
        category: { select: { name: true } },
        assignments: {
          where: { returnedAt: null },
          take: 1,
          include: {
            employee: { select: { firstName: true, lastName: true } },
            room: {
              select: {
                name: true,
                building: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockItem.findMany({
      include: {
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.stockTransaction.findMany({
      where: stockTxWhere,
      include: {
        stockItem: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
        performedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({
      where: employeeWhere,
      include: {
        department: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const reportAssets: ReportAssetRow[] = assets.map((asset) => {
    const activeAssignment = asset.assignments[0] ?? null;
    const assignedTo = activeAssignment?.employee
      ? `${activeAssignment.employee.firstName} ${activeAssignment.employee.lastName}`.trim()
      : "-";
    const roomName = activeAssignment?.room?.name ?? "";
    const buildingName = activeAssignment?.room?.building?.name ?? "";
    const location = roomName && buildingName ? `${buildingName} / ${roomName}` : "-";

    return {
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category.name,
      status: asset.status,
      condition: asset.condition,
      serialNumber: asset.serialNumber ?? "-",
      pcNumber: asset.pcNumber ?? "-",
      assignedTo,
      location,
      createdAt: asset.createdAt.toISOString(),
    };
  });

  const reportStockTransactions: ReportStockTransactionRow[] = stockTransactions.map((transaction) => ({
    itemName: transaction.stockItem.name,
    category: transaction.stockItem.category.name,
    type: transaction.type,
    quantity: transaction.quantity,
    recipientName: transaction.recipientName ?? "-",
    recipientDepartment: transaction.recipientDepartment ?? "-",
    performedBy: transaction.performedBy.name ?? "-",
    createdAt: transaction.createdAt.toISOString(),
  }));

  const deployedAssets = reportAssets.filter((asset) => asset.status === "DEPLOYED").length;
  const availableAssets = reportAssets.filter((asset) => asset.status === "AVAILABLE").length;

  const lowStockRows: ReportLowStockRow[] = stockItems
    .filter((item) => item.quantity <= item.minQuantity)
    .map((item) => ({
      name: item.name,
      category: item.category.name,
      sku: item.sku ?? "-",
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      location: item.location,
    }));

  const reportEmployees: ReportEmployeeRow[] = employees.map((emp) => ({
    employeeId: emp.employeeId ?? "-",
    title: TITLE_LABELS[emp.title] ?? emp.title,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email ?? "-",
    phone: emp.phone ?? "-",
    department: emp.department.name,
    position: emp.position ?? "-",
    active: emp.isActive ? "Yes" : "No",
    createdAt: emp.createdAt.toISOString(),
  }));

  return {
    period,
    summary: {
      totalAssets: reportAssets.length,
      deployedAssets,
      availableAssets,
      lowStockItems: lowStockRows.length,
      totalStockTransactions: reportStockTransactions.length,
      employeesInScope: reportEmployees.length,
    },
    assets: reportAssets,
    stockTransactions: reportStockTransactions,
    lowStockRows,
    employees: reportEmployees,
  };
}
