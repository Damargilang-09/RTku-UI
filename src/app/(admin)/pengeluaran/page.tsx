"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { expensesApi } from "@/src/lib/api/expenses";
import { ApiError } from "@/src/lib/api/axios";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Input, Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDate, monthName } from "@/src/lib/utils";
import { isPdfUrl } from "@/src/lib/file-utils";
import type { ApprovalStatus, Expense, PaginationMeta } from "@/src/types";

const PAGE_SIZE = 10;

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const SORT_OPTIONS = [
  { value: "expenseDate_desc", label: "Tanggal Terbaru" },
  { value: "expenseDate_asc", label: "Tanggal Terlama" },
  { value: "amount_desc", label: "Nominal Tertinggi" },
  { value: "amount_asc", label: "Nominal Terendah" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

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

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function PengeluaranPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // filter & sort
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sort, setSort] = useState<SortValue>("expenseDate_desc");

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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // debounce search 400ms
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // reset ke halaman 1 tiap filter berubah
  useEffect(() => {
    setPageByTab((prev) => ({ ...prev, [tab]: 1 }));
  }, [debouncedSearch, monthFilter, yearFilter, tab]);

  const load = useCallback(() => {
    setLoading(true);
    expensesApi
      .getAll({
        status: tab,
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        month: monthFilter && yearFilter ? Number(monthFilter) : undefined,
        year: monthFilter && yearFilter ? Number(yearFilter) : undefined,
      })
      .then((res) => {
        const items = res.data ?? [];
        const responseMeta = res.meta ?? {
          page,
          limit: PAGE_SIZE,
          totalData: items.length,
          totalPage: 1,
        };
        setExpenses(items);
        setMetaByTab((prev) => ({ ...prev, [tab]: responseMeta }));
      })
      .finally(() => setLoading(false));
  }, [tab, page, debouncedSearch, monthFilter, yearFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses];
    sorted.sort((a, b) => {
      switch (sort) {
        case "expenseDate_asc":
          return (
            new Date(a.expenseDate).getTime() -
            new Date(b.expenseDate).getTime()
          );
        case "amount_desc":
          return Number(b.amount) - Number(a.amount);
        case "amount_asc":
          return Number(a.amount) - Number(b.amount);
        case "expenseDate_desc":
        default:
          return (
            new Date(b.expenseDate).getTime() -
            new Date(a.expenseDate).getTime()
          );
      }
    });
    return sorted;
  }, [expenses, sort]);

  function setPage(newPage: number) {
    setPageByTab((prev) => ({ ...prev, [tab]: newPage }));
  }

  function resetFilters() {
    setSearch("");
    setMonthFilter("");
    setYearFilter("");
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await expensesApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyetujui pengeluaran",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await expensesApi.approve(id, {
        status: "rejected",
        rejectedReason: reason.trim(),
      });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menolak pengeluaran",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus pengajuan pengeluaran ini?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await expensesApi.delete(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menghapus pengeluaran",
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
          <h1 className="text-2xl font-bold text-text-primary">Pengeluaran</h1>
          <p className="text-sm text-text-secondary">
            Pengajuan dan riwayat pengeluaran kas RT.
          </p>
        </div>
        {canCreate && (
          <Link href="/pengeluaran/baru">
            <Button>
              <span className="material-symbols-outlined text-base">add</span>
              Input Pengeluaran
            </Button>
          </Link>
        )}
      </div>

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

      {/* Filter bar */}
      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Cari judul / kode pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary"
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
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary"
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
            className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary"
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
      ) : sortedExpenses?.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="Tidak ada data"
          description="Belum ada pengeluaran yang cocok dengan filter ini."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sortedExpenses?.map((exp) => (
            <Card key={exp.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {exp.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {exp.expenseCode} &middot; {formatDate(exp.expenseDate)}
                  </p>
                  {exp.description && (
                    <p className="mt-1 text-xs text-text-muted">
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-text-primary">
                    {formatRupiah(exp.amount)}
                  </span>
                  <StatusChip status={exp.status} />
                </div>
              </div>

              {exp.expenses_image && exp.expenses_image.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {exp.expenses_image.map((img) =>
                    isPdfUrl(img.attachment_url) ? (
                      <a
                        key={img.id}
                        href={img.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-tertiary text-danger hover:bg-border"
                      >
                        <span className="material-symbols-outlined text-3xl">
                          picture_as_pdf
                        </span>
                        <span className="mt-1 text-xs font-semibold">
                          Buka PDF
                        </span>
                      </a>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.id}
                        src={img.attachment_url}
                        alt="Bukti pengeluaran"
                        className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
                      />
                    ),
                  )}
                </div>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <Link href={`/pengeluaran/${exp.id}`}>
                  <Button variant="secondary" className="px-3 py-2 text-xs">
                    <span className="material-symbols-outlined text-base">
                      visibility
                    </span>
                    Detail
                  </Button>
                </Link>
                {canCreate && (
                  <Button
                    variant="danger"
                    className="px-3 py-2 text-xs"
                    loading={deletingId === exp.id}
                    onClick={() => handleDelete(exp.id)}
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                    Hapus
                  </Button>
                )}
              </div>

              {canApprove && exp.status === "pending" && (
                <div className="mt-4 flex flex-col gap-3">
                  {rejectingId === exp.id ? (
                    <>
                      <Textarea
                        placeholder="Alasan penolakan"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          loading={busyId === exp.id}
                          onClick={() => handleReject(exp.id)}
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
                        loading={busyId === exp.id}
                        onClick={() => handleApprove(exp.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          check
                        </span>
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setRejectingId(exp.id)}
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

              {exp.status === "rejected" && exp.rejectedReason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                  Alasan: {exp.rejectedReason}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && sortedExpenses?.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Menampilkan {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
            {meta.totalData} pengeluaran
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
