"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { billsApi } from "@/src/lib/api/bills";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Spinner } from "@/src/components/ui/Spinner";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { formatDate, formatRupiah, monthName } from "@/src/lib/utils";
import type { Bill, BillStatus, FeeType, PaginationMeta } from "@/src/types";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Array<{ value: "" | BillStatus; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "unpaid", label: "Belum Dibayar" },
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Terlambat" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function TagihanWargaPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, totalData: 0, totalPage: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | BillStatus>("");
  const [feeTypeId, setFeeTypeId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [periodMonth, setPeriodMonth] = useState("");
  const [periodYear, setPeriodYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await billsApi.getAllBills({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        feeTypeId: feeTypeId || undefined,
        batchId: batchId.trim() || undefined,
        periodMonth: periodMonth ? Number(periodMonth) : undefined,
        periodYear: periodYear ? Number(periodYear) : undefined,
      });
      setBills(response.data);
      setMeta(response.meta ?? { page, limit: PAGE_SIZE, totalData: response.data.length, totalPage: 1 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil daftar tagihan warga");
    } finally {
      setLoading(false);
    }
  }, [page, status, feeTypeId, batchId, periodMonth, periodYear]);

  useEffect(() => {
    feeTypesApi.getAll().then((response) => setFeeTypes(response.data)).catch(() => setFeeTypes([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetFilters() {
    setStatus("");
    setFeeTypeId("");
    setBatchId("");
    setPeriodMonth("");
    setPeriodYear("");
    setPage(1);
  }

  const visiblePages = Array.from({ length: meta.totalPage }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === meta.totalPage || Math.abs(number - page) <= 1,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tagihan Warga</h1>
          <p className="text-sm text-text-secondary">Kelola dan pantau seluruh tagihan iuran warga.</p>
        </div>
        <Link href="/tagihan-warga/generate">
          <Button>
            <span className="material-symbols-outlined text-base">add_card</span>
            Generate Tagihan
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Status
          <select value={status} onChange={(e) => { setStatus(e.target.value as "" | BillStatus); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Jenis Iuran
          <select value={feeTypeId} onChange={(e) => { setFeeTypeId(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Semua jenis</option>
            {feeTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Bulan
          <select value={periodMonth} onChange={(e) => { setPeriodMonth(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Semua bulan</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{monthName(month)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Tahun
          <input type="number" min="2000" value={periodYear} onChange={(e) => { setPeriodYear(e.target.value); setPage(1); }} placeholder="2026" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary xl:col-span-2">
          Batch ID
          <div className="flex gap-2">
            <input value={batchId} onChange={(e) => setBatchId(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }} placeholder="Cari berdasarkan batch ID" className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <Button type="button" variant="secondary" className="px-3" onClick={() => { setPage(1); load(); }}><span className="material-symbols-outlined text-base">search</span></Button>
          </div>
        </label>
        <div className="md:col-span-2 xl:col-span-6 flex justify-end">
          <Button type="button" variant="ghost" className="px-3 py-2" onClick={resetFilters}>Reset filter</Button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? <Spinner /> : bills.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-text-muted">receipt_long</span>
          <p className="mt-2 font-semibold text-text-primary">Belum ada tagihan</p>
          <p className="text-sm text-text-secondary">Ubah filter atau generate tagihan baru.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-surface-tertiary text-xs uppercase tracking-wide text-text-muted">
                  <tr><th className="px-4 py-3">Warga</th><th className="px-4 py-3">Tagihan</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Jatuh Tempo</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-surface-secondary">
                      <td className="px-4 py-4"><p className="font-semibold text-text-primary">{bill.user?.name ?? "-"}</p><p className="text-xs text-text-secondary">Rumah {bill.user?.houseNumber ?? "-"}</p></td>
                      <td className="px-4 py-4"><p className="font-medium text-text-primary">{bill.feeType.name}</p><p className="text-xs text-text-secondary">{bill.billCode}</p></td>
                      <td className="px-4 py-4 text-text-secondary">{bill.periodMonth && bill.periodYear ? `${monthName(bill.periodMonth)} ${bill.periodYear}` : "Sekali bayar"}</td>
                      <td className="px-4 py-4 font-semibold text-primary">{formatRupiah(bill.amount)}</td>
                      <td className="px-4 py-4 text-text-secondary">{formatDate(bill.dueDate)}</td>
                      <td className="px-4 py-4"><StatusChip status={bill.status} /></td>
                      <td className="px-4 py-4"><div className="flex justify-end gap-2"><Link href={`/tagihan-warga/${bill.id}`}><Button variant="secondary" className="px-3 py-2 text-xs"><span className="material-symbols-outlined text-base">visibility</span>Detail</Button></Link>{bill.batchId && (bill.status === "unpaid" || bill.status === "overdue") && <Link href={`/tagihan-warga/cancel-batch?batchId=${encodeURIComponent(bill.batchId)}`}><Button variant="danger" className="px-3 py-2 text-xs"><span className="material-symbols-outlined text-base">cancel</span>Batalkan Batch</Button></Link>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">Menampilkan {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.totalData)} dari {meta.totalData} tagihan</p>
            {meta.totalPage > 1 && <div className="flex flex-wrap items-center gap-2"><Button variant="secondary" className="px-3 py-2 text-xs" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><span className="material-symbols-outlined text-base">chevron_left</span>Sebelumnya</Button>{visiblePages.map((number, index) => <div key={number} className="flex items-center gap-2">{visiblePages[index - 1] && number - visiblePages[index - 1] > 1 && <span className="px-1 text-text-muted">…</span>}<button type="button" onClick={() => setPage(number)} className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold ${page === number ? "bg-primary text-white" : "bg-surface text-text-secondary hover:bg-surface-tertiary"}`}>{number}</button></div>)}<Button variant="secondary" className="px-3 py-2 text-xs" disabled={page === meta.totalPage} onClick={() => setPage((current) => Math.min(meta.totalPage, current + 1))}>Berikutnya<span className="material-symbols-outlined text-base">chevron_right</span></Button></div>}
          </div>
        </>
      )}
    </div>
  );
}
