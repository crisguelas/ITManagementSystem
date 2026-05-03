/**
 * @file assignment.service.ts
 * @description Service layer for asset assignments (assign to employee/room, return).
 * All writes use Prisma transactions so history and asset status stay consistent.
 */

import { AssetStatus } from "@prisma/client";
import type { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { createAssignmentSchema } from "@/lib/validations/assignment.schema";

const assignmentInclude = {
  employee: { include: { department: true } },
  room: { include: { building: true } },
  assignedBy: true,
} as const;

/**
 * Checks whether an employee already has an active assignment for the same asset category.
 * Used to show a user confirmation warning before creating another same-type assignment.
 */
export async function findActiveSameTypeEmployeeAssignment(assetId: string, employeeId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { stockCategoryId: true, stockCategory: { select: { name: true } } },
  });

  if (!asset) return null;

  const existing = await prisma.assetAssignment.findFirst({
    where: {
      employeeId,
      returnedAt: null,
      asset: { stockCategoryId: asset.stockCategoryId },
    },
    include: {
      asset: {
        select: {
          id: true,
          assetTag: true,
          brand: true,
          model: true,
          stockCategory: { select: { name: true } },
        },
      },
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { assignedAt: "desc" },
  });

  if (!existing) return null;

  return {
    employeeName: existing.employee
      ? `${existing.employee.firstName} ${existing.employee.lastName}`.trim()
      : "Selected employee",
    existingAssetId: existing.asset.id,
    existingAssetTag: existing.asset.assetTag,
    existingAssetLabel: `${existing.asset.brand} ${existing.asset.model}`.trim(),
    categoryName: asset.stockCategory.name,
  };
}

/**
 * Assigns an asset to an employee and/or room: closes any open assignment, creates a new row, sets asset to DEPLOYED.
 */
export async function assignAsset(
  assetId: string,
  data: z.infer<typeof createAssignmentSchema>,
  assignedById: string
) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({ where: { id: assetId } });

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
      throw new Error("Cannot assign a retired or disposed asset");
    }

    if (data.employeeId) {
      const employee = await tx.employee.findUnique({
        where: { id: data.employeeId },
      });
      if (!employee) {
        throw new Error("Employee not found");
      }
      if (!employee.isActive) {
        throw new Error("Cannot assign to an inactive employee");
      }
    }

    if (data.roomId) {
      const room = await tx.room.findUnique({ where: { id: data.roomId } });
      if (!room) {
        throw new Error("Room not found");
      }
    }

    /* Close any in-flight assignment so history stays a proper timeline */
    await tx.assetAssignment.updateMany({
      where: { assetId, returnedAt: null },
      data: { returnedAt: new Date() },
    });

    const created = await tx.assetAssignment.create({
      data: {
        assetId,
        employeeId: data.employeeId ?? null,
        roomId: data.roomId ?? null,
        assignedById,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.DEPLOYED },
    });

    return tx.assetAssignment.findUniqueOrThrow({
      where: { id: created.id },
      include: assignmentInclude,
    });
  });
}

/**
 * Marks the current open assignment as returned and sets the asset back to AVAILABLE.
 */
export async function returnAsset(assetId: string) {
  return prisma.$transaction(async (tx) => {
    const open = await tx.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: "desc" },
    });

    if (!open) {
      throw new Error("No active assignment to return");
    }

    await tx.assetAssignment.update({
      where: { id: open.id },
      data: { returnedAt: new Date() },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.AVAILABLE },
    });

    return tx.assetAssignment.findUniqueOrThrow({
      where: { id: open.id },
      include: assignmentInclude,
    });
  });
}
