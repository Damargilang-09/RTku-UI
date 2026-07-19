"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/src/lib/api/auth";
import { ApiError } from "@/src/lib/api/axios";
import { registerSchema, type RegisterFormValues } from "@/src/validations";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import Image from "next/image";
import logo from "@/public/images/RTkuLogo.png";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    try {
      await authApi.register(values);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mendaftar, silakan coba lagi");
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-6 py-12">
        <div className="w-full max-w-sm rounded-card-lg border border-border bg-surface p-6 text-center shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">Pendaftaran berhasil</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Akun kamu sedang menunggu aktivasi dari pengurus RT. Cek email kamu untuk info lebih lanjut.
          </p>
          <Button fullWidth className="mt-6" onClick={() => router.push("/login")}>
            Kembali ke halaman masuk
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
           <div className="flex h-40 w-40 items-center justify-center rounded-full text-white">
            <Image src={logo} alt="logortku" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Akun Warga</h1>
          <p className="text-sm text-text-secondary">Satu langkah menuju administrasi RT yang lebih mudah.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card-lg border border-border bg-surface p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
          {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

          <Input id="name" label="Nama Lengkap" placeholder="Nama sesuai KTP" error={errors.name?.message} {...register("name")} />
          <Input id="email" type="email" label="Email" placeholder="nama@email.com" error={errors.email?.message} {...register("email")} />
          <Input id="password" type="password" label="Kata Sandi" placeholder="Minimal 8 karakter" error={errors.password?.message} {...register("password")} />
          <Input id="houseNumber" label="Nomor Blok Rumah" placeholder="Contoh: A-12" error={errors.houseNumber?.message} {...register("houseNumber")} />
          <Input id="address" label="Alamat" placeholder="Alamat lengkap" error={errors.address?.message} {...register("address")} />

          <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
            Daftar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}