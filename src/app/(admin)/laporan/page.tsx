"use client";

import { useEffect, useState, useCallback, ChangeEvent } from "react";
import Link from "next/link";
import { reportsApi } from "@/src/lib/api/reports";
import { ApiError } from "@/src/lib/api/axios";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Pagination } from "@/src/components/ui/Pagination";
import { formatRupiah, monthName } from "@/src/lib/utils";
import type { Report } from "@/src/types";

export default function LaporanKeuanganPage() {
  const user = useAuthStore((s) => s.user);
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const PAGE_SIZE = 12;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("REPORT_IMAGE", file);
      await reportsApi.create(formData);
      if (page === 1) {
        load();
      } else {
        setPage(1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat laporan");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleClose(id: string) {
    setBusyId(id);
    try {
      await reportsApi.approve(id, { status: "closed" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menutup laporan");
    } finally {
      setBusyId(null);
    }
  }

  async function handleFail(id: string) {
    if (!reason.trim()) {
      setError("Alasan wajib diisi");
      return;
    }
    setBusyId(id);
    try {
      await reportsApi.approve(id, { status: "failed", rejected_reason: reason.trim() });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memperbarui laporan");
    } finally {
      setBusyId(null);
    }
  }

  const canCreate = user?.role === "bendahara";
  const canApprove = user?.role === "ketuaRT";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Laporan Keuangan</h1>
          <p className="text-sm text-text-secondary">Laporan tutup buku bulanan kas RT.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/laporan/riwayat"
            className="inline-flex items-center gap-2 rounded-xl bg-surface-tertiary px-5 py-3 text-sm font-semibold text-text-primary hover:bg-border"
          >
            <span className="material-symbols-outlined text-base">history</span>
            Riwayat Laporan
          </Link>
          {canCreate && (
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
                <span className="material-symbols-outlined text-base">
                  {uploading ? "progress_activity" : "upload_file"}
                </span>
                Buat Laporan Bulan Ini
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : reports?.length === 0 ? (
        <EmptyState icon="summarize" title="Belum ada laporan" description="Laporan bulanan akan muncul di sini setelah dibuat." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">
                  {monthName(r.period_month)} {r.period_year}
                </p>
                <StatusChip status={r.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-text-secondary">Saldo Awal</span>
                <span className="text-right font-medium text-text-primary">{formatRupiah(r.opening_balance)}</span>
                <span className="text-text-secondary">Total Pemasukan</span>
                <span className="text-right font-medium text-secondary-dark">{formatRupiah(r.total_income)}</span>
                <span className="text-text-secondary">Total Pengeluaran</span>
                <span className="text-right font-medium text-danger">{formatRupiah(r.total_expense)}</span>
                <span className="font-semibold text-text-primary">Saldo Akhir</span>
                <span className="text-right font-bold text-primary">{formatRupiah(r.closing_balance)}</span>
              </div>

              {canApprove && r.status === "open" && (
                <div className="mt-4 flex flex-col gap-3 border-t border-surface-tertiary pt-4">
                  {rejectingId === r.id ? (
                    <>
                      <Textarea placeholder="Alasan laporan gagal ditutup" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button variant="danger" loading={busyId === r.id} onClick={() => handleFail(r.id)}>Tandai Gagal</Button>
                        <Button variant="secondary" onClick={() => { setRejectingId(null); setReason(""); }}>Batal</Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="success" loading={busyId === r.id} onClick={() => handleClose(r.id)}>
                        <span className="material-symbols-outlined text-base">check</span>Tutup Buku
                      </Button>
                      <Button variant="danger" onClick={() => setRejectingId(r.id)}>Tandai Gagal</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && reports?.length > 0 && (
        <Pagination page={page} hasNextPage={hasNextPage} onPageChange={setPage} loading={loading} />
      )}
    </div>
  );
}
