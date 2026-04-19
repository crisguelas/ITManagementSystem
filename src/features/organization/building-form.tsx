/**
 * @file building-form.tsx
 * @description Creates a new building via React Hook Form and Zod validation.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { buildingSchema, type BuildingFormValues } from "@/lib/validations/organization.schema";

interface BuildingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  buildingId?: string;
  initialData?: BuildingFormValues;
}

export const BuildingForm = ({ onSuccess, onCancel, buildingId, initialData }: BuildingFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(buildingId);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      description: initialData?.description ?? "",
    }
  });

  const onSubmit = async (data: BuildingFormValues) => {
    try {
      const endpoint = isEditMode ? `/api/buildings/${buildingId}` : "/api/buildings";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save building");

      addToast({
        title: isEditMode ? "Building Updated" : "Building Created",
        message: isEditMode
          ? `${json.data.name} has been updated.`
          : `${json.data.name} has been added.`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: unknown) {
      addToast({
        title: isEditMode ? "Update Failed" : "Registration Failed",
        message: err instanceof Error ? err.message : "Failed to save building",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Input label="Building Name" placeholder="e.g. Science Block" {...register("name")} error={errors.name?.message} required />
        <Input label="Short Code" placeholder="e.g. SB" {...register("code")} error={errors.code?.message} required />
        <Input label="Description (Optional)" placeholder="Main hub for science equipment" {...register("description")} error={errors.description?.message} />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save Changes" : "Add Building"}
        </Button>
      </div>
    </form>
  );
};
