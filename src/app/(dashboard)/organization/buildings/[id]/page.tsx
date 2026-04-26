/**
 * @file page.tsx
 * @description Building details page showing all rooms registered under a building.
 */

"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, DoorClosed, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { RoomType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { Modal } from "@/components/ui/modal";
import { RoomForm } from "@/features/organization/room-form";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

type RoomRow = {
  id: string;
  name: string;
  roomNumber: string | null;
  floor: string | null;
  type: RoomType;
  _count: { assignments: number };
};

type BuildingPayload = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  rooms: RoomRow[];
};

export default function BuildingRoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [building, setBuilding] = useState<BuildingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const fetchBuilding = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buildings/${id}`);
      const json = (await res.json()) as { success: boolean; data?: BuildingPayload; error?: string };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to load building");
      }
      setBuilding(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load building");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    /* Defer fetch so state updates do not run synchronously in the effect body */
    const t = window.setTimeout(() => {
      void fetchBuilding();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchBuilding]);

  const handleEditRoom = (room: RoomRow) => {
    setSelectedRoom(room);
    setIsEditRoomModalOpen(true);
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
      await fetchBuilding();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleteRoomId(null);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading building..." />;
  if (error) return <ErrorState message={error} onRetry={fetchBuilding} />;
  if (!building) return <ErrorState message="Building not found" onRetry={fetchBuilding} />;

  return (
    <div className="animate-fade-in pb-12 space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
        <Link href="/organization" className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Organization
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">
                {building.name}
              </h1>
              <Badge variant="outline">{building.code}</Badge>
            </div>
            <p className="text-sm text-gray-500">
              {building.description?.trim() ? building.description : "No building description provided."}
            </p>
          </div>
          <Button variant="outline" leftIcon={<MapPin className="h-4 w-4" />} onClick={() => void fetchBuilding()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DoorClosed className="w-5 h-5 text-gray-400" />
            Rooms in this building
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {building.rooms.length} {building.rooms.length === 1 ? "room" : "rooms"}
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddRoomModalOpen(true)}
            >
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {building.rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No rooms registered under this building yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Room Name</th>
                  <th className="px-6 py-3">Room Number</th>
                  <th className="px-6 py-3">Floor</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Active Assignments</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {building.rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{room.name}</td>
                    <td className="px-6 py-4 text-gray-600">{room.roomNumber ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{room.floor ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{ROOM_TYPE_LABELS[room.type] ?? room.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{room._count.assignments}</td>
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
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        title="Add Room"
        description="Register a room under this building."
        size="md"
      >
        <RoomForm
          buildings={[{ id: building.id, name: building.name, code: building.code }]}
          fixedBuildingId={building.id}
          onSuccess={() => {
            setIsAddRoomModalOpen(false);
            void fetchBuilding();
          }}
          onCancel={() => setIsAddRoomModalOpen(false)}
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
          buildings={[{ id: building.id, name: building.name, code: building.code }]}
          fixedBuildingId={building.id}
          initialData={
            selectedRoom
              ? {
                  name: selectedRoom.name,
                  roomNumber: selectedRoom.roomNumber ?? "",
                  floor: selectedRoom.floor ?? "",
                  buildingId: building.id,
                  type: selectedRoom.type,
                }
              : undefined
          }
          onSuccess={() => {
            setIsEditRoomModalOpen(false);
            void fetchBuilding();
          }}
          onCancel={() => setIsEditRoomModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

