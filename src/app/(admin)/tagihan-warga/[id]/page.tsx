"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { billsApi } from "@/src/lib/api/bills";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Spinner } from "@/src/components/ui/Spinner";
import { StatusChip } from "@/src/components/ui/StatusChip";
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  monthName,
} from "@/src/lib/utils";
import type { Bill } from "@/src/types";

export default function DetailTagihanWargaPage() {
  const params = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await billsApi.getBillDetail(params.id);
      setBill(response.data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengambil detail tagihan",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);
  useEffect(() => {
    load();
  }, [load]);
  if (loading) return <Spinner />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/tagihan-warga"
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Detail Tagihan Warga
            </h1>
            <p className="text-sm text-text-secondary">
              Informasi lengkap tagihan yang dipilih.
            </p>
          </div>
        </div>
        {bill?.batchId &&
          (bill.status === "unpaid" || bill.status === "overdue") && (
            <Link
              href={`/tagihan-warga/cancel-batch?batchId=${encodeURIComponent(bill.batchId)}`}
            >
              <Button variant="danger">
                <span className="material-symbols-outlined text-base">
                  cancel
                </span>
                Batalkan Batch
              </Button>
            </Link>
          )}
      </div>
      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {bill && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {bill.billCode}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-text-primary">
                {bill.feeType.name}
              </h2>
            </div>
            <StatusChip status={bill.status} />
          </div>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-b border-border p-5 lg:border-r">
              <dt className="text-xs uppercase text-text-muted">Warga</dt>
              <dd className="mt-1 font-semibold text-text-primary">
                {bill.user?.name ?? "-"}
              </dd>
              <dd className="text-sm text-text-secondary">
                {bill.user?.email ?? "-"} · Rumah{" "}
                {bill.user?.houseNumber ?? "-"}
              </dd>
            </div>
            <div className="border-b border-border p-5 lg:border-r">
              <dt className="text-xs uppercase text-text-muted">Nominal</dt>
              <dd className="mt-1 text-lg font-bold text-primary">
                {formatRupiah(bill.amount)}
              </dd>
            </div>
            <div className="border-b border-border p-5">
              <dt className="text-xs uppercase text-text-muted">Periode</dt>
              <dd className="mt-1 text-text-primary">
                {bill.periodMonth && bill.periodYear
                  ? `${monthName(bill.periodMonth)} ${bill.periodYear}`
                  : "Sekali bayar"}
              </dd>
            </div>
            <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
              <dt className="text-xs uppercase text-text-muted">Jatuh Tempo</dt>
              <dd className="mt-1 text-text-primary">
                {formatDate(bill.dueDate)}
              </dd>
            </div>
            <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
              <dt className="text-xs uppercase text-text-muted">Batch ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-text-primary">
                {bill.batchId ?? "-"}
              </dd>
            </div>
            <div className="p-5">
              <dt className="text-xs uppercase text-text-muted">Dibuat</dt>
              <dd className="mt-1 text-text-primary">
                {formatDateTime(bill.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
