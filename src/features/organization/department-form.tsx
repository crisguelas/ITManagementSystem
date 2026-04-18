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
}

export const DepartmentForm = ({ onSuccess, onCancel }: DepartmentFormProps) => {
  const { addToast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", code: "" }
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to add department");

      addToast({
        title: "Department Created",
        message: `${json.data.name} has been set up.`,
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
        <Input label="Department Name" placeholder="e.g. IT Department" {...register("name")} error={errors.name?.message} required />
        <Input label="Short Code" placeholder="e.g. IT" {...register("code")} error={errors.code?.message} required />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>Add Department</Button>
      </div>
    </form>
  );
};
