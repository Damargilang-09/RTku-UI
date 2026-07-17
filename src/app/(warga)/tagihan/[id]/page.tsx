"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { cn, formatDate, formatDateTime, formatRupiah, monthName } from "@/src/lib/utils";
import type { Bill } from "@/src/types";

function getPeriodLabel(bill: Bill) {
  if (bill.periodMonth && bill.periodYear) {
    return `${monthName(bill.periodMonth)} ${bill.periodYear}`;
  }

  return bill.feeType.billingPeriod === "once" ? "Sekali bayar" : "-";
}


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

  useEffect(() => {
    let active = true;

    billsApi
      .getMyBillDetail(params.id)
      .then((res) => {
        if (active) setBill(res.data);
      })
      .catch(() => {
        if (active) setError("Detail tagihan belum berhasil dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setError("Bukti pembayaran wajib diunggah.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("PAYMENT_IMAGES", file);
      if (paymentMethod.trim()) formData.append("paymentMethod", paymentMethod.trim());

      await paymentsApi.create(params.id, formData);
      router.push("/tagihan?success=1");
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : "Gagal mengirim bukti pembayaran.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner className="min-h-[60vh]" />;

  if (!bill) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted">receipt_long</span>
        <p className="text-base font-bold text-text-primary">Tagihan tidak ditemukan</p>
        <p className="text-sm text-text-secondary">Tagihan mungkin sudah tidak tersedia.</p>
        <Link href="/tagihan" className="mt-2 text-sm font-semibold text-primary">
          Kembali ke Tagihan Saya
        </Link>
      </div>
    );
  }

  const canPay = bill.status === "unpaid" || bill.status === "overdue";
  const pendingPayment = bill.payments?.find((payment) => payment.status === "pending");
  const latestRejectedPayment = bill.payments?.find((payment) => payment.status === "rejected");

  return (
    <div className="flex flex-col gap-5 px-5 pt-5">
      <header className="flex items-center gap-3">
        <Link
          href="/tagihan"
          aria-label="Kembali ke daftar tagihan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary shadow-sm"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs font-medium text-text-secondary">Tagihan Saya</p>
          <h1 className="text-lg font-bold text-text-primary">Detail Tagihan</h1>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-bg px-4 py-3.5 text-sm text-danger">
          {error}
        </div>
      )}

      <Card className="overflow-hidden border-0 p-0 shadow-[0_10px_28px_-14px_rgba(15,23,42,0.35)]">
        <div className="bg-primary px-5 pb-6 pt-5 text-white rounded-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/65">{bill.billCode}</p>
              <h2 className="mt-2 truncate text-lg font-bold">{bill.feeType.name}</h2>
              <p className="mt-1 text-sm text-white/75">{getPeriodLabel(bill)}</p>
            </div>
            <StatusChip status={bill.status} />
          </div>

          <div className="mt-6">
            <p className="text-xs text-white/65">Total tagihan</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatRupiah(bill.amount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border px-5 py-4">
          <div className="pr-4">
            <div className="flex items-center gap-2 text-text-muted">
              <span className="material-symbols-outlined text-base">event</span>
              <span className="text-xs">Jatuh tempo</span>
            </div>
            <p className={cn("mt-1.5 text-sm font-bold", bill.status === "overdue" ? "text-danger" : "text-text-primary")}>
              {formatDate(bill.dueDate)}
            </p>
          </div>
          <div className="pl-4">
            <div className="flex items-center gap-2 text-text-muted">
              <span className="material-symbols-outlined text-base">autorenew</span>
              <span className="text-xs">Jenis tagihan</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-text-primary">
              {bill.feeType.billingPeriod === "monthly" ? "Bulanan" : "Sekali bayar"}
            </p>
          </div>
        </div>
      </Card>

      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-bg px-4 py-4 text-warning">
          <span className="material-symbols-outlined mt-0.5">hourglass_top</span>
          <div>
            <p className="text-sm font-bold">Pembayaran sedang diperiksa</p>
            <p className="mt-1 text-xs leading-5">
              Bukti yang kamu kirim pada {formatDateTime(pendingPayment.createdAt ?? pendingPayment.paidAt)} sedang diverifikasi bendahara.
            </p>
          </div>
        </div>
      )}

      {canPay && latestRejectedPayment?.rejectedReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-bg px-4 py-4 text-danger">
          <span className="material-symbols-outlined mt-0.5">error</span>
          <div>
            <p className="text-sm font-bold">Pembayaran sebelumnya ditolak</p>
            <p className="mt-1 text-xs leading-5">{latestRejectedPayment.rejectedReason}</p>
            <p className="mt-2 text-xs font-semibold">Silakan unggah bukti pembayaran yang sesuai.</p>
          </div>
        </div>
      )}

      {bill.payments && bill.payments.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary">Riwayat Pembayaran</h3>
            <span className="text-xs font-medium text-text-muted">{bill.payments.length} pengajuan</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {bill.payments.map((payment, index) => (
              <div
                key={payment.id}
                className={cn(
                  "flex items-start justify-between gap-3 px-4 py-4",
                  index !== bill.payments!.length - 1 && "border-b border-surface-tertiary",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary text-text-secondary">
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary">{formatRupiah(payment.amount)}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {formatDateTime(payment.createdAt ?? payment.paidAt)}
                    </p>
                    {payment.paymentMethod && (
                      <p className="mt-1 text-xs text-text-muted">Melalui {payment.paymentMethod}</p>
                    )}
                    {payment.status === "rejected" && payment.rejectedReason && (
                      <p className="mt-2 text-xs leading-5 text-danger">{payment.rejectedReason}</p>
                    )}
                  </div>
                </div>
                <StatusChip status={payment.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {canPay && !pendingPayment && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
          <div>
            <h3 className="text-base font-bold text-text-primary">Bayar Tagihan</h3>
            <p className="mt-1 text-sm leading-5 text-text-secondary">
              Transfer sesuai nominal tagihan, lalu unggah foto bukti pembayaran.
            </p>
          </div>

          <Card className="flex items-start gap-3 bg-info-bg p-4 text-info">
            <span className="material-symbols-outlined mt-0.5">info</span>
            <p className="text-xs leading-5">
              Pastikan nominal dan bukti transfer terlihat jelas agar proses verifikasi lebih cepat.
            </p>
          </Card>

          <Input
            label="Metode Pembayaran (opsional)"
            placeholder="Contoh: Transfer BCA"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">Foto Bukti Transfer</label>
            <label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-6 text-center transition-colors active:bg-surface-tertiary">
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Pratinjau bukti pembayaran"
                    className="max-h-56 w-full rounded-xl object-contain"
                  />
                  <span className="mt-3 text-xs font-semibold text-primary">Ketuk untuk mengganti foto</span>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-text-primary">Unggah bukti pembayaran</p>
                  <p className="mt-1 text-xs text-text-secondary">PNG, JPG, atau WEBP</p>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {file && <p className="truncate text-xs text-text-muted">File: {file.name}</p>}
          </div>

          <Button type="submit" fullWidth loading={submitting} className="py-3.5">
            <span className="material-symbols-outlined text-lg">send</span>
            Kirim Bukti Pembayaran
          </Button>
        </form>
      )}

      {bill.status === "paid" && (
        <div className="flex flex-col items-center rounded-2xl border border-success/20 bg-success-bg px-5 py-6 text-center text-success">
          <span className="material-symbols-outlined text-4xl">verified</span>
          <p className="mt-2 text-base font-bold">Tagihan sudah lunas</p>
          <p className="mt-1 text-sm">Terima kasih, pembayaranmu sudah disetujui.</p>
        </div>
      )}
    </div>
  );
}
