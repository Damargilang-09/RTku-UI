"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { billsApi } from "@/src/lib/api/bills";
import { paymentsApi } from "@/src/lib/api/payments";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah, formatDate } from "@/src/lib/utils";
import type { Bill, Payment } from "@/src/types";

export default function BerandaPage() {
  const user = useAuthStore((s) => s.user);
  const [bills, setBills] = useState<Bill[]>([]);
  const [recent, setRecent] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([billsApi.getMyBills({ limit: 10 }), paymentsApi.getMyPayments({ limit: 5 })])
      .then(([billsRes, paymentsRes]) => {
        setBills(billsRes.data);
        setRecent(paymentsRes.data.formattedPayments);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const unpaidBills = bills.filter((b) => b.status === "unpaid" || b.status === "overdue");
  const totalDue = unpaidBills.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <div>
        <p className="text-sm text-text-secondary">Selamat datang,</p>
        <h1 className="text-xl font-bold text-text-primary">{user?.name}</h1>
      </div>

      <Card className="bg-primary text-white">
        <p className="text-sm text-white/80">Total Tagihan Belum Dibayar</p>
        <p className="mt-1 text-3xl font-bold">{formatRupiah(totalDue)}</p>
        <p className="mt-1 text-xs text-white/70">
          {unpaidBills.length} tagihan aktif
        </p>
        <Link
          href="/tagihan"
          className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary"
        >
          Bayar Sekarang
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Riwayat Terakhir</h2>
          <Link href="/transaksi" className="text-sm font-medium text-primary">
            Lihat semua
          </Link>
        </div>

        {recent?.length === 0 ? (
          <EmptyState icon="receipt_long" title="Belum ada transaksi" description="Riwayat pembayaran kamu akan muncul di sini." />
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {recent?.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-3.5 ${idx !== recent.length - 1 ? "border-b border-surface-tertiary" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.feeTypeName ?? "Pembayaran"}</p>
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
