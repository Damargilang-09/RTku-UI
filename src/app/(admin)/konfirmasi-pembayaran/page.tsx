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
import type { ApprovalStatus, Payment, PaginationMeta } from "@/src/types";

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const PAGE_SIZE = 10;
const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

function getVisiblePages(current: number, total: number): number[] {
  const delta = 2;
  const range: number[] = [];
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    range.push(i);
  }
  if (range[0] > 1) range.unshift(1);
  if (range[range.length - 1] < total) range.push(total);
  return range;
}

export default function KonfirmasiPembayaranPage() {
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pageByTab, setPageByTab] = useState<Record<ApprovalStatus, number>>({
    pending: 1,
    approved: 1,
    rejected: 1,
  });
  const [metaByTab, setMetaByTab] = useState<
    Record<ApprovalStatus, PaginationMeta>
  >({
    pending: EMPTY_META,
    approved: EMPTY_META,
    rejected: EMPTY_META,
  });
  const page = pageByTab[tab];
  const meta = metaByTab[tab];
  const visiblePages = getVisiblePages(page, meta.totalPage);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openImage, setOpenImage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    paymentsApi
      .getAll({ status: tab, page, limit: PAGE_SIZE })
      .then((res) => {
        const items = res.data ?? [];
        const responseMeta = res.meta ?? {
          page,
          limit: PAGE_SIZE,
          totalData: items.length,
          totalPage: 1,
        };
        setPayments(items);
        setMetaByTab((prev) => ({ ...prev, [tab]: responseMeta }));
      })
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  function setPage(newPage: number) {
    setPageByTab((prev) => ({ ...prev, [tab]: newPage }));
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await paymentsApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyetujui pembayaran",
      );
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
      await paymentsApi.approve(id, {
        status: "rejected",
        rejectedReason: reason.trim(),
      });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menolak pembayaran",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Konfirmasi Pembayaran
        </h1>
        <p className="text-sm text-text-secondary">
          Tinjau dan verifikasi bukti pembayaran iuran warga.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-primary text-white"
                : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : payments?.length === 0 ? (
        <EmptyState
          icon="fact_check"
          title="Tidak ada data"
          description="Belum ada pembayaran pada status ini."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {payments?.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {p.userName}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {p.feeTypeName} &middot; {formatDateTime(p.paidAt)}
                  </p>
                  {p.paymentMethod && (
                    <p className="text-xs text-text-muted">{p.paymentMethod}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-text-primary">
                    {formatRupiah(p.amount)}
                  </span>
                  <StatusChip status={p.status} />
                </div>
              </div>

              {(p.paymentProof || p.paymentProof) && (
                <button
                  type="button"
                  onClick={() => setOpenImage(p.paymentProof ?? "")}
                  className="mt-3 block w-40 overflow-hidden rounded-xl border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.paymentProof ?? p.paymentProof ?? ""}
                    alt="Bukti pembayaran"
                    className="h-40 w-40 object-cover"
                  />
                </button>
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
                        <Button
                          variant="danger"
                          loading={busyId === p.id}
                          onClick={() => handleReject(p.id)}
                        >
                          Kirim Penolakan
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRejectingId(null);
                            setReason("");
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        loading={busyId === p.id}
                        onClick={() => handleApprove(p.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          check
                        </span>
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setRejectingId(p.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
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
      {!loading && payments?.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Menampilkan {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
            {meta.totalData} pembayaran
          </p>
          {meta.totalPage > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
                Sebelumnya
              </Button>
              {visiblePages.map((number, index) => (
                <div key={number} className="flex items-center gap-2">
                  {visiblePages[index - 1] &&
                    number - visiblePages[index - 1] > 1 && (
                      <span className="px-1 text-text-muted">…</span>
                    )}
                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold ${
                      page === number
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    {number}
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs"
                disabled={page === meta.totalPage}
                onClick={() => setPage(Math.min(meta.totalPage, page + 1))}
              >
                Berikutnya
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </Button>
            </div>
          )}
        </div>
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
