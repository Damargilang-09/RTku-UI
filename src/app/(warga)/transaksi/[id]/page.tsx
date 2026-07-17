"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { paymentsApi } from "@/src/lib/api/payments";
import { ApiError } from "@/src/lib/api/axios";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { formatRupiah, formatDateTime } from "@/src/lib/utils";
import type { Payment } from "@/src/types";

export default function DetailTransaksiPage() {
  const params = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openImage, setOpenImage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.getDetail(params.id);
      setPayment(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengambil detail transaksi");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <div className="flex items-center gap-2">
        <Link href="/transaksi" className="text-text-secondary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-text-primary">Detail Transaksi</h1>w
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {payment && (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {payment.feeTypeName ?? "Pembayaran Iuran"}
              </p>
              <StatusChip status={payment.status} />
            </div>

            <p className="text-2xl font-bold text-primary">{formatRupiah(payment.amount)}</p>

            <div className="mt-4 flex flex-col gap-2 border-t border-surface-tertiary pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Tanggal Bayar</span>
                <span className="font-medium text-text-primary">{formatDateTime(payment.paidAt)}</span>
              </div>
              {payment.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Metode Pembayaran</span>
                  <span className="font-medium text-text-primary">{payment.paymentMethod}</span>
                </div>
              )}
              {payment.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Diverifikasi oleh</span>
                  <span className="font-medium text-text-primary">{payment.approvedBy}</span>
                </div>
              )}
            </div>

            {payment.status === "rejected" && payment.rejectedReason && (
              <p className="mt-4 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                Alasan penolakan: {payment.rejectedReason}
              </p>
            )}
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">Bukti Pembayaran</h2>
            {payment.paymentProof ? (
              <button
                type="button"
                onClick={() => setOpenImage(true)}
                className="block w-full overflow-hidden rounded-card border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payment.paymentProof}
                  alt="Bukti pembayaran"
                  className="max-h-80 w-full object-contain"
                />
              </button>
            ) : (
              <Card className="text-center text-sm text-text-secondary">Tidak ada bukti pembayaran.</Card>
            )}
          </div>
        </>
      )}

      {openImage && payment?.paymentProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpenImage(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payment.paymentProof} alt="Bukti pembayaran diperbesar" className="max-h-full max-w-full rounded-xl object-contain" />
          <button
            type="button"
            onClick={() => setOpenImage(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}