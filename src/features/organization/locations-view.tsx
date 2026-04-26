/**
 * @file locations-view.tsx
 * @description Sub-view managing standard buildings and rooms.
 */

import { useState, useEffect } from "react";
import { Plus, Building, Pencil, Trash2 } from "lucide-react";
import type { RoomType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BuildingForm } from "@/features/organization/building-form";
import { RoomForm } from "@/features/organization/room-form";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

type BuildingRow = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    rooms: number;
  };
};

type RoomRow = {
  id: string;
  name: string;
  roomNumber?: string | null;
  floor?: string | null;
  type: RoomType;
  building: {
    id: string;
    name: string;
    code: string;
  };
};

export const LocationsView = () => {
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRow | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null);
  const [deleteBuildingId, setDeleteBuildingId] = useState<string | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [buildingsRes, roomsRes] = await Promise.all([
        fetch("/api/buildings"),
        fetch("/api/rooms"),
      ]);

      const buildingsJson: unknown = await buildingsRes.json();
      const roomsJson: unknown = await roomsRes.json();

      if (
        !buildingsRes.ok ||
        typeof buildingsJson !== "object" ||
        buildingsJson === null ||
        !("success" in buildingsJson)
      ) {
        throw new Error("Failed to load buildings");
      }

      if (
        !roomsRes.ok ||
        typeof roomsJson !== "object" ||
        roomsJson === null ||
        !("success" in roomsJson)
      ) {
        throw new Error("Failed to load rooms");
      }

      const buildingsPayload = buildingsJson as { success: boolean; data?: BuildingRow[]; error?: string };
      const roomsPayload = roomsJson as { success: boolean; data?: RoomRow[]; error?: string };

      if (!buildingsPayload.success) throw new Error(buildingsPayload.error ?? "Failed to load buildings");
      if (!roomsPayload.success) throw new Error(roomsPayload.error ?? "Failed to load rooms");

      setBuildings(buildingsPayload.data ?? []);
      setRooms(roomsPayload.data ?? []);
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

  const handleEditRoom = (room: RoomRow) => {
    setSelectedRoom(room);
    setIsEditRoomModalOpen(true);
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

  const handleDeleteRoom = async (room: RoomRow) => {
    const confirmed = window.confirm(`Delete room ${room.name}?`);
    if (!confirmed) return;
    setDeleteRoomId(room.id);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof json === "object" && json !== null && "error" in json && typeof json.error === "string"
            ? json.error
            : "Failed to delete room";
        throw new Error(message);
      }
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleteRoomId(null);
    }
  };

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
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildings.map((bld) => (
                  <tr key={bld.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{bld.name}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{bld.code}</Badge></td>
                    <td className="px-6 py-4 text-gray-500">{bld._count?.rooms || 0} Rooms</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
          )}
        </CardBody>
      </Card>
      
      {/* Rooms Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Registered Rooms</h2>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsRoomModalOpen(true)}
          >
            Register Room
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No rooms registered yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Room Name</th>
                  <th className="px-6 py-3">Room Number</th>
                  <th className="px-6 py-3">Floor</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{room.name}</td>
                    <td className="px-6 py-4 text-gray-600">{room.roomNumber ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{room.floor ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{ROOM_TYPE_LABELS[room.type] ?? room.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={<Pencil className="w-4 h-4" />}
                          onClick={() => handleEditRoom(room)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          isLoading={deleteRoomId === room.id}
                          onClick={() => void handleDeleteRoom(room)}
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

      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title="Register Room"
        description="Rooms must belong to an existing building. The room name must be unique within that building."
        size="md"
      >
        <RoomForm
          buildings={buildings.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
          onSuccess={() => {
            setIsRoomModalOpen(false);
            fetchData();
          }}
          onCancel={() => setIsRoomModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditRoomModalOpen}
        onClose={() => setIsEditRoomModalOpen(false)}
        title="Edit Room"
        description="Update room details."
        size="md"
      >
        <RoomForm
          key={selectedRoom?.id ?? "edit-room"}
          roomId={selectedRoom?.id}
          buildings={buildings.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
          initialData={
            selectedRoom
              ? {
                  name: selectedRoom.name,
                  roomNumber: selectedRoom.roomNumber ?? "",
                  floor: selectedRoom.floor ?? "",
                  buildingId: selectedRoom.building.id,
                  type: selectedRoom.type,
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditRoomModalOpen(false);
            void fetchData();
          }}
          onCancel={() => setIsEditRoomModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
