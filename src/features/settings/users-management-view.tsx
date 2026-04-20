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
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [deleteCandidate, setDeleteCandidate] = useState<UserPublic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const openEditModal = (user: UserPublic) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
  };

  const submitEdit = async () => {
    if (!editingUser) return;
    const normalizedName = editName.trim();
    if (!normalizedName) {
      addToast({ title: "Invalid name", message: "Name is required.", variant: "error" });
      return;
    }

    await patchUser(editingUser.id, {
      name: normalizedName,
      role: editRole,
      isActive: editIsActive,
    });
    setEditingUser(null);
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeletingId(deleteCandidate.id);
    try {
      const res = await fetch(`/api/users/${deleteCandidate.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Delete failed");
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteCandidate.id));
      addToast({ title: "User deleted", message: `${deleteCandidate.email} removed.`, variant: "success" });
      setDeleteCandidate(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      addToast({ title: "Could not delete user", message, variant: "error" });
      await fetchUsers();
    } finally {
      setDeletingId(null);
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
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                        <span className="text-gray-700">{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600">{u.isActive ? "Yes" : "No"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(u)}
                            disabled={patchingId === u.id || deletingId === u.id}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteCandidate(u)}
                            disabled={u.id === currentUserId || patchingId === u.id || deletingId === u.id}
                          >
                            Delete
                          </Button>
                        </div>
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

      <Modal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title="Edit user"
        description="Update name, role, and active status for this login account."
        size="md"
      >
        <div className="space-y-5">
          <Input
            label="Display name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as "ADMIN" | "MEMBER")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
              <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Account is active</span>
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={!!patchingId}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={() => void submitEdit()} isLoading={!!patchingId}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteCandidate !== null}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => void handleDelete()}
        title="Delete user account?"
        message={
          deleteCandidate
            ? `This will permanently delete ${deleteCandidate.email}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={!!deletingId}
        variant="danger"
      />
    </div>
  );
};
