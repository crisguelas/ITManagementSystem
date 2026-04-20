/**
 * @file page.tsx
 * @description Manage IT staff login accounts and roles. Admin-only access is enforced in `settings/users/layout.tsx`.
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { UsersManagementView } from "@/features/settings/users-management-view";

export default async function SettingsUsersPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return <UsersManagementView currentUserId={session.user.id} />;
}
