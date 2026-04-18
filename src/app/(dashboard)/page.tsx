/**
 * @file page.tsx
 * @description Master dashboard — server-loads analytics via `getDashboardStats` (Phase 7).
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/dashboard.service";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardStats();

  return <DashboardView data={data} />;
}
