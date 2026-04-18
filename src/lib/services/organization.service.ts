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

export async function createBuilding(data: z.infer<typeof buildingSchema>) {
  const existingName = await prisma.building.findUnique({ where: { name: data.name } });
  if (existingName) throw new Error(`Building "${data.name}" already exists`);
  
  const existingCode = await prisma.building.findUnique({ where: { code: data.code } });
  if (existingCode) throw new Error(`Building code "${data.code}" is already in use`);

  return prisma.building.create({ data });
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
  /* email is unique if provided */
  if (data.email) {
    const existing = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error(`Employee with email "${data.email}" already exists`);
    }
  }

  return prisma.employee.create({ data });
}
