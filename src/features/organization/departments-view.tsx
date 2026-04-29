/**
 * @file departments-view.tsx
 * @description Sub-view that manages organization departments with CRUD actions.
 */
"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Department } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonTable } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { DepartmentForm } from "@/features/organization/department-form";

type DepartmentRow = Department & { _count?: { employees: number } };
export const DepartmentsView = () => {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isEditDepartmentModalOpen, setIsEditDepartmentModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState<string | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/departments");
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to load departments");
      }

      setDepartments(payload.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDepartments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

      await fetchDepartments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    } finally {
      setDeleteDepartmentId(null);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={fetchDepartments} />;
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
            <div className="w-full sm:w-auto">
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsDepartmentModalOpen(true)}
                disabled={isLoading}
              >
                Add Unit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No units found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Unit Name</th>
                    <th className="px-6 py-3 whitespace-nowrap">Short Code</th>
                    <th className="px-6 py-3 whitespace-nowrap">Registered Employees</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departments.map((department) => {
                    return (
                      <tr key={department.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{department.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                            {department.code}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{department._count?.employees ?? 0} Staff Members</td>
                        <td className="px-6 py-4">
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
        </CardBody>
      </Card>

      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        title="Add Unit"
        description="Create an academic or administrative unit."
      >
        <DepartmentForm
          onSuccess={() => {
            setIsDepartmentModalOpen(false);
            void fetchDepartments();
          }}
          onCancel={() => setIsDepartmentModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditDepartmentModalOpen}
        onClose={() => setIsEditDepartmentModalOpen(false)}
        title="Edit Unit"
        description="Update unit details."
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
            void fetchDepartments();
          }}
          onCancel={() => setIsEditDepartmentModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
