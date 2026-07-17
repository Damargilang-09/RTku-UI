"use client";

import { useEffect, useState } from "react";
import { reportsApi } from "@/src/lib/api/reports";
import { paymentsApi } from "@/src/lib/api/payments";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah, formatDate, monthName, ROLE_LABEL } from "@/src/lib/utils";
import type { DashboardSummary, Payment } from "@/src/types";

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pending, setPending] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard(),
      paymentsApi.getAll({ status: "pending", limit: 5 }).catch(() => null),
    ])
      .then(([summaryRes, paymentsRes]) => {
        setSummary(summaryRes.data);
        if (paymentsRes) setPending(paymentsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {user ? `${ROLE_LABEL[user.role]} · ${user.name}` : ""}
          {summary ? ` · Periode ${monthName(summary.period.month)} ${summary.period.year}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className=" text-text-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Saldo Kas RT</span>
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatRupiah(summary?.saldo ?? 0)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Pemasukan Bulan Ini</span>
            <span className="material-symbols-outlined text-secondary">trending_up</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{formatRupiah(summary?.income ?? 0)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Pengeluaran Bulan Ini</span>
            <span className="material-symbols-outlined text-danger">trending_down</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">{formatRupiah(summary?.expenses ?? 0)}</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-text-primary">Pembayaran Menunggu Verifikasi</h2>
        {pending?.length === 0 ? (
          <EmptyState icon="fact_check" title="Tidak ada pembayaran menunggu" description="Semua pembayaran sudah diverifikasi." />
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {pending?.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-3.5 ${idx !== pending.length - 1 ? "border-b border-surface-tertiary" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.userName} &middot; {p.feeTypeName}</p>
                  <p className="text-xs text-text-secondary">{formatDate(p.paidAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{formatRupiah(p.amount)}</span>
                  <StatusChip status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
