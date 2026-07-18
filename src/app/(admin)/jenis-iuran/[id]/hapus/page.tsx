"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Spinner } from "@/src/components/ui/Spinner";
import { formatRupiah } from "@/src/lib/utils";
import type { FeeType } from "@/src/types";

export default function HapusJenisIuranPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [feeType, setFeeType] = useState<FeeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    feeTypesApi
      .getDetail(params.id)
      .then((response) => {
        if (isActive) {
          setFeeType(response.data);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal mengambil detail jenis iuran",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [params.id]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      await feeTypesApi.delete(params.id);
      router.replace("/jenis-iuran");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Gagal menghapus jenis iuran",
      );
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={feeType ? `/jenis-iuran/${feeType.id}` : "/jenis-iuran"}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Hapus Jenis Iuran
          </h1>
          <p className="text-sm text-text-secondary">
            Pastikan jenis iuran yang dipilih sudah benar.
          </p>
        </div>
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
        <div className="flex flex-col gap-5 rounded-card border border-border bg-surface p-6">
          <div className="flex items-start gap-3 rounded-xl bg-danger-bg p-4 text-danger">
            <span className="material-symbols-outlined">warning</span>
            <div>
              <p className="font-semibold">Hapus jenis iuran ini?</p>
              <p className="mt-1 text-sm">
                Jenis iuran tidak akan tampil lagi dan tidak dapat digunakan
                untuk generate tagihan baru. Histori tagihan yang sudah dibuat
                tetap tersimpan.
              </p>
            </div>
          </div>

          <dl className="grid gap-4 rounded-xl border border-border p-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Nama Jenis Iuran
              </dt>
              <dd className="mt-1 font-semibold text-text-primary">
                {feeType.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Nominal
              </dt>
              <dd className="mt-1 font-semibold text-primary">
                {formatRupiah(feeType.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Periode Penagihan
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {feeType.billingPeriod === "monthly"
                  ? "Bulanan"
                  : "Sekali Bayar"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href={`/jenis-iuran/${feeType.id}`}>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={deleting}
              >
                Batal
              </Button>
            </Link>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              <span className="material-symbols-outlined text-base">
                delete
              </span>
              Hapus Jenis Iuran
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
