/**
 * @file page.tsx
 * @description Reports page — server-loads datasets for Excel/PDF exports.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ReportsView } from "@/features/reports/reports-view";
import { getReportsData } from "@/lib/services/report.service";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const data = await getReportsData();

  return <ReportsView data={data} />;
}
