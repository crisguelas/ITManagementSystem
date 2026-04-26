/**
 * @file page.tsx
 * @description Organization management page using split workspace navigation for People and Places.
 */
"use client";

import { useState } from "react";
import { Building2, Users } from "lucide-react";

/* Feature Components */
import { LocationsView } from "@/features/organization/locations-view";
import { EmployeesView } from "@/features/organization/employees-view";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<"places" | "people">("people");

  return (
    <div className="animate-fade-in pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Map</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define physical locations and register employees so hardware can be assigned.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-gray-200/60 bg-gray-50/50 p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Workspace</p>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("people")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                activeTab === "people"
                  ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Teams & People
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("places")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                activeTab === "places"
                  ? "bg-white text-primary-700 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Places & Locations
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          {/* Render Active View */}
          {activeTab === "places" && <LocationsView />}
          {activeTab === "people" && <EmployeesView />}
        </section>
      </div>
    </div>
  );
}
