"use client";

import { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feeTypesApi.getDetail(params.id);
      setFeeType(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil detail jenis iuran");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await feeTypesApi.delete(params.id);
      router.push("/jenis-iuran");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus jenis iuran");
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <Link href={`/jenis-iuran/${params.id}`} className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary" aria-label="Kembali">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hapus Jenis Iuran</h1>
          <p className="text-sm text-text-secondary">Konfirmasi sebelum menghapus data.</p>
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {feeType ? (
        <div className="rounded-card border border-danger/20 bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger-bg text-danger">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Yakin ingin menghapus “{feeType.name}”?</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Jenis iuran sebesar <strong className="text-text-primary">{formatRupiah(feeType.amount)}</strong> akan dinonaktifkan dan tidak lagi muncul pada daftar aktif. Tindakan ini tidak menghapus tagihan lama yang sudah dibuat.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link href={`/jenis-iuran/${params.id}`}>
              <Button type="button" variant="secondary">Batal</Button>
            </Link>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              <span className="material-symbols-outlined text-base">delete</span>
              Ya, Hapus Jenis Iuran
            </Button>
          </div>
        </div>
      ) : (
        !error && <div className="rounded-card border border-border bg-surface p-6 text-sm text-text-secondary">Jenis iuran tidak ditemukan.</div>
      )}
    </div>
  );
}
