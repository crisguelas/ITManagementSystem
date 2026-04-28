/**
 * @file page.tsx
 * @description Login page with credentials form.
 * Handles authentication client-side with NextAuth.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, AlertCircle } from "lucide-react";

/* Local imports */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

/* ═══════════════════════════════════════════════════════════════ */
/* VALIDATION SCHEMA                                               */
/* ═══════════════════════════════════════════════════════════════ */

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* Form setup with Zod validation */
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /* Form submission handler */
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      /* NextAuth credentials sign-in provider */
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        /* Successful login — redirect to dashboard */
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-24 w-[280px] max-w-full items-center justify-center overflow-hidden rounded-xl bg-white/40 p-2 shadow-lg">
          {/* Wider branding container keeps the full horizontal logo text readable */}
          <Image
            src="/Inaya-logo.png"
            alt="Inaya Medical Colleges logo"
            width={280}
            height={96}
            className="h-full w-full object-contain object-bottom"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Managed by the IT Department
        </p>
      </div>

      <Card className="shadow-xl shadow-primary-900/5">
        <CardHeader className="text-center border-b-0 pb-2 pt-8">
          <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your credentials to access the system
          </p>
        </CardHeader>

        <CardBody className="pt-4 pb-8 px-8">
          {/* Global Error Banner */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
              autoComplete="email"
            />

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register("password")}
              autoComplete="current-password"
            />

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
