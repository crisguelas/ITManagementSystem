/**
 * @file asset-form.tsx
 * @description Form component for creating and editing IT assets.
 * Utilizes React Hook Form and Zod for validation.
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AssetCategory } from "@prisma/client";

/* Base Components */
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";

import { assetSchema } from "@/lib/validations/asset.schema";
import type { z } from "zod";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

interface AssetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  assetId?: string;
  initialData?: z.input<typeof assetSchema>;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

export const AssetForm = ({ onSuccess, onCancel, assetId, initialData }: AssetFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(assetId);
  
  /* State for external data (categories) */
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  /* Setup react-hook-form */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.input<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      categoryId: "",
      brand: "",
      model: "",
      pcNumber: "",
      macAddress: "",
      serialNumber: "",
      osInstalled: "",
      ram: "",
      storage: "",
      status: "AVAILABLE",
    },
  });

  useEffect(() => {
    if (!initialData) return;
    reset({
      categoryId: initialData.categoryId ?? "",
      brand: initialData.brand ?? "",
      model: initialData.model ?? "",
      pcNumber: initialData.pcNumber ?? "",
      macAddress: initialData.macAddress ?? "",
      serialNumber: initialData.serialNumber ?? "",
      osInstalled: initialData.osInstalled ?? "",
      ram: initialData.ram ?? "",
      storage: initialData.storage ?? "",
      status: initialData.status ?? "AVAILABLE",
    });
  }, [initialData, reset]);

  /* Fetch categories on mount */
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    setCategoryError(null);
    try {
      const res = await fetch("/api/assets/categories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load categories");
      setCategories(json.data);
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    /* Defer fetch to avoid sync setState in effect body */
    const t = window.setTimeout(() => {
      void fetchCategories();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* Form submission handler */
  const onSubmit = async (data: z.input<typeof assetSchema>) => {
    try {
      const endpoint = isEditMode ? `/api/assets/${assetId}` : "/api/assets";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || (isEditMode ? "Failed to update asset" : "Failed to create asset"));
      }

      addToast({
        title: isEditMode ? "Asset Updated" : "Asset Created",
        message: isEditMode
          ? `${json.data.assetTag} successfully updated`
          : `${json.data.assetTag} successfully registered`,
        variant: "success",
      });

      reset();
      onSuccess();
    } catch (err: unknown) {
      addToast({
        title: isEditMode ? "Update Failed" : "Registration Failed",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "error",
      });
    }
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /* RENDER                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if (isLoadingCategories) return <LoadingSpinner message="Loading categories..." />;
  if (categoryError) return <ErrorState message={categoryError} onRetry={fetchCategories} />;

  /* Convert categories to select options */
  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const statusOptions = [
    { label: "Available", value: "AVAILABLE" },
    { label: "Deployed", value: "DEPLOYED" },
    { label: "Maintenance", value: "MAINTENANCE" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      
      {/* Basic Setup */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            {...register("categoryId")}
            error={errors.categoryId?.message}
            required
          />
          <Select
            label="Status"
            options={statusOptions}
            {...register("status")}
            error={errors.status?.message}
            required
          />
        </div>
      </div>

      {/* Hardware Identifiers */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">Hardware</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Brand" 
            placeholder="e.g. Dell, HP, Apple" 
            {...register("brand")} 
            error={errors.brand?.message}
            required 
          />
          <Input 
            label="Model" 
            placeholder="e.g. Latitude 5530" 
            {...register("model")} 
            error={errors.model?.message}
            required 
          />
        </div>
      </div>

      {/* Tracking Identifiers */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">Identifiers (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input 
            label="PC Number" 
            placeholder="e.g. C000001" 
            {...register("pcNumber")} 
            error={errors.pcNumber?.message} 
          />
          <Input 
            label="Serial Number" 
            placeholder="S/N" 
            {...register("serialNumber")} 
            error={errors.serialNumber?.message} 
          />
          <Input 
            label="MAC Address" 
            placeholder="00:1B:44:11:3A:B7" 
            {...register("macAddress")} 
            error={errors.macAddress?.message} 
          />
        </div>
      </div>

      {/* PC / System Specs (Optional) */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">System Specs (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input 
            label="Operating System" 
            placeholder="e.g. Windows 11 Pro" 
            {...register("osInstalled")} 
            error={errors.osInstalled?.message} 
          />
          <Input 
            label="RAM" 
            placeholder="e.g. 16GB DDR4" 
            {...register("ram")} 
            error={errors.ram?.message} 
          />
          <Input 
            label="Storage" 
            placeholder="e.g. 512GB NVMe" 
            {...register("storage")} 
            error={errors.storage?.message} 
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save Changes" : "Register Asset"}
        </Button>
      </div>

    </form>
  );
};
