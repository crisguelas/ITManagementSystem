/**
 * @file seed.ts
 * @description Prisma database seed script. 
 * Creates the initial admin user required for first-time login.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  /* ═══════════════════════════════════════════════════════════════ */
  /* DEFAULT ADMIN USER                                              */
  /* ═══════════════════════════════════════════════════════════════ */

  /* Requested bootstrap credentials for fresh reset baseline */
  const adminEmail = "admin@itms.imc";
  const rawPassword = "admin123";

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

  console.log("✅ Admin user seeded successfully!");
  console.log("  Email:", adminUser.email);
  console.log("  Password: admin123");

  console.log("🌱 Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
