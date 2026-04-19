/**
 * @file employees-view.tsx
 * @description Sub-view managing departments and specific employees.
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DepartmentForm } from "@/features/organization/department-form";
import { EmployeeForm } from "@/features/organization/employee-form";

export const EmployeesView = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/departments");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");
      setDepartments(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <SkeletonTable rows={4} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      
      {/* Departments Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
           <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
             <Users className="w-5 h-5 text-gray-400" />
             Academic & Admin Departments
           </h2>
           <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsDeptModalOpen(true)}>Add Department</Button>
        </CardHeader>
        <CardBody className="p-0">
          {departments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No departments set up yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3">Short Code</th>
                  <th className="px-6 py-3">Registered Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{dep.name}</td>
                    <td className="px-6 py-4"><Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">{dep.code}</Badge></td>
                    <td className="px-6 py-4 text-gray-500">{dep._count?.employees || 0} Staff Members</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      {/* Employees — register staff for assignments */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-6 border border-blue-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Manage Staff</h3>
          <p className="text-sm text-blue-600 mt-1">
            Register doctors, professors, or administrators to assign them assets directly.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsEmployeeModalOpen(true)}
        >
          Add Employee
        </Button>
      </div>

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
    </div>
  );
};
