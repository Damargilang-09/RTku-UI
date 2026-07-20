"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi } from "@/src/lib/api/users";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ROLE_LABEL } from "@/src/lib/utils";
import type { PaginationMeta, User, UserRole, UserStatus } from "@/src/types";

const PAGE_SIZE = 10;

const ROLE_OPTIONS: Array<{
  value: "" | Extract<UserRole, "warga" | "bendahara">;
  label: string;
}> = [
  { value: "", label: "Semua peran" },
  { value: "warga", label: "Warga" },
  { value: "bendahara", label: "Bendahara" },
];

const STATUS_OPTIONS: Array<{ value: "" | UserStatus; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

export default function KelolaWargaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    totalData: 0,
    totalPage: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "" | Extract<UserRole, "warga" | "bendahara">
  >("");
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<{
    userId: string;
    action: "status" | "role" | "delete";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.getAll({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        role: role || undefined,
        status: status || undefined,
      });

      setUsers(response.data.users);
      setMeta({
        page: response.data.meta.page,
        limit: PAGE_SIZE,
        totalData: response.data.meta.totalData,
        totalPage: Math.max(1, response.data.meta.totalPage),
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengambil daftar warga",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  function reloadFromFirstPage() {
    if (page === 1) {
      load();
      return;
    }

    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  }

  async function toggleStatus(user: User) {
    setBusyAction({ userId: user.id, action: "status" });
    setError(null);

    try {
      await usersApi.update(user.id, {
        status: user.status === "active" ? "inactive" : "active",
      });
      reloadFromFirstPage();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal memperbarui status warga",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleRole(user: User) {
    setBusyAction({ userId: user.id, action: "role" });
    setError(null);

    try {
      await usersApi.update(user.id, {
        role: user.role === "bendahara" ? "warga" : "bendahara",
      });
      reloadFromFirstPage();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memperbarui peran warga",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Hapus akun ${user.name}? Histori transaksi user tetap tersimpan.`,
    );

    if (!confirmed) return;

    setBusyAction({ userId: user.id, action: "delete" });
    setError(null);

    try {
      await usersApi.delete(user.id);
      reloadFromFirstPage();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus warga");
    } finally {
      setBusyAction(null);
    }
  }

  const visiblePages = Array.from(
    { length: meta.totalPage },
    (_, index) => index + 1,
  ).filter(
    (pageNumber) =>
      pageNumber === 1 ||
      pageNumber === meta.totalPage ||
      Math.abs(pageNumber - page) <= 1,
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Kelola Warga</h1>
        <p className="text-sm text-text-secondary">
          Aktivasi akun dan kelola peran warga di lingkungan RT.
        </p>
      </div>

      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 md:grid-cols-3">
        <Input
          label="Pencarian"
          placeholder="Cari nama, email, atau nomor rumah"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Peran
          <select
            value={role}
            onChange={(event) => {
              setRole(
                event.target.value as
                  | ""
                  | Extract<UserRole, "warga" | "bendahara">,
              );
              setPage(1);
            }}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | UserStatus);
              setPage(1);
            }}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-2"
            onClick={resetFilters}
          >
            Reset filter
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon="group" title="Tidak ada warga ditemukan" />
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  index !== users.length - 1
                    ? "border-b border-surface-tertiary"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {user.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {user.email} &middot; {user.houseNumber ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-success-bg text-success"
                        : "bg-surface-tertiary text-text-secondary"
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
                        loading={
                          busyAction?.userId === user.id &&
                          busyAction?.action === "status"
                        }
                        onClick={() => toggleStatus(user)}
                      >
                        {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs"
                        loading={
                          busyAction?.userId === user.id &&
                          busyAction?.action === "role"
                        }
                        onClick={() => toggleRole(user)}
                      >
                        Jadikan{" "}
                        {user.role === "bendahara" ? "Warga" : "Bendahara"}
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        loading={
                          busyAction?.userId === user.id &&
                          busyAction?.action === "delete"
                        }
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Menampilkan {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
              {meta.totalData} warga
            </p>

            {meta.totalPage > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                >
                  <span className="material-symbols-outlined text-base">
                    chevron_left
                  </span>
                  Sebelumnya
                </Button>

                {visiblePages.map((pageNumber, index) => (
                  <div key={pageNumber} className="flex items-center gap-2">
                    {visiblePages[index - 1] &&
                      pageNumber - visiblePages[index - 1] > 1 && (
                        <span className="px-1 text-text-muted">…</span>
                      )}
                    <button
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold ${
                        page === pageNumber
                          ? "bg-primary text-white"
                          : "bg-surface text-text-secondary hover:bg-surface-tertiary"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === meta.totalPage}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(meta.totalPage, currentPage + 1),
                    )
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
