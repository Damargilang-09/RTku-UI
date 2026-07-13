"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api/auth";
import { ApiError } from "next/dist/server/api-utils";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    houseNumber: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mendaftar, silakan coba lagi");
    } finally {
      setLoading(false);
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Akun Warga</h1>
          <p className="text-sm text-text-secondary">Satu langkah menuju administrasi RT yang lebih mudah.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card-lg border border-border bg-surface p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
          {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

          <Input id="name" label="Nama Lengkap" placeholder="Nama sesuai KTP" value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={5} />
          <Input id="email" type="email" label="Email" placeholder="nama@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <Input id="password" type="password" label="Kata Sandi" placeholder="Minimal 8 karakter" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
          <Input id="houseNumber" label="Nomor Blok Rumah" placeholder="Contoh: A-12" value={form.houseNumber} onChange={(e) => update("houseNumber", e.target.value)} required />
          <Input id="address" label="Alamat" placeholder="Alamat lengkap" value={form.address} onChange={(e) => update("address", e.target.value)} required />

          <Button type="submit" fullWidth loading={loading} className="mt-2">
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
