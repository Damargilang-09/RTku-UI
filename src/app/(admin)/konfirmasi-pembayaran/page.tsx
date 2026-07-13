"use client";

import { useEffect, useState, useCallback } from "react";
import { paymentsApi } from "@/src/lib/api/payments";
import { ApiError } from "@/src/lib/api/axios";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDateTime } from "@/src/lib/utils";
import type { ApprovalStatus, Payment } from "@/src/types";

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default function KonfirmasiPembayaranPage() {
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    paymentsApi
      .getAll({ status: tab, limit: 10 })
      .then((res) => setPayments(res.data))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await paymentsApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyetujui pembayaran");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!reason.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await paymentsApi.approve(id, { status: "rejected", rejectedReason: reason.trim() });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menolak pembayaran");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Konfirmasi Pembayaran</h1>
        <p className="text-sm text-text-secondary">Tinjau dan verifikasi bukti pembayaran iuran warga.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.value ? "bg-primary text-white" : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <Spinner />
      ) : payments?.length === 0 ? (
        <EmptyState icon="fact_check" title="Tidak ada data" description="Belum ada pembayaran pada status ini." />
      ) : (
        <div className="flex flex-col gap-3">
          {payments?.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{p.userName}</p>
                  <p className="text-xs text-text-secondary">{p.feeTypeName} &middot; {formatDateTime(p.paidAt)}</p>
                  {p.paymentMethod && <p className="text-xs text-text-muted">{p.paymentMethod}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-text-primary">{formatRupiah(p.amount)}</span>
                  <StatusChip status={p.status} />
                </div>
              </div>

              {(p.paymentProof || p.payment_proof_img) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.paymentProof ?? p.payment_proof_img ?? ""}
                  alt="Bukti pembayaran"
                  className="mt-3 max-h-56 w-full rounded-xl border border-border object-contain"
                />
              )}

              {p.status === "pending" && (
                <div className="mt-4 flex flex-col gap-3">
                  {rejectingId === p.id ? (
                    <>
                      <Textarea
                        placeholder="Alasan penolakan"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button variant="danger" loading={busyId === p.id} onClick={() => handleReject(p.id)}>
                          Kirim Penolakan
                        </Button>
                        <Button variant="secondary" onClick={() => { setRejectingId(null); setReason(""); }}>
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="success" loading={busyId === p.id} onClick={() => handleApprove(p.id)}>
                        <span className="material-symbols-outlined text-base">check</span>
                        Setujui
                      </Button>
                      <Button variant="danger" onClick={() => setRejectingId(p.id)}>
                        <span className="material-symbols-outlined text-base">close</span>
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {p.status === "rejected" && p.rejectedReason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                  Alasan: {p.rejectedReason}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
