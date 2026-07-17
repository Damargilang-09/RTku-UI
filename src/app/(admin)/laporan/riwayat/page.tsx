"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { reportsApi } from "@/src/lib/api/reports";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Pagination } from "@/src/components/ui/Pagination";
import { formatRupiah, formatDate, monthName } from "@/src/lib/utils";
import type { Report } from "@/src/types";

const PAGE_SIZE = 15;

export default function RiwayatLaporanPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openImage, setOpenImage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    reportsApi
      .getAll({ page, limit: PAGE_SIZE })
      .then((res) => {
        const items = res.data ?? [];
        setReports(items);
        setHasNextPage(items.length === PAGE_SIZE);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link href="/laporan" className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Riwayat Laporan Keuangan</h1>
          <p className="text-sm text-text-secondary">
            Seluruh laporan tutup buku beserta bukti rekening koran dan status persetujuannya.
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <EmptyState icon="history" title="Belum ada riwayat laporan" description="Riwayat laporan bulanan akan muncul di sini." />
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <button
                type="button"
                onClick={() => r.report_proof_img && setOpenImage(r.report_proof_img)}
                className="shrink-0"
              >
                {r.report_proof_img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.report_proof_img}
                    alt={`Bukti laporan ${monthName(r.period_month)} ${r.period_year}`}
                    className="h-28 w-full rounded-xl border border-border object-cover sm:w-40"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-border bg-surface-tertiary text-text-muted sm:w-40">
                    <span className="material-symbols-outlined">image_not_supported</span>
                  </div>
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold text-text-primary">
                    {monthName(r.period_month)} {r.period_year}
                  </p>
                  <StatusChip status={r.status} />
                </div>

                {r.created_at && (
                  <p className="mt-0.5 text-xs text-text-secondary">Diajukan {formatDate(r.created_at)}</p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-text-secondary">Saldo Awal</p>
                    <p className="font-medium text-text-primary">{formatRupiah(r.opening_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Pemasukan</p>
                    <p className="font-medium text-secondary-dark">{formatRupiah(r.total_income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Pengeluaran</p>
                    <p className="font-medium text-danger">{formatRupiah(r.total_expense)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Saldo Akhir</p>
                    <p className="font-bold text-primary">{formatRupiah(r.closing_balance)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  {r.users_reports_created_byTousers?.name && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      Diajukan oleh {r.users_reports_created_byTousers.name}
                    </span>
                  )}
                  {r.users_reports_approved_byTousers?.name && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Disetujui oleh {r.users_reports_approved_byTousers.name}
                    </span>
                  )}
                </div>

                {r.status === "failed" && r.rejected_reason && (
                  <p className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                    Alasan gagal: {r.rejected_reason}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && reports.length > 0 && (
        <Pagination page={page} hasNextPage={hasNextPage} onPageChange={setPage} loading={loading} />
      )}

      {openImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={openImage}
            alt="Bukti laporan diperbesar"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          <button
            type="button"
            onClick={() => setOpenImage(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
