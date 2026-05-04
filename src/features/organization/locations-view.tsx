/**
 * @file locations-view.tsx
 * @description Sub-view for managing buildings and navigating to building-scoped room management.
 */

import { useCallback, useEffect, useState } from "react";
import { Building, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonTable } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { BuildingForm } from "@/features/organization/building-form";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedListPayload } from "@/types";

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRow | null>(null);
  const [deleteBuildingId, setDeleteBuildingId] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (debouncedQ) qs.set("q", debouncedQ);
      const buildingsRes = await fetch(`/api/buildings?${qs.toString()}`);
      const buildingsJson: unknown = await buildingsRes.json();

      if (
        !buildingsRes.ok ||
        typeof buildingsJson !== "object" ||
        buildingsJson === null ||
        !("success" in buildingsJson)
      ) {
        throw new Error("Failed to load buildings");
      }

      const buildingsPayload = buildingsJson as {
        success: boolean;
        data?: PaginatedListPayload<BuildingRow>;
        error?: string;
      };

      if (!buildingsPayload.success || !buildingsPayload.data) {
        throw new Error(buildingsPayload.error ?? "Failed to load buildings");
      }

      setBuildings(buildingsPayload.data.items);
      setTotal(buildingsPayload.data.total);
      setPage(buildingsPayload.data.page);
      setPageSize(buildingsPayload.data.pageSize);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch buildings");
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [page, pageSize, debouncedQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchData, reloadKey]);

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
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete building");
    } finally {
      setDeleteBuildingId(null);
    }
  };

  if (!hasLoadedOnce && isLoading) return <SkeletonTable rows={4} />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-gray-100 py-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Building className="h-5 w-5 text-gray-400" />
              Registered Buildings
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
                  placeholder="Search name, code, description..."
                  className="block h-10 w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsBuildingModalOpen(true)}
                >
                  Add Building
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {total === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No buildings configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-600">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3">Building Name</th>
                    <th className="whitespace-nowrap px-6 py-3">Code</th>
                    <th className="whitespace-nowrap px-6 py-3">Total Rooms</th>
                    <th className="whitespace-nowrap px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buildings.map((bld) => (
                    <tr key={bld.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{bld.name}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant="outline">{bld.code}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500">{bld._count?.rooms || 0} Rooms</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link href={`/organization/buildings/${bld.id}`} className="inline-flex">
                            <Button type="button" size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
                              View
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<Pencil className="h-4 w-4" />}
                            onClick={() => handleEditBuilding(bld)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            leftIcon={<Trash2 className="h-4 w-4" />}
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
      <p className="text-sm text-gray-500">
        Manage rooms inside each building by opening its <span className="font-medium text-gray-700">View</span>{" "}
        page.
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
            setReloadKey((k) => k + 1);
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
            setReloadKey((k) => k + 1);
          }}
          onCancel={() => setIsEditBuildingModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
