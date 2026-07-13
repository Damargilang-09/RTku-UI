"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { billsApi } from "@/src/lib/api/bills";
import { paymentsApi } from "@/src/lib/api/payments";
import { ApiError } from "@/src/lib/api/axios";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { formatRupiah, formatDate, formatDateTime, monthName } from "@/src/lib/utils";
import type { Bill } from "@/src/types";

export default function TagihanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    billsApi
      .getMyBillDetail(params.id)
      .then((res) => setBill(res.data))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Bukti pembayaran wajib diunggah");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("PAYMENT_IMAGES", file);
      if (paymentMethod) formData.append("paymentMethod", paymentMethod);
      await paymentsApi.create(params.id, formData);
      router.push("/tagihan?success=1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim bukti pembayaran");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;
  if (!bill) return <p className="px-5 pt-6 text-sm text-text-secondary">Tagihan tidak ditemukan.</p>;

  const canPay = bill.status === "unpaid" || bill.status === "overdue";

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <div className="flex items-center gap-2">
        <Link href="/tagihan" className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-text-primary">Detail Tagihan</h1>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {bill.billCode}
          </p>
          <StatusChip status={bill.status} />
        </div>
        <h2 className="text-base font-semibold text-text-primary">{bill.feeType.name}</h2>
        <p className="text-sm text-text-secondary">
          {bill.periodMonth && bill.periodYear ? `${monthName(bill.periodMonth)} ${bill.periodYear}` : "-"}
        </p>
        <p className="mt-3 text-2xl font-bold text-primary">{formatRupiah(bill.amount)}</p>
        <p className="mt-1 text-xs text-text-secondary">Jatuh tempo {formatDate(bill.dueDate)}</p>
      </Card>

      {bill.payments && bill.payments.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Riwayat Pengajuan Pembayaran</h3>
          <div className="flex flex-col gap-2">
            {bill.payments.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-sm font-medium text-text-primary">{formatRupiah(p.amount)}</p>
                  <p className="text-xs text-text-secondary">{formatDateTime(p.createdAt ?? p.paidAt)}</p>
                  {p.status === "rejected" && p.rejectedReason && (
                    <p className="mt-1 text-xs text-danger">Alasan: {p.rejectedReason}</p>
                  )}
                </div>
                <StatusChip status={p.status} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {canPay && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-primary">Unggah Bukti Pembayaran</h3>

          {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

          <Input
            label="Metode Pembayaran (opsional)"
            placeholder="Contoh: Transfer BCA"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Foto Bukti Transfer</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-tertiary px-4 py-8 text-center">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview bukti pembayaran" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-text-muted">upload</span>
                  <span className="text-sm text-text-secondary">Ketuk untuk memilih foto</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <Button type="submit" fullWidth loading={submitting}>
            Kirim Bukti Pembayaran
          </Button>
        </form>
      )}
    </div>
  );
}
