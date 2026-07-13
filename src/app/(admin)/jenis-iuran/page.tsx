"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah } from "@/src/lib/utils";
import type { BillingPeriod, FeeType } from "@/src/types";

const PAGE_SIZE = 6;


function getVisiblePages(currentPage: number, totalPage: number) {
  if (totalPage <= 5) {
    return Array.from({ length: totalPage }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPage, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= totalPage).sort((a, b) => a - b);
}

export default function JenisIuranPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"all" | BillingPeriod>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feeTypesApi.getAll();
      setFeeTypes(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil data jenis iuran");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredFeeTypes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return feeTypes.filter((feeType) => {
      const matchesSearch =
        !keyword ||
        feeType.name.toLowerCase().includes(keyword) ||
        feeType.description?.toLowerCase().includes(keyword);
      const matchesPeriod = periodFilter === "all" || feeType.billingPeriod === periodFilter;

      return matchesSearch && matchesPeriod;
    });
  }, [feeTypes, periodFilter, search]);

  const totalPage = Math.max(1, Math.ceil(filteredFeeTypes.length / PAGE_SIZE));
  const visiblePages = getVisiblePages(page, totalPage);
  const paginatedFeeTypes = filteredFeeTypes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, periodFilter]);

  useEffect(() => {
    if (page > totalPage) setPage(totalPage);
  }, [page, totalPage]);



  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kelola Jenis Iuran</h1>
          <p className="text-sm text-text-secondary">
            Tambah dan kelola jenis iuran yang digunakan untuk membuat tagihan warga.
          </p>
        </div>
        <Link href="/jenis-iuran/tambah">
          <Button>
            <span className="material-symbols-outlined text-base">add</span>
            Tambah Jenis Iuran
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          placeholder="Cari nama atau deskripsi iuran..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Periode
          <select
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value as "all" | BillingPeriod)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">Semua periode</option>
            <option value="monthly">Bulanan</option>
            <option value="once">Sekali Bayar</option>
          </select>
        </label>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : paginatedFeeTypes.length === 0 ? (
        <EmptyState icon="receipt_long" title="Tidak ada jenis iuran ditemukan" />
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {paginatedFeeTypes.map((feeType, index) => (
              <div
                key={feeType.id}
                className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  index !== paginatedFeeTypes.length - 1 ? "border-b border-surface-tertiary" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{feeType.name}</p>
                      <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-semibold text-info">
                        {feeType.billingPeriod === "monthly" ? "Bulanan" : "Sekali Bayar"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatRupiah(feeType.amount)}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {feeType.description || "Tanpa deskripsi"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Link href={`/jenis-iuran/${feeType.id}`}>
                    <Button variant="secondary" className="px-3 py-2 text-xs">
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Detail
                    </Button>
                  </Link>
                  <Link href={`/jenis-iuran/${feeType.id}/edit`}>
                    <Button variant="secondary" className="px-3 py-2 text-xs">
                      <span className="material-symbols-outlined text-base">edit</span>
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/jenis-iuran/${feeType.id}/hapus`}>
                    <Button variant="danger" className="px-3 py-2 text-xs">
                      <span className="material-symbols-outlined text-base">delete</span>
                      Hapus
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredFeeTypes.length)} dari {filteredFeeTypes.length} jenis iuran
            </p>

            {totalPage > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                  Sebelumnya
                </Button>

                {visiblePages.map((pageNumber, index) => {
                  const previousPage = visiblePages[index - 1];
                  return (
                    <div key={pageNumber} className="flex items-center gap-2">
                      {previousPage && pageNumber - previousPage > 1 && (
                        <span className="px-1 text-sm text-text-muted">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold transition-colors ${
                          page === pageNumber
                            ? "bg-primary text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-tertiary"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    </div>
                  );
                })}

                <Button
                  variant="secondary"
                  className="px-3 py-2 text-xs"
                  disabled={page === totalPage}
                  onClick={() => setPage((current) => Math.min(totalPage, current + 1))}
                >
                  Berikutnya
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
