"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api/auth";
import { useAuthStore } from "@/src/lib/auth-store";
import { ApiError } from "@/src/lib/api/axios";
import { loginSchema, type LoginFormValues } from "@/src/validations";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { detectDeviceType } from "@/src/lib/devices";
import Image from "next/image";
import logo from "@/public/images/RTkuLogo.png";
import { User } from "@/src/types";

function resolveRedirectPath(
  user: User,
  deviceType: "mobile" | "desktop",
): string {
  if (user.role === "superAdmin") return "/kelola-ketua-rt";
  if (user.role === "warga") return "/beranda";

  const isStaff = user.role === "bendahara" || user.role === "ketuaRT";
  if (isStaff && deviceType === "mobile") return "/beranda";

  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      const res = await authApi.login(values);
      setUser(res.data);

      const deviceType = detectDeviceType();

      // Cookie ini murni penanda device untuk dibaca middleware,
      // terpisah dari cookie "token" yang di-set backend.
      document.cookie = `device_type=${deviceType}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;

      router.replace(resolveRedirectPath(res.data, deviceType));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal masuk, silakan coba lagi",
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-full text-white">
            <Image src={logo} alt="logortku" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary">
            Masuk ke RTku
          </h1>

          <p className="text-sm text-text-secondary">
            Kelola iuran dan keuangan RT dengan mudah dan transparan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-card-lg border border-border bg-surface p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]"
        >
          {error && (
            <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="nama@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            type="password"
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
            className="mt-2"
          >
            Masuk

            {isSubmitting && (
              // Sengaja pakai spinner manual (bukan Button.loading) karena
              // material-symbols-outlined kadang belum ke-load saat halaman
              // login pertama kali diakses, sehingga teks "progress_activity"
              // sempat terlihat sebelum jadi ikon.
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}