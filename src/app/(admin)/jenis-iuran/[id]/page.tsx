"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Spinner } from "@/src/components/ui/Spinner";
import { formatRupiah } from "@/src/lib/utils";
import type { FeeType } from "@/src/types";

export default function DetailJenisIuranPage() {
  const params = useParams<{ id: string }>();
  const [feeType, setFeeType] = useState<FeeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feeTypesApi.getDetail(params.id);
      setFeeType(response.data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengambil detail jenis iuran",
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
            href="/jenis-iuran"
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Detail Jenis Iuran
            </h1>
            <p className="text-sm text-text-secondary">
              Informasi lengkap jenis iuran yang dipilih.
            </p>
          </div>
        </div>

        {feeType && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/jenis-iuran/${feeType.id}/edit`}>
              <Button variant="secondary">
                <span className="material-symbols-outlined text-base">
                  edit
                </span>
                Edit
              </Button>
            </Link>
            <Link href={`/jenis-iuran/${feeType.id}/hapus`}>
              <Button variant="danger">
                <span className="material-symbols-outlined text-base">
                  delete
                </span>
                Hapus
              </Button>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!error && !feeType && (
        <div className="rounded-card border border-border bg-surface p-6 text-sm text-text-secondary">
          Jenis iuran tidak ditemukan.
        </div>
      )}

      {feeType && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-surface-tertiary p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {feeType.name}
              </h2>
              <span className="mt-1 inline-flex rounded-full bg-info-bg px-2.5 py-1 text-xs font-semibold text-info">
                {feeType.billingPeriod === "monthly"
                  ? "Bulanan"
                  : "Sekali Bayar"}
              </span>
            </div>
          </div>

          <dl className="grid gap-0 sm:grid-cols-2">
            <div className="border-b border-surface-tertiary p-5 sm:border-r">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Nominal
              </dt>
              <dd className="mt-1 text-base font-semibold text-primary">
                {formatRupiah(feeType.amount)}
              </dd>
            </div>
            <div className="border-b border-surface-tertiary p-5">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Periode Penagihan
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {feeType.billingPeriod === "monthly"
                  ? "Ditagihkan setiap bulan"
                  : "Ditagihkan satu kali"}
              </dd>
            </div>
            <div className="border-b border-surface-tertiary p-5 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Penetapan Jatuh Tempo
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                Ditentukan oleh Bendahara saat melakukan generate tagihan warga.
              </dd>
            </div>
            <div className="p-5 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Deskripsi
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                {feeType.description || "Tidak ada deskripsi."}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
