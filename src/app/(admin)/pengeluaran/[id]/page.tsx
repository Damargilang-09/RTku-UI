"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { expensesApi } from "@/src/lib/api/expenses";
import { ApiError } from "@/src/lib/api/axios";
import { Spinner } from "@/src/components/ui/Spinner";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { formatDate, formatDateTime, formatRupiah } from "@/src/lib/utils";
import type { Expense, ExpenseImage,  } from "@/src/types";

export default function DetailPengeluaranPage() {
  const params = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [images, setImages] = useState<ExpenseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openImage, setOpenImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await expensesApi.getDetail(params.id);
  setExpense(response.data);     
  setImages(response.data.expenses_images ?? []); 
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil detail pengeluaran");
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
      <div className="flex items-start gap-3">
        <Link href="/pengeluaran" className="rounded-lg p-2 text-text-secondary hover:bg-surface-tertiary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Detail Pengeluaran</h1>
          <p className="text-sm text-text-secondary">Informasi lengkap dan bukti pengeluaran yang dipilih.</p>
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {expense && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{expense.expenseCode}</p>
              <h2 className="mt-1 text-lg font-semibold text-text-primary">{expense.title}</h2>
            </div>
            <StatusChip status={expense.status} />
          </div>

          <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-b border-border p-5 lg:border-r">
              <dt className="text-xs uppercase text-text-muted">Nominal</dt>
              <dd className="mt-1 text-lg font-bold text-primary">{formatRupiah(expense.amount)}</dd>
            </div>
            <div className="border-b border-border p-5 lg:border-r">
              <dt className="text-xs uppercase text-text-muted">Tanggal Pengeluaran</dt>
              <dd className="mt-1 text-text-primary">{formatDate(expense.expenseDate)}</dd>
            </div>
            <div className="border-b border-border p-5">
              <dt className="text-xs uppercase text-text-muted">Dibuat</dt>
              <dd className="mt-1 text-text-primary">{formatDateTime(expense.createdAt)}</dd>
            </div>
            <div className="p-5 sm:col-span-2 lg:col-span-3">
              <dt className="text-xs uppercase text-text-muted">Deskripsi</dt>
              <dd className="mt-1 text-text-primary">{expense.description || "-"}</dd>
            </div>
          </dl>

          {expense.status === "rejected" && expense.rejectedReason && (
            <div className="border-t border-border p-5">
              <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
                Alasan penolakan: {expense.rejectedReason}
              </p>
            </div>
          )}

          <div className="border-t border-border p-5">
            <p className="text-xs uppercase text-text-muted">Bukti Pengeluaran</p>
            {expense.expenses_images && expense.expenses_images.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setOpenImage(img.attachment_url)}
                    className="aspect-square overflow-hidden rounded-xl border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.attachment_url}
                      alt="Bukti pengeluaran"
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">Tidak ada foto bukti pengeluaran.</p>
            )}
          </div>
        </div>
      )}

      {openImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={openImage} alt="Bukti pengeluaran diperbesar" className="max-h-full max-w-full rounded-xl object-contain" />
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
