/**
 * @file users-management-view.tsx
 * @description Admin UI: list IT staff login accounts, change roles, activate/deactivate, add users.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { UserForm } from "@/features/settings/user-form";
import type { UserPublic } from "@/lib/services/user.service";

interface UsersManagementViewProps {
  /** Signed-in user id — used to label the current row */
  currentUserId: string;
}

export const UsersManagementView = ({ currentUserId }: UsersManagementViewProps) => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load users");
      }
      setUsers(json.data as UserPublic[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchUsers();
    });
  }, [fetchUsers]);

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    setPatchingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Update failed");
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? (json.data as UserPublic) : u)));
      addToast({ title: "Saved", message: "User updated.", variant: "success" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Update failed";
      addToast({ title: "Could not update", message, variant: "error" });
      await fetchUsers();
    } finally {
      setPatchingId(null);
    }
  };

  if (isLoading) {
    return <SkeletonTable rows={5} />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <p className="font-medium">Who is an administrator?</p>
        <p className="mt-1 text-blue-800/90">
          The <strong>first</strong> admin is created when you run{" "}
          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">npm run db:seed</code> with{" "}
          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">SEED_ADMIN_EMAIL</code> /{" "}
          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">SEED_ADMIN_PASSWORD</code> in{" "}
          <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">.env</code>. Anyone with role{" "}
          <strong>Administrator</strong> can manage users here. Role changes apply on the user&apos;s{" "}
          <strong>next sign-in</strong>.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            IT staff (login accounts)
          </h2>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Add user
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {users.length === 0 ? (
            <EmptyState
              title="No users"
              message="Run the database seed to create the first administrator."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{u.email}</span>
                        {u.id === currentUserId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.name}</td>
                      <td className="px-4 py-3">
                        <select
                          disabled={patchingId === u.id}
                          value={u.role}
                          onChange={(e) => {
                            const role = e.target.value as "ADMIN" | "MEMBER";
                            if (role !== u.role) {
                              void patchUser(u.id, { role });
                            }
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:opacity-50"
                        >
                          <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.isActive}
                            disabled={patchingId === u.id}
                            onChange={(e) => {
                              const isActive = e.target.checked;
                              if (isActive !== u.isActive) {
                                void patchUser(u.id, { isActive });
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-gray-600">{u.isActive ? "Yes" : "No"}</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add IT staff user"
        description="Creates a login for this application (not an Organization employee record)."
        size="md"
      >
        <UserForm
          onSuccess={() => {
            setModalOpen(false);
            void fetchUsers();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
