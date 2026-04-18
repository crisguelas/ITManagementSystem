/**
 * @file user-form.tsx
 * @description Creates a new IT staff login user (admin only).
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/user.schema";

interface UserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserForm = ({ onSuccess, onCancel }: UserFormProps) => {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "MEMBER",
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create user");
      }

      addToast({
        title: "User created",
        message: `${json.data.email} can sign in with the password you set.`,
        variant: "success",
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      addToast({ title: "Could not create user", message, variant: "error" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          {...register("email")}
          error={errors.email?.message}
          required
        />
        <Input label="Display name" {...register("name")} error={errors.name?.message} required />
        <Input
          label="Initial password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
          <select
            {...register("role")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Administrator</option>
          </select>
          {errors.role?.message && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Add user
        </Button>
      </div>
    </form>
  );
};
