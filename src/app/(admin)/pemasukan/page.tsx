"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { incomeApi } from "@/src/lib/api/income";
import { ApiError } from "@/src/lib/api/axios";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDate, monthName } from "@/src/lib/utils";
import type { ApprovalStatus, Income, PaginationMeta } from "@/src/types";
import {
  incomeFormSchema,
  IncomeFormValues,
  rejectReasonSchema,
} from "@/src/validations";

const PAGE_SIZE = 10;

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

function generateIncomeCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `INC-${date}-${Math.floor(Math.random() * 900 + 100)}`;
}

function getVisiblePages(current: number, total: number): number[] {
  const delta = 2;
  const range: number[] = [];
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    range.push(i);
  }
  if (range[0] > 1) range.unshift(1);
  if (range[range.length - 1] < total) range.push(total);
  return range;
}

export default function PemasukanPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [income, setIncome] = useState<Income[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const SORT_OPTIONS = [
    { value: "income_date_desc", label: "Tanggal Terbaru" },
    { value: "income_date_asc", label: "Tanggal Terlama" },
    { value: "amount_desc", label: "Nominal Tertinggi" },
    { value: "amount_asc", label: "Nominal Terendah" },
  ] as const;

  type SortValue = (typeof SORT_OPTIONS)[number]["value"];

  const [sort, setSort] = useState<SortValue>("income_date_desc");

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  const CURRENT_YEAR = new Date().getFullYear();

  const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPageByTab((prev) => ({
      ...prev,
      [tab]: 1,
    }));
  }, [debouncedSearch, monthFilter, yearFilter, tab]);

  // Each tab keeps track of its own current page.
  const [pageByTab, setPageByTab] = useState<Record<ApprovalStatus, number>>({
    pending: 1,
    approved: 1,
    rejected: 1,
  });

  const [metaByTab, setMetaByTab] = useState<
    Record<ApprovalStatus, PaginationMeta>
  >({
    pending: EMPTY_META,
    approved: EMPTY_META,
    rejected: EMPTY_META,
  });
  const page = pageByTab[tab];
  const meta = metaByTab[tab];
  const visiblePages = getVisiblePages(page, meta.totalPage);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    income_code: generateIncomeCode(),
    title: "",
    description: "",
    amount: "",
    income_date: new Date().toISOString().slice(0, 10),
  });
  const [reason, setReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncomeFormValues, string>>
  >({});

  const [rejectError, setRejectError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    incomeApi
      .getAll({
        status: tab,
        page,
        limit: PAGE_SIZE,

        search: debouncedSearch || undefined,

        month: monthFilter ? Number(monthFilter) : undefined,

        year: yearFilter ? Number(yearFilter) : undefined,

        sortBy: sort.split("_")[0],

        sortOrder: sort.split("_")[1] as "asc" | "desc",
      })
      .then((response) => {
        const items = response.data ?? [];
        const responseMeta = response.meta ?? {
          page,
          limit: PAGE_SIZE,
          totalData: items.length,
          totalPage: 1,
        };
        setIncome(items);
        setMetaByTab((prev) => ({ ...prev, [tab]: responseMeta }));
      })
      .finally(() => setLoading(false));
  }, [tab, page, debouncedSearch, monthFilter, yearFilter, sort]);

  useEffect(() => {
    load();
  }, [load]);

  function setPage(newPage: number) {
    setPageByTab((prev) => ({ ...prev, [tab]: newPage }));
  }

  function resetFilters() {
    setSearch("");
    setMonthFilter("");
    setYearFilter("");
    setSort("income_date_desc");
  }

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setErrors({});

    const result = incomeFormSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        income_code: fieldErrors.income_code?.[0],
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        amount: fieldErrors.amount?.[0],
        income_date: fieldErrors.income_date?.[0],
      });

      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    try {
      await incomeApi.create({
        income_code: result.data.income_code,
        title: result.data.title,
        description: result.data.description,
        amount: result.data.amount,
        income_date: result.data.income_date,
      });

      setShowForm(false);

      setForm({
        income_code: generateIncomeCode(),
        title: "",
        description: "",
        amount: "",
        income_date: new Date().toISOString().slice(0, 10),
      });

      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyimpan pemasukan",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await incomeApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyetujui pemasukan",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setRejectError(null);

    const result = rejectReasonSchema.safeParse({
      reason,
    });

    if (!result.success) {
      setRejectError(result.error.issues[0].message);
      return;
    }

    setBusyId(id);

    try {
      await incomeApi.approve(id, {
        status: "rejected",
        rejected_reason: result.data.reason,
      });

      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menolak pemasukan",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus catatan pemasukan ini?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await incomeApi.delete(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menghapus pemasukan",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const canApprove = user?.role === "ketuaRT";
  const canCreate = user?.role === "bendahara";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Pemasukan Lain
          </h1>
          <p className="text-sm text-text-secondary">
            Sumbangan, donasi, dan pemasukan di luar iuran warga.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((v) => !v)}>
            <span className="material-symbols-outlined text-base">add</span>
            Catat Pemasukan
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6"
        >
          <Input
            label="Kode Pemasukan"
            value={form.income_code}
            onChange={(e) => update("income_code", e.target.value)}
            error={errors.income_code}
            required
          />

          <Input
            label="Judul"
            placeholder="Contoh: Donasi Fogging"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            error={errors.title}
            required
          />

          <Textarea
            label="Deskripsi"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            error={errors.description}
            required
            rows={2}
          />
          <Input
            label="Jumlah (Rp)"
            type="number"
            min={1}
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            error={errors.amount}
            required
          />
          <Input
            label="Tanggal"
            type="date"
            value={form.income_date}
            onChange={(e) => update("income_date", e.target.value)}
            error={errors.income_date}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" loading={submitting}>
              Simpan
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-primary text-white"
                : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Cari judul / kode pemasukan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm"
          >
            <option value="">Semua Bulan</option>

            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {monthName(m)}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm"
          >
            <option value="">Semua Tahun</option>

            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Urutkan: {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(search || monthFilter || yearFilter) && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            Reset semua filter
          </button>
        )}
      </Card>

      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : income?.length === 0 ? (
        <EmptyState
          icon="trending_up"
          title="Tidak ada data"
          description="Belum ada pemasukan pada status ini."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {income?.map((inc) => (
            <Card key={inc.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {inc.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {inc.income_code} &middot; {formatDate(inc.income_date)}
                  </p>
                  {inc.description && (
                    <p className="mt-1 text-xs text-text-muted">
                      {inc.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-secondary-dark">
                    {formatRupiah(inc.amount)}
                  </span>
                  <StatusChip status={inc.status} />
                </div>
              </div>

              {canCreate && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="danger"
                    className="px-3 py-2 text-xs"
                    loading={deletingId === inc.id}
                    onClick={() => handleDelete(inc.id)}
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                    Hapus
                  </Button>
                </div>
              )}

              {canApprove && inc.status === "pending" && (
                <div className="mt-4 flex flex-col gap-3">
                  {rejectingId === inc.id ? (
                    <>
                      {rejectError && (
                        <p className="text-sm text-danger">{rejectError}</p>
                      )}

                      <Textarea
                        placeholder="Alasan penolakan"
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          setRejectError(null);
                        }}
                        rows={2}
                      />

                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          loading={busyId === inc.id}
                          onClick={() => handleReject(inc.id)}
                        >
                          Kirim Penolakan
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRejectingId(null);
                            setReason("");
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        loading={busyId === inc.id}
                        onClick={() => handleApprove(inc.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          check
                        </span>
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setRejectingId(inc.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {inc.status === "rejected" && inc.rejected_reason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                  Alasan: {inc.rejected_reason}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
      {!loading && income?.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Menampilkan {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
            {meta.totalData} pemasukan
          </p>
          {meta.totalPage > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
                Sebelumnya
              </Button>
              {visiblePages.map((number, index) => (
                <div key={number} className="flex items-center gap-2">
                  {visiblePages[index - 1] &&
                    number - visiblePages[index - 1] > 1 && (
                      <span className="px-1 text-text-muted">…</span>
                    )}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold ${
                      page === number
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {number}
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page === meta.totalPage}
                onClick={() => setPage(Math.min(meta.totalPage, page + 1))}
              >
                Berikutnya
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
