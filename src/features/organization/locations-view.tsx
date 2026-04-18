/**
 * @file locations-view.tsx
 * @description Sub-view managing standard buildings and rooms.
 */

import { useState, useEffect } from "react";
import { Plus, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BuildingForm } from "@/features/organization/building-form";

export const LocationsView = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/buildings");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");
      setBuildings(json.data);
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
      
      {/* Buildings Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
           <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
             <Building className="w-5 h-5 text-gray-400" />
             Registered Buildings
           </h2>
           <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsBuildingModalOpen(true)}>Add Building</Button>
        </CardHeader>
        <CardBody className="p-0">
          {buildings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No buildings configured yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Building Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Total Rooms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildings.map((bld) => (
                  <tr key={bld.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{bld.name}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{bld.code}</Badge></td>
                    <td className="px-6 py-4 text-gray-500">{bld._count?.rooms || 0} Rooms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      
      {/* Rooms placeholder (since we are focusing on scaffolding the layout quickly) */}
      <div className="bg-gradient-to-r from-primary-50 to-white rounded-xl p-6 border border-primary-100 flex items-center justify-between">
         <div>
           <h3 className="font-semibold text-primary-900">Manage Rooms</h3>
           <p className="text-sm text-primary-600 mt-1">Add internal layout data tracking offices and labs.</p>
         </div>
         <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />}>Register Room</Button>
      </div>

      <Modal 
        isOpen={isBuildingModalOpen} 
        onClose={() => setIsBuildingModalOpen(false)}
        title="Add New Building"
        description="Register a physical building to the system."
      >
        <BuildingForm 
          onSuccess={() => { setIsBuildingModalOpen(false); fetchData(); }}
          onCancel={() => setIsBuildingModalOpen(false)}
        />
      </Modal>

    </div>
  );
};
