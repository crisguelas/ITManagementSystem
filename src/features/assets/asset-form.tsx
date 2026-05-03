/**
 * @file asset-form.tsx
 * @description Form component for creating and editing IT assets.
 * Utilizes React Hook Form and Zod for validation.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StockCategory, StockItem } from "@prisma/client";

/* Base Components */
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-state";

import { assetSchema } from "@/lib/validations/asset.schema";
import {
  CUSTOM_SPEC_OPTION_VALUE,
  OPERATING_SYSTEM_OPTIONS,
  RAM_OPTIONS,
  STORAGE_OPTIONS,
} from "@/lib/constants";
import type { z } from "zod";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Stock list payload as returned by GET /api/stock-items (includes relations + count) */
type StockListItem = StockItem & {
  category: StockCategory;
  _count: { transactions: number };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

interface AssetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  assetId?: string;
  initialData?: z.input<typeof assetSchema>;
}

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * AssetForm — Handles asset create/edit flows with optional stock-to-asset sourcing.
 * Validates identifiers/specs and normalizes optional fields before API submission.
 */
export const AssetForm = ({ onSuccess, onCancel, assetId, initialData }: AssetFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(assetId);
  
  /* State for external data (categories) */
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  /* State for optional stock-sourced registration (only used in create mode) */
  const [stockItems, setStockItems] = useState<StockListItem[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [sourceStockItemId, setSourceStockItemId] = useState("");

  /* Setup react-hook-form */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm<z.input<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      stockCategoryId: "",
      brand: "",
      model: "",
      pcNumber: "",
      macAddress: "",
      serialNumber: "",
      ipAddress: "",
      osInstalled: "",
      ram: "",
      storage: "",
      status: "AVAILABLE",
    },
  });

  const selectedOs = useWatch({ control, name: "osInstalled" }) ?? "";
  const selectedRam = useWatch({ control, name: "ram" }) ?? "";
  const selectedStorage = useWatch({ control, name: "storage" }) ?? "";

  const [isCustomOs, setIsCustomOs] = useState(false);
  const [isCustomRam, setIsCustomRam] = useState(false);
  const [isCustomStorage, setIsCustomStorage] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    const nextOs = initialData.osInstalled ?? "";
    const nextRam = initialData.ram ?? "";
    const nextStorage = initialData.storage ?? "";

    reset({
      stockCategoryId: initialData.stockCategoryId ?? "",
      brand: initialData.brand ?? "",
      model: initialData.model ?? "",
      pcNumber: initialData.pcNumber ?? "",
      macAddress: initialData.macAddress ?? "",
      serialNumber: initialData.serialNumber ?? "",
      ipAddress: initialData.ipAddress ?? "",
      osInstalled: nextOs,
      ram: nextRam,
      storage: nextStorage,
      status: initialData.status ?? "AVAILABLE",
    });

    const timerId = window.setTimeout(() => {
      setIsCustomOs(Boolean(nextOs) && !(OPERATING_SYSTEM_OPTIONS as readonly string[]).includes(nextOs));
      setIsCustomRam(Boolean(nextRam) && !(RAM_OPTIONS as readonly string[]).includes(nextRam));
      setIsCustomStorage(Boolean(nextStorage) && !(STORAGE_OPTIONS as readonly string[]).includes(nextStorage));
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [initialData, reset]);

  /* Fetch categories on mount */
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    setCategoryError(null);
    try {
      const res = await fetch("/api/stock-categories");
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

  const fetchAvailableStock = useCallback(async () => {
    if (isEditMode) return;
    setIsLoadingStock(true);
    setStockError(null);
    try {
      const res = await fetch("/api/stock-items");
      const json = (await res.json()) as { success: boolean; data?: StockListItem[]; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load stock items");
      setStockItems(json.data ?? []);
    } catch (err: unknown) {
      setStockError(err instanceof Error ? err.message : "Failed to load stock items");
    } finally {
      setIsLoadingStock(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    const t = window.setTimeout(() => {
      void fetchAvailableStock();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchAvailableStock, isEditMode]);

  const normalizeOptionalText = (value: unknown) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  const readJsonError = (json: unknown): string | undefined => {
    if (!json || typeof json !== "object") return undefined;
    if (!("error" in json)) return undefined;
    const err = (json as { error: unknown }).error;
    if (typeof err === "string") return err;
    return undefined;
  };

  const availableStockOptions = useMemo(() => {
    return stockItems
      .filter((row) => row.quantity > 0)
      .slice()
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
  }, [stockItems]);

  const selectedSourceStock = useMemo(() => {
    if (!sourceStockItemId) return null;
    return stockItems.find((row) => row.id === sourceStockItemId) ?? null;
  }, [sourceStockItemId, stockItems]);

  useEffect(() => {
    if (!selectedSourceStock) return;
    /* Auto-populate unified asset fields from the selected inventory source. */
    setValue("stockCategoryId", selectedSourceStock.categoryId);
    setValue("brand", selectedSourceStock.brand);
    setValue("model", selectedSourceStock.model);
  }, [selectedSourceStock, setValue]);

  /* Form submission handler */
  const onSubmit = async (data: z.input<typeof assetSchema>) => {
    try {
      if (!isEditMode && sourceStockItemId) {
        const selected = stockItems.find((row) => row.id === sourceStockItemId);
        if (!selected) throw new Error("Selected stock item is no longer available. Refresh and try again.");
        if (selected.quantity < 1) throw new Error("Cannot register from this stock line — quantity is 0.");

        const normalizedBody = {
          ...data,
          pcNumber: normalizeOptionalText(data.pcNumber),
          serialNumber: normalizeOptionalText(data.serialNumber),
          macAddress: normalizeOptionalText(data.macAddress),
          ipAddress: normalizeOptionalText(data.ipAddress),
          brand: typeof data.brand === "string" ? data.brand.trim() : data.brand,
          model: typeof data.model === "string" ? data.model.trim() : data.model,
          osInstalled: normalizeOptionalText(data.osInstalled),
          ram: normalizeOptionalText(data.ram),
          storage: normalizeOptionalText(data.storage),
          notes: `Registered asset from stock SKU ${selected.sku ?? "N/A"} (${selected.brand} ${selected.model})`,
        };

        const res = await fetch(`/api/stock-items/${sourceStockItemId}/convert-to-asset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedBody),
        });

        const json: unknown = await res.json();
        if (!res.ok || !isRecord(json) || json.success !== true) {
          throw new Error(
            readJsonError(json) || "Failed to create asset from stock"
          );
        }

        const createdTag =
          isRecord(json.data) && typeof json.data.assetTag === "string" ? json.data.assetTag : "Asset";

        addToast({
          title: "Asset Created",
          message: `${createdTag} registered and stock decremented by 1`,
          variant: "success",
        });

        setSourceStockItemId("");
        reset();
        setIsCustomOs(false);
        setIsCustomRam(false);
        setIsCustomStorage(false);
        onSuccess();
        return;
      }

      const endpoint = isEditMode ? `/api/assets/${assetId}` : "/api/assets";
      const method = isEditMode ? "PATCH" : "POST";

      const directBody = isEditMode
        ? data
        : {
            ...data,
            pcNumber: normalizeOptionalText(data.pcNumber),
            serialNumber: normalizeOptionalText(data.serialNumber),
            macAddress: normalizeOptionalText(data.macAddress),
            ipAddress: normalizeOptionalText(data.ipAddress),
            brand: typeof data.brand === "string" ? data.brand.trim() : data.brand,
            model: typeof data.model === "string" ? data.model.trim() : data.model,
            osInstalled: normalizeOptionalText(data.osInstalled),
            ram: normalizeOptionalText(data.ram),
            storage: normalizeOptionalText(data.storage),
          };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directBody),
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
      setIsCustomOs(false);
      setIsCustomRam(false);
      setIsCustomStorage(false);
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

  const operatingSystemSelectOptions = [
    ...OPERATING_SYSTEM_OPTIONS.map((value) => ({ label: value, value })),
    { label: "Other", value: CUSTOM_SPEC_OPTION_VALUE },
  ];
  const ramSelectOptions = [
    ...RAM_OPTIONS.map((value) => ({ label: value, value })),
    { label: "Other", value: CUSTOM_SPEC_OPTION_VALUE },
  ];
  const storageSelectOptions = [
    ...STORAGE_OPTIONS.map((value) => ({ label: value, value })),
    { label: "Other", value: CUSTOM_SPEC_OPTION_VALUE },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      {!isEditMode && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">Inventory Source (Optional)</h3>
          {stockError ? (
            <ErrorState message={stockError} onRetry={fetchAvailableStock} />
          ) : (
            <div className="space-y-2">
              <Select
                label="Pull from available stock"
                options={[
                  ...availableStockOptions.map((row) => ({
                    label: `${row.brand} ${row.model} • ${row.sku ?? "No SKU"} • ${row.quantity} ${row.unit} left`,
                    value: row.id,
                  })),
                ]}
                value={sourceStockItemId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSourceStockItemId(next);
                }}
                disabled={isLoadingStock}
                required={false}
              />
              <div className="text-xs text-gray-500">
                Leave this blank to register an asset without consuming inventory.
              </div>
              {isLoadingStock && (
                <div className="text-xs text-gray-500">Loading available stock items…</div>
              )}
              {selectedSourceStock && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <div className="font-medium text-gray-900">
                    {selectedSourceStock.brand} {selectedSourceStock.model}
                  </div>
                  <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <span>
                      <span className="text-gray-500">SKU:</span> {selectedSourceStock.sku ?? "—"}
                    </span>
                    <span>
                      <span className="text-gray-500">Category:</span> {selectedSourceStock.category.name}
                    </span>
                    <span>
                      <span className="text-gray-500">Available:</span> {selectedSourceStock.quantity}{" "}
                      {selectedSourceStock.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Basic Setup */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            {...register("stockCategoryId")}
            error={errors.stockCategoryId?.message}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Input
            label="IP Address"
            placeholder="e.g. 192.168.1.10"
            {...register("ipAddress")}
            error={errors.ipAddress?.message}
          />
        </div>
      </div>

      {/* PC / System Specs (Optional) */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-primary-600 border-b border-primary-100 pb-2">System Specs (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Select
              label="Operating System"
              options={operatingSystemSelectOptions}
              value={
                isCustomOs
                  ? CUSTOM_SPEC_OPTION_VALUE
                  : selectedOs
              }
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_SPEC_OPTION_VALUE) {
                  setIsCustomOs(true);
                  setValue("osInstalled", "", { shouldValidate: true, shouldDirty: true });
                  return;
                }
                setIsCustomOs(false);
                setValue("osInstalled", nextValue, { shouldValidate: true, shouldDirty: true });
              }}
              placeholder="Select an operating system"
              error={errors.osInstalled?.message}
              required={false}
            />
            {isCustomOs && (
              <Input
                label="Custom Operating System"
                placeholder="Enter operating system"
                value={selectedOs}
                onChange={(event) =>
                  setValue("osInstalled", event.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.osInstalled?.message}
              />
            )}
          </div>
          <div className="space-y-2">
            <Select
              label="RAM"
              options={ramSelectOptions}
              value={isCustomRam ? CUSTOM_SPEC_OPTION_VALUE : selectedRam}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_SPEC_OPTION_VALUE) {
                  setIsCustomRam(true);
                  setValue("ram", "", { shouldValidate: true, shouldDirty: true });
                  return;
                }
                setIsCustomRam(false);
                setValue("ram", nextValue, { shouldValidate: true, shouldDirty: true });
              }}
              placeholder="Select RAM"
              error={errors.ram?.message}
              required={false}
            />
            {isCustomRam && (
              <Input
                label="Custom RAM"
                placeholder="Enter RAM specification"
                value={selectedRam}
                onChange={(event) =>
                  setValue("ram", event.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.ram?.message}
              />
            )}
          </div>
          <div className="space-y-2">
            <Select
              label="Storage"
              options={storageSelectOptions}
              value={isCustomStorage ? CUSTOM_SPEC_OPTION_VALUE : selectedStorage}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === CUSTOM_SPEC_OPTION_VALUE) {
                  setIsCustomStorage(true);
                  setValue("storage", "", { shouldValidate: true, shouldDirty: true });
                  return;
                }
                setIsCustomStorage(false);
                setValue("storage", nextValue, { shouldValidate: true, shouldDirty: true });
              }}
              placeholder="Select storage"
              error={errors.storage?.message}
              required={false}
            />
            {isCustomStorage && (
              <Input
                label="Custom Storage"
                placeholder="Enter storage specification"
                value={selectedStorage}
                onChange={(event) =>
                  setValue("storage", event.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.storage?.message}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode
            ? "Save Changes"
            : sourceStockItemId
              ? "Register Asset (consume 1 from stock)"
              : "Register Asset"}
        </Button>
      </div>

    </form>
  );
};
