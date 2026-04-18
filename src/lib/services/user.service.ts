/**
 * @file user.service.ts
 * @description Admin-only operations on `User` (IT staff login accounts).
 */

import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { BCRYPT_SALT_ROUNDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user.schema";

/** Public user fields — never includes password */
export type UserPublic = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const publicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/* Ensures at least one active ADMIN remains after demoting or deactivating */
async function assertNotRemovingLastAdmin(
  targetUserId: string,
  nextRole?: Role,
  nextIsActive?: boolean
): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new Error("User not found");
  }

  const isTargetActiveAdmin = target.role === "ADMIN" && target.isActive;
  if (!isTargetActiveAdmin) {
    return;
  }

  const wouldCeaseToBeActiveAdmin =
    nextRole === "MEMBER" || nextIsActive === false;

  if (!wouldCeaseToBeActiveAdmin) {
    return;
  }

  const otherActiveAdmins = await prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      id: { not: targetUserId },
    },
  });

  if (otherActiveAdmins === 0) {
    throw new Error("Cannot remove or demote the last administrator");
  }
}

/** Lists all login users (passwords omitted) */
export async function listUsers(): Promise<UserPublic[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: publicSelect,
  });
}

/** Creates a new login user with hashed password */
export async function createUser(input: CreateUserInput): Promise<UserPublic> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new Error(`A user with email "${input.email}" already exists`);
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
      role: input.role,
      isActive: true,
    },
    select: publicSelect,
  });
}

/** Updates role, name, or active flag; guards last admin */
export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<UserPublic> {
  await assertNotRemovingLastAdmin(id, input.role, input.isActive);

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: publicSelect,
  });
}
