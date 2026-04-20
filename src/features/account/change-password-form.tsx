/**
 * @file change-password-form.tsx
 * @description Form for the current user to change their own account password.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/user.schema";

export const ChangePasswordForm = () => {
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  /* Submit password change request for the authenticated user */
  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to update password");
      }

      addToast({
        title: "Password updated",
        message: "Your account password has been changed successfully.",
        variant: "success",
      });
      reset();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      addToast({
        title: "Password update failed",
        message,
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 shadow-sm">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
          error={errors.newPassword?.message}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          required
        />
      </div>

      <div className="flex items-center justify-end">
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Update password
        </Button>
      </div>
    </form>
  );
};
