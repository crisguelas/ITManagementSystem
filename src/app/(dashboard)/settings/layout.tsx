/**
 * @file layout.tsx
 * @description Settings hub — any signed-in user may open `/settings` for shared configuration (e.g. categories).
 * User account management under `/settings/users` is gated separately to **ADMIN** only.
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

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500">
          {isAdmin ? (
            <>
              Application configuration and{" "}
              <strong className="font-medium text-gray-700">user account</strong> management.
            </>
          ) : (
            <>Application configuration available to your role.</>
          )}
        </p>
      </header>

      <SettingsNav isAdmin={isAdmin} />

      {children}
    </div>
  );
}
