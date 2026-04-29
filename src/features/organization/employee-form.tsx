/**
 * @file employee-form.tsx
 * @description Registers an organization employee (React Hook Form + Zod); posts to `POST /api/employees`.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Title } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TITLE_LABELS } from "@/lib/constants";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validations/organization.schema";

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface EmployeeFormProps {
  departments: DepartmentOption[];
  onSuccess: () => void;
  onCancel: () => void;
  employeeId?: string;
  initialData?: EmployeeFormValues;
}

const TITLE_OPTIONS = (Object.keys(Title) as Title[]).map((value) => ({
  value,
  label: TITLE_LABELS[value] ?? value,
}));

export const EmployeeForm = ({
  departments,
  onSuccess,
  onCancel,
  employeeId,
  initialData,
}: EmployeeFormProps) => {
  const { addToast } = useToast();
  const isEditMode = Boolean(employeeId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: initialData?.employeeId ?? "",
      title: initialData?.title ?? Title.MR,
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      phoneExt: initialData?.phoneExt ?? "",
      departmentId: initialData?.departmentId ?? "",
      position: initialData?.position ?? "",
    },
  });

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const onSubmit = async (data: EmployeeFormValues) => {
    const body: Record<string, unknown> = {
      employeeId: data.employeeId.trim(),
      title: data.title,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      departmentId: data.departmentId,
    };
    const email = data.email?.trim();
    if (email) {
      body.email = email;
    }
    const phone = data.phone?.trim();
    if (phone) {
      body.phone = phone;
    }
    const phoneExt = data.phoneExt?.trim();
    if (phoneExt) {
      body.phoneExt = phoneExt;
    }
    const position = data.position?.trim();
    if (position) {
      body.position = position;
    }

    try {
      const endpoint = isEditMode ? `/api/employees/${employeeId}` : "/api/employees";
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save employee");
      }

      addToast({
        title: isEditMode ? "Employee updated" : "Employee registered",
        message: isEditMode
          ? `${json.data.firstName} ${json.data.lastName} has been updated.`
          : `${json.data.firstName} ${json.data.lastName} has been added.`,
        variant: "success",
      });
      reset({
        employeeId: "",
        title: Title.MR,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        phoneExt: "",
        departmentId: "",
        position: "",
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      addToast({
        title: isEditMode ? "Update failed" : "Registration failed",
        message,
        variant: "error",
      });
    }
  };

  if (departments.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Add a unit first, then you can register employees under it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Select
          label="Title"
          options={TITLE_OPTIONS}
          {...register("title")}
          error={errors.title?.message}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Employee ID" {...register("employeeId")} error={errors.employeeId?.message} required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" {...register("firstName")} error={errors.firstName?.message} required />
          <Input label="Last name" {...register("lastName")} error={errors.lastName?.message} required />
        </div>
        <Select
          label="Unit"
          placeholder="Select unit"
          options={departmentOptions}
          {...register("departmentId")}
          error={errors.departmentId?.message}
        />
        <Input
          label="Email (optional)"
          type="email"
          autoComplete="off"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input label="Mobile (Optional)" {...register("phone")} error={errors.phone?.message} />
        <Input label="Phone Ext. (Optional)" {...register("phoneExt")} error={errors.phoneExt?.message} />
        <Input label="Position / title (optional)" placeholder="e.g. Lecturer" {...register("position")} error={errors.position?.message} />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditMode ? "Save Changes" : "Add employee"}
        </Button>
      </div>
    </form>
  );
};
