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
