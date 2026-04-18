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

  /* Credentials come from .env only — never commit real passwords to the repository */
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.trim() || "admin@example.local";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!rawPassword) {
    console.error(
      "\n❌ SEED_ADMIN_PASSWORD is not set. Add it to your .env file (see .env.example), then run the seed again.\n"
    );
    process.exit(1);
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

  console.log("✅ Admin user seeded successfully!");
  console.log("  Email:", adminUser.email);
  console.log("  (Password was taken from SEED_ADMIN_PASSWORD in .env — not logged here.)");
  
  /* ═══════════════════════════════════════════════════════════════ */
  /* DEFAULT ASSET CATEGORIES                                        */
  /* ═══════════════════════════════════════════════════════════════ */
  
  const defaultCategories = [
    { name: "Desktop PC", prefix: "PC", description: "Standard workstation computers" },
    { name: "Laptop", prefix: "LPT", description: "Portable computers" },
    { name: "Monitor", prefix: "MON", description: "Display screens" },
    { name: "Printer", prefix: "PRN", description: "Network and local printers" },
    { name: "Router", prefix: "RTR", description: "Network routers and switches" },
  ];

  for (const cat of defaultCategories) {
    await prisma.assetCategory.upsert({
      where: { prefix: cat.prefix },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Default asset categories seeded successfully!");

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
