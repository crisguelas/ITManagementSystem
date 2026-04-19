/**
 * @file employees-view.tsx
 * @description Sub-view managing departments and specific employees.
 */

"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Title, type Department, type Employee } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DepartmentForm } from "@/features/organization/department-form";
import { EmployeeForm } from "@/features/organization/employee-form";

export const EmployeesView = () => {
  const [departments, setDepartments] = useState<Array<Department & { _count?: { employees: number } }>>([]);
  const [employees, setEmployees] = useState<Array<Employee & { department: Department; _count?: { assignments: number } }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<(Employee & { department: Department }) | null>(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState<string | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees"),
      ]);

      const depJson = await depRes.json();
      const empJson = await empRes.json();

      if (!depRes.ok || !depJson.success) throw new Error(depJson.error || "Failed to load departments");
      if (!empRes.ok || !empJson.success) throw new Error(empJson.error || "Failed to load employees");

      setDepartments(depJson.data);
      setEmployees(empJson.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load organization data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const handleDeleteDepartment = async (department: Department) => {
    const confirmed = window.confirm(`Delete department ${department.name}?`);
    if (!confirmed) return;
    setDeleteDepartmentId(department.id);
    setError(null);
    try {
      const res = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to delete department");
      }
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
    } finally {
      setDeleteDepartmentId(null);
    }
  };

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
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete employee");
    } finally {
      setDeleteEmployeeId(null);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Departments Section — skeleton only inside card so "Add Employee" is never hidden by loading */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Academic & Admin Departments
          </h2>
          <Button
            type="button"
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsDeptModalOpen(true)}
            disabled={isLoading}
          >
            Add Department
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No departments set up yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3">Short Code</th>
                  <th className="px-6 py-3">Registered Employees</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{dep.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                        {dep.code}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{dep._count?.employees || 0} Staff Members</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Pencil className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedDepartment(dep);
                            setIsEditDeptModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          isLoading={deleteDepartmentId === dep.id}
                          onClick={() => void handleDeleteDepartment(dep)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Registered Employees
          </h2>
          <Button
            type="button"
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsEmployeeModalOpen(true)}
          >
            Add Employee
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No active employees yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Active Assignments</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {emp.title} {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.department.name}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.position || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{emp._count?.assignments || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Pencil className="w-4 h-4" />}
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
                          leftIcon={<Trash2 className="w-4 h-4" />}
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
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Department"
        description="Create an organization branch or academic college."
      >
        <DepartmentForm
          onSuccess={() => {
            setIsDeptModalOpen(false);
            fetchData();
          }}
          onCancel={() => setIsDeptModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditDeptModalOpen}
        onClose={() => setIsEditDeptModalOpen(false)}
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
            setIsEditDeptModalOpen(false);
            void fetchData();
          }}
          onCancel={() => setIsEditDeptModalOpen(false)}
        />
      </Modal>

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
            fetchData();
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
                  title: selectedEmployee.title as Title,
                  firstName: selectedEmployee.firstName,
                  lastName: selectedEmployee.lastName,
                  email: selectedEmployee.email ?? "",
                  phone: selectedEmployee.phone ?? "",
                  departmentId: selectedEmployee.departmentId,
                  position: selectedEmployee.position ?? "",
                }
              : undefined
          }
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
          onSuccess={() => {
            setIsEditEmployeeModalOpen(false);
            void fetchData();
          }}
          onCancel={() => setIsEditEmployeeModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
