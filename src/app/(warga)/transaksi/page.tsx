"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { paymentsApi } from "@/src/lib/api/payments";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Input } from "@/src/components/ui/Input";
import { cn, formatRupiah, formatDateTime, monthName } from "@/src/lib/utils";
import type {
  ApprovalStatus,
  FeeType,
  PaginationMeta,
  Payment,
} from "@/src/types";
import { Button } from "@/src/components/ui/Button";

const PAGE_SIZE = 10;

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

const STATUS_TABS: { value: ApprovalStatus | ""; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const SORT_OPTIONS = [
  { value: "paidAt_desc", label: "Tanggal Terbaru" },
  { value: "paidAt_asc", label: "Tanggal Terlama" },
  { value: "amount_desc", label: "Nominal Tertinggi" },
  { value: "amount_asc", label: "Nominal Terendah" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function TransaksiPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "">("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sort, setSort] = useState<SortValue>("paidAt_desc");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, feeTypeFilter, monthFilter, yearFilter]);

  useEffect(() => {
    feeTypesApi
      .getAll()
      .then((res) => setFeeTypes(res.data))
      .catch(() => undefined);
  }, []);

const load = useCallback(() => {
  setLoading(true);

  paymentsApi
    .getMyPayments({
      page,
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
      month: monthFilter && yearFilter ? Number(monthFilter) : undefined,
      year: monthFilter && yearFilter ? Number(yearFilter) : undefined,
    })
    .then((res) => {
      setPayments(res.data);
      setMeta(res.meta ?? { ...EMPTY_META, page, totalData: res.data.length });
    })
    .finally(() => setLoading(false));
}, [page, statusFilter, debouncedSearch, monthFilter, yearFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedPayments = useMemo(() => {
  const filtered = feeTypeFilter
    ? payments.filter((p) => p.feeTypeName === feeTypeFilter)
    : payments;

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case "paidAt_asc":
        return new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime();
      case "amount_desc":
        return Number(b.amount) - Number(a.amount);
      case "amount_asc":
        return Number(a.amount) - Number(b.amount);
      case "paidAt_desc":
      default:
        return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
    }
  });
  return sorted;
}, [payments, sort, feeTypeFilter]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setFeeTypeFilter("");
    setMonthFilter("");
    setYearFilter("");
  }

  const totalPage = Math.max(1, meta.totalPage ?? 1);
  const pageNumbers = Array.from({ length: totalPage }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPage || Math.abs(n - meta.page) <= 1,
  );

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-32">
      <h1 className="text-xl font-bold text-text-primary">Riwayat Transaksi</h1>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === t.value
                ? "bg-primary text-white"
                : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3">
        <Input
          placeholder="Cari jenis iuran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="">Semua Jenis Iuran</option>
            {feeTypes.map((ft) => (
              <option key={ft.id} value={ft.name}>
                {ft.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
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
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="">Semua Tahun</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {(search ||
          statusFilter ||
          feeTypeFilter ||
          monthFilter ||
          yearFilter) && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            Reset semua filter
          </button>
        )}
      </Card>

      {loading ? (
        <Spinner />
      ) : sortedPayments?.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="Belum ada riwayat"
          description="Transaksi pembayaran kamu akan muncul di sini."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {sortedPayments?.map((p) => (
              <Link key={p.id} href={`/transaksi/${p.id}`}>
                <Card className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {p.feeTypeName ?? "Pembayaran Iuran"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDateTime(p.paidAt)}
                    </p>
                    {p.paymentMethod && (
                      <p className="text-xs text-text-muted">
                        {p.paymentMethod}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      {formatRupiah(p.amount)}
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="fixed bottom-16 left-0 right-0 flex-col gap-5 bg-surface-secondary px-4 py-3">
            <p className="flex justify-center pb-4 text-xs text-text-secondary">
              Menampilkan {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
              {meta.totalData} transaksi
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
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
                      <span className="px-1 text-sm text-text-muted">...</span>
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
                disabled={meta.page >= totalPage}
                onClick={() =>
                  setPage((current) => Math.min(totalPage, current + 1))
                }
              >
                Berikutnya
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
