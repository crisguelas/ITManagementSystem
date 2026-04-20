/**
 * @file report.service.ts
 * @description Service layer for report-ready datasets and summary metrics.
 */

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

export interface ReportsData {
  summary: {
    totalAssets: number;
    deployedAssets: number;
    availableAssets: number;
    lowStockItems: number;
    totalStockTransactions: number;
  };
  assets: ReportAssetRow[];
  stockTransactions: ReportStockTransactionRow[];
}

/**
 * Builds report data for the Reports page and export actions.
 */
export async function getReportsData(): Promise<ReportsData> {
  const [assets, stockItems, stockTransactions] = await Promise.all([
    prisma.asset.findMany({
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
      select: { quantity: true, minQuantity: true },
    }),
    prisma.stockTransaction.findMany({
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
  const lowStockCount = stockItems.filter((item) => item.quantity <= item.minQuantity).length;

  return {
    summary: {
      totalAssets: reportAssets.length,
      deployedAssets,
      availableAssets,
      lowStockItems: lowStockCount,
      totalStockTransactions: reportStockTransactions.length,
    },
    assets: reportAssets,
    stockTransactions: reportStockTransactions,
  };
}
