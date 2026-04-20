/**
 * @file page.tsx
 * @description Reports page — server-loads datasets for Excel/PDF exports.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ReportsView } from "@/features/reports/reports-view";
import { getReportsData } from "@/lib/services/report.service";

type ReportsPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const data = await getReportsData({
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });

  return (
    <ReportsView
      key={`${data.period.from ?? ""}|${data.period.to ?? ""}`}
      data={data}
    />
  );
}
