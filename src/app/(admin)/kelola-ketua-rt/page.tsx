"use client";

import { useCallback, useEffect, useState } from "react";
import { superAdminApi } from "@/src/lib/api/super-admin";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ROLE_LABEL, cn } from "@/src/lib/utils";
import type { PaginationMeta, User, UserRole, UserStatus } from "@/src/types";

const INITIAL_META: PaginationMeta = {
  page: 1,
  limit: 10,
  totalData: 0,
  totalPage: 0,
};

const ROLE_OPTIONS: Array<{
  value: "" | Exclude<UserRole, "superAdmin">;
  label: string;
}> = [
  { value: "", label: "Semua peran" },
  { value: "warga", label: "Warga" },
  { value: "bendahara", label: "Bendahara" },
  { value: "ketuaRT", label: "Ketua RT" },
];

const STATUS_OPTIONS: Array<{ value: "" | UserStatus; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export default function KelolaKetuaRTPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(INITIAL_META);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [role, setRole] = useState<"" | Exclude<UserRole, "superAdmin">>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await superAdminApi.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        role: role || undefined,
      });

      setUsers(response.data.userList);
      setMeta(response.data.meta);
    } catch (err) {
      setUsers([]);
      setError(
        err instanceof ApiError ? err.message : "Gagal mengambil daftar user",
      );
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeout);
  }, [load]);

  function changeStatus(value: "" | UserStatus) {
    setPage(1);
    setStatus(value);
  }

  function changeRole(value: "" | Exclude<UserRole, "superAdmin">) {
    setPage(1);
    setRole(value);
  }

  async function setAsKetuaRT(user: User) {
    const confirmed = window.confirm(
      `Jadikan ${user.name} sebagai Ketua RT? Ketua RT sebelumnya akan otomatis dikembalikan menjadi warga.`,
    );

    if (!confirmed) return;

    setBusyId(user.id);
    setError(null);
    setSuccess(null);

    try {
      await superAdminApi.setKetuaRT(user.id);
      setSuccess(`${user.name} berhasil ditetapkan sebagai Ketua RT.`);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menetapkan Ketua RT",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function removeKetuaRT(user: User) {
    const confirmed = window.confirm(
      `Cabut ${user.name} dari Ketua RT? Akun akan tetap aktif sebagai warga dan sistem sementara tidak memiliki Ketua RT.`,
    );

    if (!confirmed) return;

    setBusyId(user.id);
    setError(null);
    setSuccess(null);

    try {
      await superAdminApi.removeKetuaRT(user.id);
      setSuccess(
        `${user.name} berhasil dicabut dari Ketua RT dan kembali menjadi warga.`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mencabut Ketua RT",
      );
    } finally {
      setBusyId(null);
    }
  }

  const pageNumbers = Array.from(
    { length: meta.totalPage },
    (_, index) => index + 1,
  ).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === meta.totalPage ||
      Math.abs(pageNumber - meta.page) <= 1,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Kelola Ketua RT
        </h1>
        <p className="text-sm text-text-secondary">
          Tetapkan Ketua RT baru atau cabut Ketua RT aktif tanpa pengganti.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Cari nama user..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <select
          value={status}
          onChange={(event) =>
            changeStatus(event.target.value as "" | UserStatus)
          }
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={role}
          onChange={(event) =>
            changeRole(
              event.target.value as "" | Exclude<UserRole, "superAdmin">,
            )
          }
          className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-success-bg px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon="manage_accounts" title="Tidak ada user ditemukan" />
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {users.map((user, index) => {
              const isActiveKetuaRT =
                user.role === "ketuaRT" && user.status === "active";

              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                    index !== users.length - 1 &&
                      "border-b border-surface-tertiary",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {user.email} &middot; Rumah {user.houseNumber ?? "-"}
                      </p>
                      {user.address && (
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          {user.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        user.status === "active"
                          ? "bg-success-bg text-success"
                          : "bg-surface-tertiary text-text-secondary",
                      )}
                    >
                      {user.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>

                    <span className="rounded-full bg-info-bg px-3 py-1 text-xs font-semibold text-info">
                      {ROLE_LABEL[user.role]}
                    </span>

                    {isActiveKetuaRT ? (
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        loading={busyId === user.id}
                        onClick={() => removeKetuaRT(user)}
                      >
                        Cabut Ketua RT
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        className="px-3 py-1.5 text-xs"
                        loading={busyId === user.id}
                        onClick={() => setAsKetuaRT(user)}
                      >
                        Jadikan Ketua RT
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Menampilkan {users.length} dari {meta.totalData} user
            </p>

            {meta.totalPage > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  className="h-9 px-3 py-0 text-xs"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="material-symbols-outlined text-base">
                    chevron_left
                  </span>
                  Sebelumnya
                </Button>

                {pageNumbers.map((pageNumber, index) => {
                  const previousPageNumber = pageNumbers[index - 1];
                  const showEllipsis =
                    previousPageNumber && pageNumber - previousPageNumber > 1;

                  return (
                    <div key={pageNumber} className="flex items-center gap-2">
                      {showEllipsis && (
                        <span className="px-1 text-sm text-text-muted">
                          ...
                        </span>
                      )}
                      <Button
                        variant={
                          pageNumber === meta.page ? "primary" : "secondary"
                        }
                        className="h-9 min-w-9 px-3 py-0 text-xs"
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    </div>
                  );
                })}

                <Button
                  variant="secondary"
                  className="h-9 px-3 py-0 text-xs"
                  disabled={meta.page >= meta.totalPage}
                  onClick={() =>
                    setPage((current) => Math.min(meta.totalPage, current + 1))
                  }
                >
                  Berikutnya
                  <span className="material-symbols-outlined text-base">
                    chevron_right
                  </span>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
