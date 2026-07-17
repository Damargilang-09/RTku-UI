"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api/auth";
import { useAuthStore } from "@/src/lib/auth-store";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.data);

      if (res.data.role === "warga") {
        router.replace("/beranda");
        return;
      }

      if (res.data.role === "superAdmin") {
        router.replace("/kelola-ketua-rt");
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal masuk, silakan coba lagi",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-30 w-30 items-center justify-center rounded-full bg-primary text-white">
            <img className="w-fit" src="/images/screen.png" alt="Logo RTku" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Masuk ke RTku
          </h1>
          <p className="text-sm text-text-secondary">
            Kelola iuran dan keuangan RT dengan mudah dan transparan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            type="password"
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Masuk
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
