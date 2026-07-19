"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { paymentsApi } from "@/src/lib/api/payments";
import { ApiError } from "@/src/lib/api/axios";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { formatRupiah, formatDateTime } from "@/src/lib/utils";
import type { Payment } from "@/src/types";

function isPdfUrl(url: string) {
  const normalizedUrl = url.split("?")[0].toLowerCase();
  return normalizedUrl.endsWith(".pdf");
}

export default function KonfirmasiPembayaranDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openImage, setOpenImage] = useState<string | null>(null);

 const load = useCallback(() => {
  setLoading(true);
  setLoadError(null);
  paymentsApi
    .getDetail(params.id)
    .then((res) => setPayment(res.data))
    .catch((err) => {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengambil detail pembayaran",
      );
    })
    .finally(() => setLoading(false));
}, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove() {
    if (!payment) return;
    setBusy(true);
    setActionError(null);
    try {
      await paymentsApi.approve(payment.id, { status: "approved" });
      load();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menyetujui pembayaran",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!payment) return;
    if (!reason.trim()) {
      setActionError("Alasan penolakan wajib diisi");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await paymentsApi.approve(payment.id, {
        status: "rejected",
        rejectedReason: reason.trim(),
      });
      setRejecting(false);
      setReason("");
      load();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Gagal menolak pembayaran",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  if (loadError || !payment) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted">
          receipt_long
        </span>
        <p className="text-base font-bold text-text-primary">
          {loadError ?? "Pembayaran tidak ditemukan"}
        </p>
        <Link
          href="/konfirmasi-pembayaran"
          className="mt-2 text-sm font-semibold text-primary"
        >
          Kembali ke Konfirmasi Pembayaran
        </Link>
      </div>
    );
  }

  const approverName = payment.userName;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/konfirmasi-pembayaran")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary shadow-sm"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <p className="text-xs font-medium text-text-secondary">
            Konfirmasi Pembayaran
          </p>
          <h1 className="text-lg font-bold text-text-primary">
            Detail Pembayaran
          </h1>
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-text-primary">
              {payment.userName}
            </p>
            {payment.houseNumber && (
              <p className="text-xs text-text-secondary">
                Blok {payment.houseNumber}
              </p>
            )}
            <p className="mt-1 text-xs text-text-secondary">
              {payment.feeTypeName}
            </p>
          </div>
          <StatusChip status={payment.status} />
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs text-text-muted">Jumlah Pembayaran</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formatRupiah(payment.amount)}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-border pt-4 text-sm">
          <dt className="text-text-secondary">Metode Pembayaran</dt>
          <dd className="text-right font-medium text-text-primary">
            {payment.paymentMethod ?? "-"}
          </dd>

          <dt className="text-text-secondary">Tanggal Bayar</dt>
          <dd className="text-right font-medium text-text-primary">
            {formatDateTime(payment.paidAt)}
          </dd>

          <dt className="text-text-secondary">Diajukan</dt>
          <dd className="text-right font-medium text-text-primary">
            {formatDateTime(payment.createdAt ?? payment.paidAt)}
          </dd>

          {approverName && (
            <>
              <dt className="text-text-secondary">Diproses Oleh</dt>
              <dd className="text-right font-medium text-text-primary">
                {approverName}
              </dd>
            </>
          )}
        </dl>
      </Card>

      {payment.paymentProof && (
        <Card>
          <p className="mb-3 text-sm font-bold text-text-primary">
            Bukti Pembayaran
          </p>
          {isPdfUrl(payment.paymentProof) ? (
            <a
              href={payment.paymentProof}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-2 rounded-xl border border-border bg-surface-tertiary px-4 py-3 text-sm font-semibold text-primary hover:bg-border"
            >
              <span className="material-symbols-outlined text-xl">
                picture_as_pdf
              </span>
              Lihat Bukti PDF
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setOpenImage(payment.paymentProof ?? null)}
              className="block w-full overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.paymentProof}
                alt="Bukti pembayaran"
                className="max-h-96 w-full object-contain"
              />
            </button>
          )}
        </Card>
      )}

      {payment.status === "rejected" && payment.rejectedReason && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          <p className="font-semibold">Alasan Penolakan</p>
          <p className="mt-1">{payment.rejectedReason}</p>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      {payment.status === "pending" && (
        <Card className="flex flex-col gap-3">
          {rejecting ? (
            <>
              <Textarea
                placeholder="Alasan penolakan"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="danger" loading={busy} onClick={handleReject}>
                  Kirim Penolakan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                    setActionError(null);
                  }}
                >
                  Batal
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="success" loading={busy} onClick={handleApprove}>
                <span className="material-symbols-outlined text-base">
                  check
                </span>
                Setujui
              </Button>
              <Button variant="danger" onClick={() => setRejecting(true)}>
                <span className="material-symbols-outlined text-base">
                  close
                </span>
                Tolak
              </Button>
            </div>
          )}
        </Card>
      )}

      {openImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={openImage}
            alt="Bukti pembayaran diperbesar"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
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
