/**
 * @file page.tsx
 * @description Account page for changing the current user's password.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/features/account/change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Change Password
        </h2>
        <p className="text-sm text-gray-500">
          Update the password for your current account. Use a strong password that you do not use
          elsewhere.
        </p>
      </header>

      <ChangePasswordForm />
    </section>
  );
}
