/**
 * @file organization.service.ts
 * @description Centralized service logic for retrieving and creating Organization data.
 */

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { 
  buildingSchema, 
  roomSchema, 
  departmentSchema, 
  employeeSchema 
} from "@/lib/validations/organization.schema";

/* ═══════════════════════════════════════════════════════════════ */
/* BUILDINGS                                                       */
/* ═══════════════════════════════════════════════════════════════ */

export async function getBuildings() {
  return prisma.building.findMany({
    include: {
      _count: { select: { rooms: true } }
    },
    orderBy: { name: "asc" }
  });
}

export async function getBuildingById(id: string) {
  return prisma.building.findUnique({
    where: { id },
    include: {
      rooms: {
        include: {
          _count: { select: { assignments: { where: { returnedAt: null } } } },
        },
        orderBy: [{ floor: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function createBuilding(data: z.infer<typeof buildingSchema>) {
  const existingName = await prisma.building.findUnique({ where: { name: data.name } });
  if (existingName) throw new Error(`Building "${data.name}" already exists`);
  
  const existingCode = await prisma.building.findUnique({ where: { code: data.code } });
  if (existingCode) throw new Error(`Building code "${data.code}" is already in use`);

  return prisma.building.create({ data });
}

export async function updateBuilding(id: string, data: z.infer<typeof buildingSchema>) {
  const existingBuilding = await prisma.building.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingBuilding) throw new Error("Building not found");

  const duplicateName = await prisma.building.findFirst({
    where: { id: { not: id }, name: data.name },
    select: { id: true },
  });
  if (duplicateName) throw new Error(`Building "${data.name}" already exists`);

  const duplicateCode = await prisma.building.findFirst({
    where: { id: { not: id }, code: data.code },
    select: { id: true },
  });
  if (duplicateCode) throw new Error(`Building code "${data.code}" is already in use`);

  return prisma.building.update({
    where: { id },
    data,
  });
}

export async function deleteBuilding(id: string) {
  const roomCount = await prisma.room.count({
    where: { buildingId: id },
  });
  if (roomCount > 0) {
    throw new Error("Cannot delete a building with registered rooms");
  }

  return prisma.building.delete({
    where: { id },
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/* ROOMS                                                           */
/* ═══════════════════════════════════════════════════════════════ */

export async function getRooms() {
  return prisma.room.findMany({
    include: {
      building: true,
      _count: { select: { assignments: { where: { returnedAt: null } } } }
    },
    orderBy: [ { buildingId: "asc" }, { name: "asc" } ]
  });
}

export async function createRoom(data: z.infer<typeof roomSchema>) {
  /* Enforce exact unique constraint from Prisma Schema: [buildingId, name] */
  const existingRoom = await prisma.room.findUnique({
    where: {
      buildingId_name: {
        buildingId: data.buildingId,
        name: data.name
      }
    }
  });

  if (existingRoom) {
    throw new Error(`Room "${data.name}" already exists in this building`);
  }

  return prisma.room.create({ data });
}

export async function updateRoom(id: string, data: z.infer<typeof roomSchema>) {
  const existingRoom = await prisma.room.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingRoom) throw new Error("Room not found");

  /* Enforce exact unique constraint from Prisma Schema: [buildingId, name] */
  const duplicateRoom = await prisma.room.findUnique({
    where: {
      buildingId_name: {
        buildingId: data.buildingId,
        name: data.name,
      },
    },
    select: { id: true },
  });

  if (duplicateRoom && duplicateRoom.id !== id) {
    throw new Error(`Room "${data.name}" already exists in this building`);
  }

  return prisma.room.update({
    where: { id },
    data,
  });
}

export async function deleteRoom(id: string) {
  const activeAssignments = await prisma.assetAssignment.count({
    where: { roomId: id, returnedAt: null },
  });

  if (activeAssignments > 0) {
    throw new Error("Cannot delete a room with active assignments");
  }

  return prisma.room.delete({
    where: { id },
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/* DEPARTMENTS                                                     */
/* ═══════════════════════════════════════════════════════════════ */

export async function getDepartments() {
  return prisma.department.findMany({
    include: {
      _count: { select: { employees: true } }
    },
    orderBy: { name: "asc" }
  });
}

export async function createDepartment(data: z.infer<typeof departmentSchema>) {
  const existingName = await prisma.department.findUnique({ where: { name: data.name } });
  if (existingName) throw new Error(`Department "${data.name}" already exists`);

  const existingCode = await prisma.department.findUnique({ where: { code: data.code } });
  if (existingCode) throw new Error(`Department code "${data.code}" is already in use`);

  return prisma.department.create({ data });
}

export async function updateDepartment(id: string, data: z.infer<typeof departmentSchema>) {
  const existingDepartment = await prisma.department.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingDepartment) throw new Error("Department not found");

  const duplicateName = await prisma.department.findFirst({
    where: { id: { not: id }, name: data.name },
    select: { id: true },
  });
  if (duplicateName) throw new Error(`Department "${data.name}" already exists`);

  const duplicateCode = await prisma.department.findFirst({
    where: { id: { not: id }, code: data.code },
    select: { id: true },
  });
  if (duplicateCode) throw new Error(`Department code "${data.code}" is already in use`);

  return prisma.department.update({
    where: { id },
    data,
  });
}

export async function deleteDepartment(id: string) {
  const activeEmployees = await prisma.employee.count({
    where: { departmentId: id, isActive: true },
  });
  if (activeEmployees > 0) {
    throw new Error("Cannot delete a department with active employees");
  }

  return prisma.department.delete({
    where: { id },
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/* EMPLOYEES                                                       */
/* ═══════════════════════════════════════════════════════════════ */

export async function getEmployees() {
  return prisma.employee.findMany({
    where: { isActive: true },
    include: {
      department: true,
      _count: { select: { assignments: { where: { returnedAt: null } } } }
    },
    orderBy: [ { departmentId: "asc" }, { lastName: "asc" } ]
  });
}

export async function createEmployee(data: z.infer<typeof employeeSchema>) {
  /* employeeId is unique */
  const existingEmployeeId = await prisma.employee.findFirst({
    where: { employeeId: data.employeeId },
    select: { id: true },
  });
  if (existingEmployeeId) {
    throw new Error(`Employee ID "${data.employeeId}" is already in use`);
  }

  /* email is unique if provided */
  if (data.email) {
    const existing = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error(`Employee with email "${data.email}" already exists`);
    }
  }

  return prisma.employee.create({ data });
}

export async function updateEmployee(id: string, data: z.infer<typeof employeeSchema>) {
  const existingEmployee = await prisma.employee.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingEmployee) throw new Error("Employee not found");

  const duplicateEmployeeId = await prisma.employee.findFirst({
    where: { id: { not: id }, employeeId: data.employeeId },
    select: { id: true },
  });
  if (duplicateEmployeeId) {
    throw new Error(`Employee ID "${data.employeeId}" is already in use`);
  }

  if (data.email) {
    const duplicateEmail = await prisma.employee.findFirst({
      where: { id: { not: id }, email: data.email },
      select: { id: true },
    });
    if (duplicateEmail) {
      throw new Error(`Employee with email "${data.email}" already exists`);
    }
  }

  return prisma.employee.update({
    where: { id },
    data,
  });
}

export async function deleteEmployee(id: string) {
  const activeAssignments = await prisma.assetAssignment.count({
    where: { employeeId: id, returnedAt: null },
  });
  if (activeAssignments > 0) {
    throw new Error("Cannot delete employee with active asset assignments");
  }

  return prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });
}

/* ═══════════════════════════════════════════════════════════════ */
/* GLOBAL SEARCH + EMPLOYEE PROFILE                               */
/* ═══════════════════════════════════════════════════════════════ */

export type SearchResultType = "employee" | "asset";

export interface GlobalSearchResult {
  type: SearchResultType;
  id: string;
  href: string;
  label: string;
  subLabel: string;
  matchReason: string;
}

export interface EmployeeProfileAssetSummary {
  id: string;
  assetTag: string;
  stockCategoryName: string;
  brand: string;
  model: string;
  pcNumber: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  osInstalled: string | null;
  ram: string | null;
  storage: string | null;
  serialNumber: string | null;
  name: string;
  status: string;
}

export interface EmployeeProfileAssignment {
  id: string;
  assignedAt: string;
  notes: string | null;
  location: {
    buildingName: string | null;
    roomNumber: string | null;
    roomName: string | null;
    floor: string | null;
  };
  asset: EmployeeProfileAssetSummary;
}

export interface EmployeeProfileData {
  id: string;
  employeeId: string;
  fullName: string;
  title: string;
  departmentName: string;
  email: string | null;
  phone: string | null;
  phoneExt: string | null;
  position: string | null;
  activeAssignments: EmployeeProfileAssignment[];
}

const normalizeSearchTerm = (value: string) => value.trim().toLowerCase();

const scoreTextMatch = (value: string | null | undefined, query: string, base: number) => {
  if (!value) return 0;
  const normalized = value.toLowerCase();
  if (normalized === query) return base + 40;
  if (normalized.startsWith(query)) return base + 20;
  if (normalized.includes(query)) return base + 10;
  return 0;
};

export async function searchGlobalDirectory(rawQuery: string): Promise<GlobalSearchResult[]> {
  const query = normalizeSearchTerm(rawQuery);
  if (!query) return [];

  const [employees, unassignedAssets] = await Promise.all([
    prisma.employee.findMany({
      where: {
        isActive: true,
        OR: [
          { employeeId: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          {
            assignments: {
              some: {
                returnedAt: null,
                asset: { pcNumber: { contains: query, mode: "insensitive" } },
              },
            },
          },
          {
            assignments: {
              some: {
                returnedAt: null,
                room: { roomNumber: { contains: query, mode: "insensitive" } },
              },
            },
          },
        ],
      },
      include: {
        department: true,
        assignments: {
          where: { returnedAt: null },
          include: {
            asset: {
              select: {
                id: true,
                pcNumber: true,
                assetTag: true,
                brand: true,
                model: true,
              },
            },
            room: {
              select: {
                roomNumber: true,
                name: true,
                building: { select: { name: true, code: true } },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
      },
      take: 25,
    }),
    prisma.asset.findMany({
      where: {
        assignments: { none: { returnedAt: null } },
        OR: [
          { pcNumber: { contains: query, mode: "insensitive" } },
          { assetTag: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        pcNumber: true,
        assetTag: true,
        brand: true,
        model: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const employeeResults = employees.map((employee) => {
    const fullName = `${employee.firstName} ${employee.lastName}`.trim();
    const firstAssignment = employee.assignments[0];
    const assignmentRoom = firstAssignment?.room;
    const assignmentAsset = firstAssignment?.asset;
    const bestPcNumber =
      assignmentAsset?.pcNumber ??
      employee.assignments.find((assignment) => assignment.asset.pcNumber)?.asset.pcNumber ??
      null;
    const bestRoomNumber =
      assignmentRoom?.roomNumber ??
      employee.assignments.find((assignment) => assignment.room?.roomNumber)?.room?.roomNumber ??
      null;

    const score =
      scoreTextMatch(employee.employeeId, query, 140) +
      scoreTextMatch(fullName, query, 120) +
      scoreTextMatch(employee.email, query, 100) +
      scoreTextMatch(employee.phone, query, 95) +
      scoreTextMatch(bestPcNumber, query, 130) +
      scoreTextMatch(bestRoomNumber, query, 90);

    const roomLabel = assignmentRoom
      ? `${assignmentRoom.building.code} ${assignmentRoom.roomNumber ?? assignmentRoom.name}`
      : "No active room assignment";

    return {
      score,
      item: {
        type: "employee" as const,
        id: employee.id,
        href: `/organization/employees/${employee.id}`,
        label: fullName,
        subLabel: `${employee.employeeId} · ${employee.department.name} · ${roomLabel}`,
        matchReason: "Employee/assignment match",
      },
    };
  });

  const assetResults = unassignedAssets.map((asset) => {
    const score =
      scoreTextMatch(asset.pcNumber, query, 160) +
      scoreTextMatch(asset.assetTag, query, 120) +
      scoreTextMatch(`${asset.brand} ${asset.model}`, query, 80);

    return {
      score,
      item: {
        type: "asset" as const,
        id: asset.id,
        href: `/assets/${asset.id}`,
        label: asset.pcNumber ? `${asset.pcNumber} · ${asset.brand} ${asset.model}` : `${asset.brand} ${asset.model}`,
        subLabel: `${asset.assetTag} · Unassigned asset`,
        matchReason: "Unassigned asset match",
      },
    };
  });

  return [...employeeResults, ...assetResults]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((result) => result.item);
}

export async function getEmployeeProfileById(id: string): Promise<EmployeeProfileData | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      assignments: {
        where: { returnedAt: null },
        include: {
          room: {
            include: {
              building: true,
            },
          },
          asset: {
            include: {
              stockCategory: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!employee || !employee.isActive) return null;

  return {
    id: employee.id,
    employeeId: employee.employeeId,
    fullName: `${employee.firstName} ${employee.lastName}`.trim(),
    title: employee.title,
    departmentName: employee.department.name,
    email: employee.email,
    phone: employee.phone,
    phoneExt: employee.phoneExt,
    position: employee.position,
    activeAssignments: employee.assignments.map((assignment) => ({
      id: assignment.id,
      assignedAt: assignment.assignedAt.toISOString(),
      notes: assignment.notes,
      location: {
        buildingName: assignment.room?.building.name ?? null,
        roomNumber: assignment.room?.roomNumber ?? null,
        roomName: assignment.room?.name ?? null,
        floor: assignment.room?.floor ?? null,
      },
      asset: {
        id: assignment.asset.id,
        assetTag: assignment.asset.assetTag,
        stockCategoryName: assignment.asset.stockCategory.name,
        brand: assignment.asset.brand,
        model: assignment.asset.model,
        pcNumber: assignment.asset.pcNumber,
        ipAddress: assignment.asset.ipAddress,
        macAddress: assignment.asset.macAddress,
        osInstalled: assignment.asset.osInstalled,
        ram: assignment.asset.ram,
        storage: assignment.asset.storage,
        serialNumber: assignment.asset.serialNumber,
        name: assignment.asset.name,
        status: assignment.asset.status,
      },
    })),
  };
}
