/**
 * @file room-form.tsx
 * @description Registers a new room under an existing building (React Hook Form + Zod).
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROOM_TYPE_LABELS } from "@/lib/constants";
import { roomSchema, type RoomFormValues } from "@/lib/validations/organization.schema";

interface BuildingOption {
  id: string;
  name: string;
  code: string;
}

interface RoomFormProps {
  buildings: BuildingOption[];
  onSuccess: () => void;
  onCancel: () => void;
  roomId?: string;
  initialData?: RoomFormValues;
  fixedBuildingId?: string;
}

const ROOM_TYPE_OPTIONS = (Object.keys(RoomType) as RoomType[]).map((value) => ({
  value,
  label: ROOM_TYPE_LABELS[value] ?? value,
}));

export const RoomForm = ({
  buildings,
  onSuccess,
  onCancel,
  roomId,
  initialData,
  fixedBuildingId,
}: RoomFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(roomId);
  const isFixedBuildingMode = Boolean(fixedBuildingId);
  const fixedBuilding = buildings.find((building) => building.id === fixedBuildingId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      roomNumber: initialData?.roomNumber ?? "",
      floor: initialData?.floor ?? "",
      buildingId: fixedBuildingId ?? initialData?.buildingId ?? "",
      type: initialData?.type ?? RoomType.OFFICE,
    },
  });

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const onSubmit = async (data: RoomFormValues) => {
    const payload = {
      name: data.name.trim(),
      buildingId: fixedBuildingId ?? data.buildingId,
      type: data.type,
      roomNumber: data.roomNumber?.trim() ? data.roomNumber.trim() : undefined,
      floor: data.floor?.trim() ? data.floor.trim() : undefined,
    };

    try {
      const endpoint = isEditMode ? `/api/rooms/${roomId}` : "/api/rooms";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save room");
      }

      addToast({
        title: isEditMode ? "Room updated" : "Room registered",
        message: isEditMode ? `${json.data.name} has been updated.` : `${json.data.name} has been added.`,
        variant: "success",
      });
      reset({
        name: "",
        roomNumber: "",
        floor: "",
        buildingId: fixedBuildingId ?? "",
        type: RoomType.OFFICE,
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      addToast({ title: isEditMode ? "Update failed" : "Registration failed", message, variant: "error" });
    }
  };

  if (buildings.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Add a building first, then you can register rooms under it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        {isFixedBuildingMode ? (
          <Input
            label="Building"
            value={fixedBuilding ? `${fixedBuilding.name} (${fixedBuilding.code})` : "Selected building"}
            readOnly
          />
        ) : (
          <Select
            label="Building"
            placeholder="Select building"
            options={buildingOptions}
            {...register("buildingId")}
            error={errors.buildingId?.message}
          />
        )}
        <Input label="Room name" placeholder="e.g. IT Office" {...register("name")} error={errors.name?.message} required />
        <Input label="Room number (optional)" {...register("roomNumber")} error={errors.roomNumber?.message} />
        <Input label="Floor (optional)" placeholder="e.g. 2 or Ground" {...register("floor")} error={errors.floor?.message} />
        <Select
          label="Room type"
          options={ROOM_TYPE_OPTIONS}
          {...register("type")}
          error={errors.type?.message}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save changes" : "Register room"}
        </Button>
      </div>
    </form>
  );
};
