"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { expensesApi } from "@/src/lib/api/expenses";
import { ApiError } from "@/src/lib/api/axios";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Input";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDate } from "@/src/lib/utils";
import type { ApprovalStatus, Expense } from "@/src/types";

const TABS: { value: ApprovalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default function PengeluaranPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    expensesApi
      .getAll({ status: tab, limit: 50 })
      .then((res) => setExpenses(res.data.formattedExpenses))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await expensesApi.approve(id, { status: "approved" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyetujui pengeluaran");
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
      await expensesApi.approve(id, { status: "rejected", rejectedReason: reason.trim() });
      setRejectingId(null);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menolak pengeluaran");
    } finally {
      setBusyId(null);
    }
  }

  const canApprove = user?.role === "ketuaRT";
  const canCreate = user?.role === "bendahara";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pengeluaran</h1>
          <p className="text-sm text-text-secondary">Pengajuan dan riwayat pengeluaran kas RT.</p>
        </div>
        {canCreate && (
          <Link href="/pengeluaran/baru">
            <Button>
              <span className="material-symbols-outlined text-base">add</span>
              Input Pengeluaran
            </Button>
          </Link>
        )}
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
      ) : expenses?.length === 0 ? (
        <EmptyState icon="receipt_long" title="Tidak ada data" description="Belum ada pengeluaran pada status ini." />
      ) : (
        <div className="flex flex-col gap-3">
          {expenses?.map((exp) => (
            <Card key={exp.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{exp.title}</p>
                  <p className="text-xs text-text-secondary">{exp.expenseCode} &middot; {formatDate(exp.expenseDate)}</p>
                  {exp.description && <p className="mt-1 text-xs text-text-muted">{exp.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-text-primary">{formatRupiah(exp.amount)}</span>
                  <StatusChip status={exp.status} />
                </div>
              </div>

              {exp.images && exp.images.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {exp.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.attachment_url}
                      alt="Bukti pengeluaran"
                      className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ))}
                </div>
              )}

              {canApprove && exp.status === "pending" && (
                <div className="mt-4 flex flex-col gap-3">
                  {rejectingId === exp.id ? (
                    <>
                      <Textarea placeholder="Alasan penolakan" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button variant="danger" loading={busyId === exp.id} onClick={() => handleReject(exp.id)}>
                          Kirim Penolakan
                        </Button>
                        <Button variant="secondary" onClick={() => { setRejectingId(null); setReason(""); }}>
                          Batal
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="success" loading={busyId === exp.id} onClick={() => handleApprove(exp.id)}>
                        <span className="material-symbols-outlined text-base">check</span>
                        Setujui
                      </Button>
                      <Button variant="danger" onClick={() => setRejectingId(exp.id)}>
                        <span className="material-symbols-outlined text-base">close</span>
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {exp.status === "rejected" && exp.rejectedReason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">Alasan: {exp.rejectedReason}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
