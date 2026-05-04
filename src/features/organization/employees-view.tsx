/**
 * @file employees-view.tsx
 * @description Sub-view managing registered employees and employee CRUD actions.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Title, type Department, type Employee } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { EmployeeForm } from "@/features/organization/employee-form";
import { DEFAULT_PAGE_SIZE, TITLE_LABELS } from "@/lib/constants";
import type { PaginatedListPayload } from "@/types";

type DepartmentRow = Department & { _count?: { employees: number } };
type EmployeeRow = Employee & {
  department: Department;
  _count?: { assignments: number };
};

export const EmployeesView = () => {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeesTotal, setEmployeesTotal] = useState(0);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [employeesPageSize, setEmployeesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<(Employee & { department: Department }) | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQ((prev) => {
        const next = searchInput.trim();
        if (next !== prev) {
          queueMicrotask(() => setEmployeesPage(1));
        }
        return next;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  /* Department dropdown options (first 100 rows — sufficient for typical org sizes) */
  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const qs = new URLSearchParams({ page: "1", pageSize: "100" });
          const depRes = await fetch(`/api/departments?${qs.toString()}`);
          const depJson: unknown = await depRes.json();
          if (!depRes.ok || typeof depJson !== "object" || depJson === null || !("success" in depJson)) return;
          const body = depJson as { success: boolean; data?: PaginatedListPayload<DepartmentRow> };
          if (body.success && body.data) {
            setDepartments(body.data.items);
          }
        } catch {
          /* Non-fatal: modals validate against empty department list */
        }
      })();
    }, 0);
    return () => window.clearTimeout(t);
  }, [reloadKey]);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(employeesPage),
        pageSize: String(employeesPageSize),
      });
      if (debouncedQ) qs.set("q", debouncedQ);
      const empRes = await fetch(`/api/employees?${qs.toString()}`);
      const empJson: unknown = await empRes.json();

      if (!empRes.ok || typeof empJson !== "object" || empJson === null || !("success" in empJson)) {
        throw new Error("Failed to load employees");
      }
      const body = empJson as { success: boolean; error?: string; data?: PaginatedListPayload<EmployeeRow> };
      if (!body.success || !body.data) {
        throw new Error(typeof body.error === "string" ? body.error : "Failed to load employees");
      }
      setEmployees(body.data.items);
      setEmployeesTotal(body.data.total);
      setEmployeesPage(body.data.page);
      setEmployeesPageSize(body.data.pageSize);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load organization data");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [employeesPage, employeesPageSize, debouncedQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadEmployees();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadEmployees, reloadKey]);

  const handleDeleteEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(`Delete employee ${employee.firstName} ${employee.lastName}?`);
    if (!confirmed) return;
    setDeleteEmployeeId(employee.id);
    setError(null);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to delete employee");
      }
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete employee");
    } finally {
      setDeleteEmployeeId(null);
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
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-gray-400" />
              Registered Employees
            </h2>
            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
              <div className="relative w-full lg:w-80">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by employee ID, name, department, or position..."
                  className="block h-10 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm transition-shadow placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="w-full shrink-0 lg:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full whitespace-nowrap lg:w-auto"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsEmployeeModalOpen(true)}
                >
                  Add Employee
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {employeesTotal === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              {debouncedQ ? "No employees match the current search." : "No active employees yet."}
            </div>
          ) : (
            <div className={`overflow-x-auto ${isLoading ? "opacity-60" : ""}`}>
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3">Employee ID</th>
                    <th className="whitespace-nowrap px-6 py-3">Name</th>
                    <th className="whitespace-nowrap px-6 py-3">Department</th>
                    <th className="whitespace-nowrap px-6 py-3">Email</th>
                    <th className="whitespace-nowrap px-6 py-3">Mobile / Ext</th>
                    <th className="whitespace-nowrap px-6 py-3">Position</th>
                    <th className="whitespace-nowrap px-6 py-3">Active Assignments</th>
                    <th className="whitespace-nowrap px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-700">
                        {emp.employeeId ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                        {TITLE_LABELS[emp.title] ?? emp.title} {emp.firstName} {emp.lastName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">{emp.department.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">{emp.email ?? "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {emp.phone
                          ? `${emp.phone}${emp.phoneExt ? ` / ${emp.phoneExt}` : ""}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">{emp.position || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500">{emp._count?.assignments || 0}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link href={`/organization/employees/${emp.id}`} className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              leftIcon={<Eye className="h-4 w-4" />}
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<Pencil className="h-4 w-4" />}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsEditEmployeeModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            isLoading={deleteEmployeeId === emp.id}
                            onClick={() => void handleDeleteEmployee(emp)}
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
          {employeesTotal > 0 ? (
            <TablePagination
              total={employeesTotal}
              page={employeesPage}
              pageSize={employeesPageSize}
              disabled={isLoading}
              onPageChange={(next) => setEmployeesPage(next)}
              onPageSizeChange={(next) => {
                setEmployeesPageSize(next);
                setEmployeesPage(1);
              }}
            />
          ) : null}
        </CardBody>
      </Card>

      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Add Employee"
        description="Creates an organization record (not an ITMS login). At least one department must exist."
        size="md"
      >
        <EmployeeForm
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
          onSuccess={() => {
            setIsEmployeeModalOpen(false);
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setIsEmployeeModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditEmployeeModalOpen}
        onClose={() => setIsEditEmployeeModalOpen(false)}
        title="Edit Employee"
        description="Update employee information used for assignments."
        size="md"
      >
        <EmployeeForm
          key={selectedEmployee?.id ?? "edit-employee"}
          employeeId={selectedEmployee?.id}
          initialData={
            selectedEmployee
              ? {
                  employeeId: selectedEmployee.employeeId ?? "",
                  title: selectedEmployee.title as Title,
                  firstName: selectedEmployee.firstName,
                  lastName: selectedEmployee.lastName,
                  email: selectedEmployee.email ?? "",
                  phone: selectedEmployee.phone ?? "",
                  phoneExt: selectedEmployee.phoneExt ?? "",
                  departmentId: selectedEmployee.departmentId,
                  position: selectedEmployee.position ?? "",
                }
              : undefined
          }
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
          onSuccess={() => {
            setIsEditEmployeeModalOpen(false);
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setIsEditEmployeeModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
