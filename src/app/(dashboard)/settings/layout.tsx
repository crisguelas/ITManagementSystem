/**
 * @file layout.tsx
 * @description Settings hub for account-management functions.
 * User account management under `/settings/users` is gated to **ADMIN** only.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

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
              Manage system <strong className="font-medium text-gray-700">user accounts</strong>.
            </>
          ) : (
            <>Settings are limited for your role.</>
          )}
        </p>
      </header>

      {children}
    </div>
  );
}
