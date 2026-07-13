"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@/src/lib/api/payments";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah, formatDateTime } from "@/src/lib/utils";
import type { Payment } from "@/src/types";

export default function TransaksiPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi
      .getMyPayments({ limit: 50 })
      .then((res) => setPayments(res.data.formattedPayments))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-xl font-bold text-text-primary">Riwayat Transaksi</h1>

      {payments?.length === 0 ? (
        <EmptyState icon="receipt_long" title="Belum ada riwayat" description="Transaksi pembayaran kamu akan muncul di sini." />
      ) : (
        <div className="flex flex-col gap-3">
          {payments?.map((p) => (
            <Card key={p.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{p.feeTypeName ?? "Pembayaran Iuran"}</p>
                <p className="text-xs text-text-secondary">{formatDateTime(p.paidAt)}</p>
                {p.paymentMethod && <p className="text-xs text-text-muted">{p.paymentMethod}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-bold text-text-primary">{formatRupiah(p.amount)}</span>
                <StatusChip status={p.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
