/**
 * @file department-form.tsx
 * @description Creates a new department via React Hook Form and Zod validation.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { departmentSchema, type DepartmentFormValues } from "@/lib/validations/organization.schema";

interface DepartmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  departmentId?: string;
  initialData?: DepartmentFormValues;
}

export const DepartmentForm = ({ onSuccess, onCancel, departmentId, initialData }: DepartmentFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(departmentId);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
    }
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    try {
      const endpoint = isEditMode ? `/api/departments/${departmentId}` : "/api/departments";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save department");

      addToast({
        title: isEditMode ? "Department Updated" : "Department Created",
        message: isEditMode
          ? `${json.data.name} has been updated.`
          : `${json.data.name} has been set up.`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: unknown) {
      addToast({
        title: isEditMode ? "Update Failed" : "Registration Failed",
        message: err instanceof Error ? err.message : "Failed to save department",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Input label="Department Name" placeholder="e.g. IT Department" {...register("name")} error={errors.name?.message} required />
        <Input label="Short Code" placeholder="e.g. IT" {...register("code")} error={errors.code?.message} required />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save Changes" : "Add Department"}
        </Button>
      </div>
    </form>
  );
};
