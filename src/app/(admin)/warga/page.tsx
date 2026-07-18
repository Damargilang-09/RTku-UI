"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi } from "@/src/lib/api/users";
import { ApiError } from "@/src/lib/api/axios";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ROLE_LABEL } from "@/src/lib/utils";
import type { User } from "@/src/types";

export default function KelolaWargaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    usersApi
      .getAll({ limit: 10, search: search || undefined })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  async function toggleStatus(user: User) {
    setBusyId(user.id);
    setError(null);
    try {
      await usersApi.update(user?.id, { status: user.status === "active" ? "inactive" : "active" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui status warga");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleRole(user: User) {
    setBusyId(user?.id);
    setError(null);
    try {
      await usersApi.update(user.id, { role: user.role === "bendahara" ? "warga" : "bendahara" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui peran warga");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Hapus akun ${user.name}? Histori transaksi user tetap tersimpan.`,
    );

    if (!confirmed) return;

    setBusyId(user.id);
    setError(null);

    try {
      await usersApi.delete(user.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus warga");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Kelola Warga</h1>
        <p className="text-sm text-text-secondary">Aktivasi akun dan kelola peran warga di lingkungan RT.</p>
      </div>

      <Input
        placeholder="Cari nama atau email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : users?.length === 0 ? (
        <EmptyState icon="group" title="Tidak ada warga ditemukan" />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {users.map((user, idx) => (
            <div
              key={user.id}
              className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${idx !== users.length - 1 ? "border-b border-surface-tertiary" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                  <p className="text-xs text-text-secondary">{user.email} &middot; {user.houseNumber ?? "-"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    user.status === "active" ? "bg-success-bg text-success" : "bg-surface-tertiary text-text-secondary"
                  }`}
                >
                  {user.status === "active" ? "Aktif" : "Nonaktif"}
                </span>
                <span className="rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-info">
                  {ROLE_LABEL[user.role]}
                </span>

                {user.role !== "ketuaRT" && user.role !== "superAdmin" && (
                  <>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      loading={busyId === user.id}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      loading={busyId === user.id}
                      onClick={() => toggleRole(user)}
                    >
                      Jadikan {user.role === "bendahara" ? "Warga" : "Bendahara"}
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
                      loading={busyId === user.id}
                      onClick={() => deleteUser(user)}
                    >
                      Hapus
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
