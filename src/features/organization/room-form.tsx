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
}

const ROOM_TYPE_OPTIONS = (Object.keys(RoomType) as RoomType[]).map((value) => ({
  value,
  label: ROOM_TYPE_LABELS[value] ?? value,
}));

export const RoomForm = ({ buildings, onSuccess, onCancel }: RoomFormProps) => {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      roomNumber: "",
      floor: "",
      buildingId: "",
      type: RoomType.OFFICE,
    },
  });

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const onSubmit = async (data: RoomFormValues) => {
    const payload = {
      name: data.name.trim(),
      buildingId: data.buildingId,
      type: data.type,
      roomNumber: data.roomNumber?.trim() ? data.roomNumber.trim() : undefined,
      floor: data.floor?.trim() ? data.floor.trim() : undefined,
    };

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add room");
      }

      addToast({
        title: "Room registered",
        message: `${json.data.name} has been added.`,
        variant: "success",
      });
      reset({ name: "", roomNumber: "", floor: "", buildingId: "", type: RoomType.OFFICE });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      addToast({ title: "Registration failed", message, variant: "error" });
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
        <Select
          label="Building"
          placeholder="Select building"
          options={buildingOptions}
          {...register("buildingId")}
          error={errors.buildingId?.message}
        />
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
          Register room
        </Button>
      </div>
    </form>
  );
};
