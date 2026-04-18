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
}

export const BuildingForm = ({ onSuccess, onCancel }: BuildingFormProps) => {
  const { addToast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { name: "", code: "", description: "" }
  });

  const onSubmit = async (data: BuildingFormValues) => {
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to add building");

      addToast({
        title: "Building Created",
        message: `${json.data.name} has been added.`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: any) {
      addToast({ title: "Registration Failed", message: err.message, variant: "error" });
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
        <Button type="submit" variant="primary" isLoading={isSubmitting}>Add Building</Button>
      </div>
    </form>
  );
};
