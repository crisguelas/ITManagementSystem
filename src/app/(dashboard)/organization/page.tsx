/**
 * @file page.tsx
 * @description Organization management page. Handles tabs for Places (Locations) and People (Employees).
 */
"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Building2, Users } from "lucide-react";

/* Feature Components */
import { LocationsView } from "@/features/organization/locations-view";
import { EmployeesView } from "@/features/organization/employees-view";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<"places" | "people">("places");

  return (
    <div className="animate-fade-in pb-12">
      <Breadcrumb />
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Map</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define physical locations and register employees so hardware can be assigned.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-full max-w-sm mb-6 border border-gray-200/60">
        <button
          type="button"
          onClick={() => setActiveTab("places")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "places"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Places & Locations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("people")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "people"
              ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          <Users className="w-4 h-4" />
          Teams & People
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === "places" && <LocationsView />}
      {activeTab === "people" && <EmployeesView />}
      
    </div>
  );
}
