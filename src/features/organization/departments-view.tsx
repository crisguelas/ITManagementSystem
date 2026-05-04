/**
 * @file departments-view.tsx
 * @description Sub-view that manages organization departments with CRUD actions.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Department } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonTable } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { DepartmentForm } from "@/features/organization/department-form";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedListPayload } from "@/types";

type DepartmentRow = Department & { _count?: { employees: number } };

export const DepartmentsView = () => {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQ((prev) => {
        const next = searchInput.trim();
        if (next !== prev) {
          queueMicrotask(() => setPage(1));
        }
        return next;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (debouncedQ) qs.set("q", debouncedQ);
      const response = await fetch(`/api/departments?${qs.toString()}`);
      const payload: unknown = await response.json();

      if (!response.ok || typeof payload !== "object" || payload === null || !("success" in payload)) {
        throw new Error("Failed to load departments");
      }
      const body = payload as { success: boolean; error?: string; data?: PaginatedListPayload<DepartmentRow> };
      if (!body.success || !body.data) {
        throw new Error(typeof body.error === "string" ? body.error : "Failed to load departments");
      }

      setDepartments(body.data.items);
      setTotal(body.data.total);
      setPage(body.data.page);
      setPageSize(body.data.pageSize);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [page, pageSize, debouncedQ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDepartments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchDepartments, reloadKey]);

  const handleDeleteDepartment = async (department: Department) => {
    const confirmed = window.confirm(`Delete department ${department.name}?`);
    if (!confirmed) return;

    setDeleteDepartmentId(department.id);
    setError(null);

    try {
      const response = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Failed to delete department");
      }

      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    } finally {
      setDeleteDepartmentId(null);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  if (!hasLoadedOnce && isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody className="p-4">
            <SkeletonTable rows={4} />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-gray-100 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Building2 className="h-5 w-5 text-gray-400" />
              Academic & Administrative
            </h2>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name or code..."
                  className="block h-10 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsDepartmentModalOpen(true)}
                  disabled={isLoading}
                >
                  Add Department
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {total === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No departments found.</div>
          ) : (
            <div className={`overflow-x-auto ${isLoading ? "opacity-60" : ""}`}>
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3">Department Name</th>
                    <th className="whitespace-nowrap px-6 py-3">Short Code</th>
                    <th className="whitespace-nowrap px-6 py-3">Registered Employees</th>
                    <th className="whitespace-nowrap px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departments.map((department) => {
                    return (
                      <tr key={department.id} className="transition-colors hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{department.name}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                            {department.code}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                          {department._count?.employees ?? 0} Staff Members
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              leftIcon={<Pencil className="h-4 w-4" />}
                              onClick={() => {
                                setSelectedDepartment(department);
                                setIsEditDepartmentModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              leftIcon={<Trash2 className="h-4 w-4" />}
                              isLoading={deleteDepartmentId === department.id}
                              onClick={() => void handleDeleteDepartment(department)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {total > 0 ? (
            <TablePagination
              total={total}
              page={page}
              pageSize={pageSize}
              disabled={isLoading}
              onPageChange={(next) => setPage(next)}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
            />
          ) : null}
        </CardBody>
      </Card>

      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        title="Add Department"
        description="Create an academic or administrative department."
      >
        <DepartmentForm
          onSuccess={() => {
            setIsDepartmentModalOpen(false);
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setIsDepartmentModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditDepartmentModalOpen}
        onClose={() => setIsEditDepartmentModalOpen(false)}
        title="Edit Department"
        description="Update department details."
      >
        <DepartmentForm
          key={selectedDepartment?.id ?? "edit-department"}
          departmentId={selectedDepartment?.id}
          initialData={
            selectedDepartment
              ? {
                  name: selectedDepartment.name,
                  code: selectedDepartment.code,
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditDepartmentModalOpen(false);
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setIsEditDepartmentModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
