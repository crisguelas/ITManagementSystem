/**
 * @file page.tsx
 * @description Settings home — hub for role-appropriate links (user accounts for admins; categories for all).
 */

import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardBody } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { Tags, Users } from "lucide-react";

export default async function SettingsIndexPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 lg:max-w-3xl">
      {isAdmin && (
        <Link
          href="/settings/users"
          className="block rounded-xl transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <Card className="h-full border-gray-200 hover:border-primary-300">
            <CardBody className="flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold text-gray-900">User accounts</h2>
                <p className="text-sm text-gray-600">
                  Add IT staff logins, set roles (Administrator or Member), and activate or deactivate accounts.
                </p>
                <span className="text-sm font-medium text-primary-600">Open user management →</span>
              </div>
            </CardBody>
          </Card>
        </Link>
      )}

      <Link
        href="/categories"
        className="block rounded-xl transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <Card className="h-full border-gray-200 hover:border-primary-300">
          <CardBody className="flex items-start gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Tags className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold text-gray-900">Categories</h2>
              <p className="text-sm text-gray-600">
                Define asset categories and tag prefixes used when registering equipment.
              </p>
              <span className="text-sm font-medium text-primary-600">Open categories →</span>
            </div>
          </CardBody>
        </Card>
      </Link>
    </div>
  );
}
