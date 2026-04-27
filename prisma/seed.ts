/**
 * @file seed.ts
 * @description Prisma database seed script. 
 * Creates the initial admin user required for first-time login.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  /* ═══════════════════════════════════════════════════════════════ */
  /* DEFAULT ADMIN USER                                              */
  /* ═══════════════════════════════════════════════════════════════ */

  /* Reads bootstrap admin credentials from environment to avoid hard-coded secrets in source control */
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;

  /* Fails fast when required seed credentials are missing or weak for safer first-admin provisioning */
  if (!adminEmail) {
    throw new Error("SEED_ADMIN_EMAIL is required for seeding.");
  }
  if (!rawPassword || rawPassword.trim().length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD is required and must be at least 10 characters.");
  }

  /* Hash the password (10 rounds) */
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  /* Upsert ensures it doesn't duplicate if script is run multiple times */
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Do nothing if already exists
    create: {
      email: adminEmail,
      name: "IT Administrator",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Admin user seeded successfully.");
  console.log("  Email:", adminUser.email);
  console.log("  Password: [provided via SEED_ADMIN_PASSWORD]");

  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
