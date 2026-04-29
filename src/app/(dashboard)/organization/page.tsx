/**
 * @file page.tsx
 * @description Organization management page using top tabs for employees, departments, and places.
 */
"use client";

import { useState } from "react";
import { Building2, GraduationCap, Users } from "lucide-react";

/* Feature Components */
import { DepartmentsView } from "@/features/organization/departments-view";
import { LocationsView } from "@/features/organization/locations-view";
import { EmployeesView } from "@/features/organization/employees-view";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "departments" | "places">("employees");

  return (
    <div className="animate-fade-in pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Map</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define physical locations and register employees so hardware can be assigned.
        </p>
      </div>

      <div className="mb-6 flex w-full max-w-3xl gap-1 rounded-xl border border-gray-200/60 bg-gray-100/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "employees"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Registered Employees
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("departments")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "departments"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Academic & Administrative
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("places")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            activeTab === "places"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Places & Locations
        </button>
      </div>

      {activeTab === "employees" && <EmployeesView />}
      {activeTab === "departments" && <DepartmentsView />}
      {activeTab === "places" && <LocationsView />}
    </div>
  );
}
