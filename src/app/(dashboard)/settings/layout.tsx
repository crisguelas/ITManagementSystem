/**
 * @file layout.tsx
 * @description Settings area — only **ADMIN** users can access any route under `/settings`.
 * Members do not see Settings in the sidebar and are redirected here if they open the URL directly.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SettingsNav } from "@/features/settings/settings-nav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500">
          Application configuration. Only{" "}
          <strong className="font-medium text-gray-700">administrators</strong> can access this area.
        </p>
      </header>

      <SettingsNav />

      {children}
    </div>
  );
}
