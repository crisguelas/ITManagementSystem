/**
 * @file dashboard.service.ts
 * @description Aggregated metrics and recent activity for the home dashboard (Phase 7).
 * All queries run through Prisma; results are JSON-serializable for server components.
 */

import { AssetStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Human-readable labels for asset status enum values */
const STATUS_LABELS: Record<AssetStatus, string> = {
  [AssetStatus.AVAILABLE]: "Available",
  [AssetStatus.DEPLOYED]: "Deployed",
  [AssetStatus.MAINTENANCE]: "Maintenance",
  [AssetStatus.RETIRED]: "Retired",
  [AssetStatus.DISPOSED]: "Disposed",
};

export interface DashboardCategorySlice {
  name: string;
  count: number;
}

export interface DashboardStatusSlice {
  status: AssetStatus;
  label: string;
  count: number;
}

export interface DashboardBuildingSlice {
  id: string;
  label: string;
  count: number;
}

export interface DashboardActivityItem {
  id: string;
  kind: "assignment" | "stock";
  at: string;
  headline: string;
  detail: string;
}

export interface DashboardStats {
  summary: {
    totalAssets: number;
    deployed: number;
    available: number;
    maintenance: number;
    retiredOrDisposed: number;
    totalBuildings: number;
    totalRooms: number;
    totalEmployees: number;
    lowStockCount: number;
  };
  byCategory: DashboardCategorySlice[];
  byStatus: DashboardStatusSlice[];
  byBuilding: DashboardBuildingSlice[];
  recentActivity: DashboardActivityItem[];
}

/**
 * Builds a short description line for an assignment row in the activity feed.
 */
function assignmentActivityDetail(a: {
  employee: { firstName: string; lastName: string } | null;
  room: { name: string; building: { code: string } } | null;
  assignedBy: { name: string };
}): string {
  const parts: string[] = [];
  if (a.employee) {
    parts.push(`${a.employee.firstName} ${a.employee.lastName}`);
  }
  if (a.room) {
    parts.push(`${a.room.building.code} — ${a.room.name}`);
  }
  if (parts.length === 0) {
    parts.push("Assignment recorded");
  }
  return `${parts.join(" · ")} · by ${a.assignedBy.name}`;
}

/**
 * Loads dashboard aggregates, chart series, and a merged recent-activity feed.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalAssets,
    statusGroups,
    categoriesWithCounts,
    buildingCount,
    roomCount,
    employeeCount,
    stockItemsForLow,
    openAssignmentsWithRoom,
    employeeOnlyAssignmentsCount,
    recentAssignments,
    recentStockTx,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { assets: true } },
      },
    }),
    prisma.building.count(),
    prisma.room.count(),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.stockItem.findMany({
      select: { quantity: true, minQuantity: true },
    }),
    prisma.assetAssignment.findMany({
      where: { returnedAt: null, roomId: { not: null } },
      include: {
        room: { include: { building: true } },
      },
    }),
    prisma.assetAssignment.count({
      where: {
        returnedAt: null,
        roomId: null,
        employeeId: { not: null },
      },
    }),
    prisma.assetAssignment.findMany({
      take: 10,
      orderBy: { assignedAt: "desc" },
      include: {
        asset: { select: { assetTag: true } },
        employee: { select: { firstName: true, lastName: true } },
        room: { include: { building: { select: { name: true, code: true } } } },
        assignedBy: { select: { name: true } },
      },
    }),
    prisma.stockTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        stockItem: { select: { name: true, unit: true } },
        performedBy: { select: { name: true } },
      },
    }),
  ]);

  const statusCountMap = new Map<AssetStatus, number>();
  for (const g of statusGroups) {
    statusCountMap.set(g.status, g._count.id);
  }

  const getCount = (s: AssetStatus) => statusCountMap.get(s) ?? 0;

  const deployed = getCount(AssetStatus.DEPLOYED);
  const available = getCount(AssetStatus.AVAILABLE);
  const maintenance = getCount(AssetStatus.MAINTENANCE);
  const retiredOrDisposed =
    getCount(AssetStatus.RETIRED) + getCount(AssetStatus.DISPOSED);

  const lowStockCount = stockItemsForLow.filter(
    (i) => i.quantity <= i.minQuantity
  ).length;

  const byCategory: DashboardCategorySlice[] = categoriesWithCounts
    .map((c) => ({
      name: c.name,
      count: c._count.assets,
    }))
    .filter((c) => c.count > 0);

  const byStatus: DashboardStatusSlice[] = (
    Object.values(AssetStatus) as AssetStatus[]
  ).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: getCount(status),
  }));

  const buildingAgg = new Map<string, { label: string; count: number }>();
  for (const row of openAssignmentsWithRoom) {
    if (!row.room) continue;
    const b = row.room.building;
    const id = b.id;
    const prev = buildingAgg.get(id) ?? { label: `${b.code} — ${b.name}`, count: 0 };
    prev.count += 1;
    buildingAgg.set(id, prev);
  }

  const byBuilding: DashboardBuildingSlice[] = [...buildingAgg.entries()].map(
    ([id, v]) => ({
      id,
      label: v.label,
      count: v.count,
    })
  );

  if (employeeOnlyAssignmentsCount > 0) {
    byBuilding.push({
      id: "__employee_only__",
      label: "With user (no room)",
      count: employeeOnlyAssignmentsCount,
    });
  }

  byBuilding.sort((a, b) => b.count - a.count);

  const assignmentActivity = recentAssignments.map((a) => ({
    id: a.id,
    kind: "assignment" as const,
    at: a.assignedAt.toISOString(),
    headline: `Assigned ${a.asset.assetTag}`,
    detail: assignmentActivityDetail(a),
    t: a.assignedAt.getTime(),
  }));

  const stockActivity = recentStockTx.map((t) => ({
    id: t.id,
    kind: "stock" as const,
    at: t.createdAt.toISOString(),
    headline: `Stock ${t.type}: ${t.stockItem.name}`,
    detail: `${t.quantity} ${t.stockItem.unit} · ${t.performedBy.name}`,
    t: t.createdAt.getTime(),
  }));

  const recentActivity: DashboardActivityItem[] = [...assignmentActivity, ...stockActivity]
    .sort((x, y) => y.t - x.t)
    .slice(0, 14)
    .map(({ id, kind, at, headline, detail }) => ({
      id,
      kind,
      at,
      headline,
      detail,
    }));

  return {
    summary: {
      totalAssets,
      deployed,
      available,
      maintenance,
      retiredOrDisposed,
      totalBuildings: buildingCount,
      totalRooms: roomCount,
      totalEmployees: employeeCount,
      lowStockCount,
    },
    byCategory,
    byStatus,
    byBuilding,
    recentActivity,
  };
}
