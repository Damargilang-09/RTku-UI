"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { billsApi } from "@/src/lib/api/bills";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah, formatDate, monthName } from "@/src/lib/utils";
import type { Bill } from "@/src/types";

export default function TagihanPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billsApi
      .getMyBills({ limit: 50 })
      .then((res) => setBills(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-xl font-bold text-text-primary">Tagihan Saya</h1>

      {bills?.length === 0 ? (
        <EmptyState icon="receipt_long" title="Belum ada tagihan" description="Tagihan iuran kamu akan muncul di sini." />
      ) : (
        <div className="flex flex-col gap-3">
          {bills?.map((bill) => (
            <Link key={bill.id} href={`/tagihan/${bill.id}`}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{bill.feeType.name}</p>
                  <p className="text-xs text-text-secondary">
                    {bill.periodMonth && bill.periodYear
                      ? `${monthName(bill.periodMonth)} ${bill.periodYear}`
                      : `Jatuh tempo ${formatDate(bill.dueDate)}`}
                  </p>
                  <p className="mt-1 text-base font-bold text-text-primary">{formatRupiah(bill.amount)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusChip status={bill.status} />
                  <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
