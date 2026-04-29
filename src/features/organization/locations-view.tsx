/**
 * @file locations-view.tsx
 * @description Sub-view for managing buildings and navigating to building-scoped room management.
 */

import { useState, useEffect } from "react";
import { Plus, Building, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BuildingForm } from "@/features/organization/building-form";

type BuildingRow = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    rooms: number;
  };
};

export const LocationsView = () => {
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRow | null>(null);
  const [deleteBuildingId, setDeleteBuildingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const buildingsRes = await fetch("/api/buildings");

      const buildingsJson: unknown = await buildingsRes.json();

      if (
        !buildingsRes.ok ||
        typeof buildingsJson !== "object" ||
        buildingsJson === null ||
        !("success" in buildingsJson)
      ) {
        throw new Error("Failed to load buildings");
      }

      const buildingsPayload = buildingsJson as { success: boolean; data?: BuildingRow[]; error?: string };

      if (!buildingsPayload.success) throw new Error(buildingsPayload.error ?? "Failed to load buildings");

      setBuildings(buildingsPayload.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch buildings");
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

  const handleEditBuilding = (building: BuildingRow) => {
    setSelectedBuilding(building);
    setIsEditBuildingModalOpen(true);
  };

  const handleDeleteBuilding = async (building: BuildingRow) => {
    const confirmed = window.confirm(`Delete building ${building.name}?`);
    if (!confirmed) return;
    setDeleteBuildingId(building.id);
    setError(null);
    try {
      const res = await fetch(`/api/buildings/${building.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to delete building");
      }
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete building");
    } finally {
      setDeleteBuildingId(null);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      
      {/* Buildings Section */}
      <Card>
        <CardHeader className="border-b border-gray-100 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-400" />
              Registered Buildings
            </h2>
            <div className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsBuildingModalOpen(true)}
              >
                Add Building
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {buildings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No buildings configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Building Name</th>
                    <th className="px-6 py-3 whitespace-nowrap">Code</th>
                    <th className="px-6 py-3 whitespace-nowrap">Total Rooms</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buildings.map((bld) => (
                    <tr key={bld.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{bld.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><Badge variant="outline">{bld.code}</Badge></td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{bld._count?.rooms || 0} Rooms</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link href={`/organization/buildings/${bld.id}`} className="inline-flex">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              leftIcon={<Eye className="w-4 h-4" />}
                            >
                              View
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<Pencil className="w-4 h-4" />}
                            onClick={() => handleEditBuilding(bld)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            isLoading={deleteBuildingId === bld.id}
                            onClick={() => void handleDeleteBuilding(bld)}
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
      <p className="text-sm text-gray-500">
        Manage rooms inside each building by opening its <span className="font-medium text-gray-700">View</span> page.
      </p>
      
      <Modal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        title="Add New Building"
        description="Register a physical building to the system."
      >
        <BuildingForm
          onSuccess={() => {
            setIsBuildingModalOpen(false);
            fetchData();
          }}
          onCancel={() => setIsBuildingModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditBuildingModalOpen}
        onClose={() => setIsEditBuildingModalOpen(false)}
        title="Edit Building"
        description="Update building details."
      >
        <BuildingForm
          key={selectedBuilding?.id ?? "edit-building"}
          buildingId={selectedBuilding?.id}
          initialData={
            selectedBuilding
              ? {
                  name: selectedBuilding.name,
                  code: selectedBuilding.code,
                  description: selectedBuilding.description ?? "",
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditBuildingModalOpen(false);
            void fetchData();
          }}
          onCancel={() => setIsEditBuildingModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
