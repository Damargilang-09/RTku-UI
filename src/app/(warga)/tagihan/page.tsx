"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { billsApi } from "@/src/lib/api/bills";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatDate, formatRupiah, monthName } from "@/src/lib/utils";
import type { Bill, BillStatus } from "@/src/types";

type BillFilter = "all" | "active" | "pending" | "paid";

const FILTERS: Array<{ value: BillFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Perlu Dibayar" },
  { value: "pending", label: "Diproses" },
  { value: "paid", label: "Lunas" },
];

function getPeriodLabel(bill: Bill) {
  if (bill.periodMonth && bill.periodYear) {
    return `${monthName(bill.periodMonth)} ${bill.periodYear}`;
  }

  return bill.feeType.billingPeriod === "once" ? "Sekali bayar" : "Periode tagihan";
}

function getDueInformation(bill: Bill) {
  if (bill.status === "paid" && bill.paidAt) {
    return {
      icon: "check_circle",
      label: `Dibayar ${formatDate(bill.paidAt)}`,
      className: "text-success",
    };
  }

  if (bill.status === "pending") {
    return {
      icon: "hourglass_top",
      label: "Bukti pembayaran sedang diperiksa",
      className: "text-warning",
    };
  }

  if (bill.status === "cancelled") {
    return {
      icon: "cancel",
      label: "Tagihan telah dibatalkan",
      className: "text-text-muted",
    };
  }

  const dueDate = new Date(bill.dueDate);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const difference = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);

  if (difference < 0 || bill.status === "overdue") {
    return {
      icon: "warning",
      label: `Terlambat ${Math.max(Math.abs(difference), 1)} hari`,
      className: "text-danger",
    };
  }

  if (difference === 0) {
    return {
      icon: "schedule",
      label: "Jatuh tempo hari ini",
      className: "text-danger",
    };
  }

  return {
    icon: "event",
    label: `Jatuh tempo ${formatDate(bill.dueDate)}`,
    className: difference <= 3 ? "text-warning" : "text-text-secondary",
  };
}

function matchesFilter(status: BillStatus, filter: BillFilter) {
  if (filter === "all") return true;
  if (filter === "active") return status === "unpaid" || status === "overdue";
  if (filter === "pending") return status === "pending";
  return status === "paid";
}

export default function TagihanPage() {
  const searchParams = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<BillFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billsApi
      .getMyBills()
      .then((res) => setBills(res.data))
      .catch(() => setError("Tagihan belum berhasil dimuat. Silakan coba lagi."))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const activeBills = bills.filter((bill) => bill.status === "unpaid" || bill.status === "overdue");

    return {
      totalDue: activeBills.reduce((total, bill) => total + Number(bill.amount), 0),
      activeCount: activeBills.length,
      pendingCount: bills.filter((bill) => bill.status === "pending").length,
    };
  }, [bills]);

  const filteredBills = useMemo(
    () => bills.filter((bill) => matchesFilter(bill.status, filter)),
    [bills, filter],
  );

  if (loading) return <Spinner className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6">
      <div>
        <p className="text-sm font-medium text-primary">Keuangan Warga</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-text-primary">Tagihan Saya</h1>
        <p className="mt-1 text-sm leading-5 text-text-secondary">
          Lihat tagihan aktif dan pantau proses pembayaranmu.
        </p>
      </div>

      {searchParams.get("success") === "1" && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success-bg px-4 py-3.5 text-success">
          <span className="material-symbols-outlined mt-0.5">check_circle</span>
          <div>
            <p className="text-sm font-semibold">Bukti pembayaran terkirim</p>
            <p className="mt-0.5 text-xs leading-5">
              Bendahara akan memeriksa pembayaranmu. Status tagihan berubah setelah disetujui.
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-0p-0 text-white shadow-[0_12px_30px_-12px_rgba(0,82,204,0.65)]">
        <div className="p-5 bg-primary rounded-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">
                Total perlu dibayar
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{formatRupiah(summary.totalDue)}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/15 pt-4">
            <div>
              <p className="text-xl font-bold">{summary.activeCount}</p>
              <p className="text-xs text-white/70">Perlu dibayar</p>
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="text-xl font-bold">{summary.pendingCount}</p>
              <p className="text-xs text-white/70">Sedang diperiksa</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                filter === item.value
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-secondary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger-bg px-4 py-4 text-sm text-danger">
          {error}
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={filter === "paid" ? "task_alt" : "receipt_long"}
          title={filter === "all" ? "Belum ada tagihan" : "Tidak ada tagihan pada kategori ini"}
          description={
            filter === "all"
              ? "Tagihan iuran yang dibuat bendahara akan muncul di sini."
              : "Pilih kategori lain untuk melihat tagihanmu."
          }
        />
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">
              {filter === "all" ? "Semua Tagihan" : FILTERS.find((item) => item.value === filter)?.label}
            </h2>
            <span className="text-xs font-medium text-text-muted">{filteredBills.length} tagihan</span>
          </div>

          {filteredBills.map((bill) => {
            const dueInformation = getDueInformation(bill);
            const canPay = bill.status === "unpaid" || bill.status === "overdue";

            return (
              <Link key={bill.id} href={`/tagihan/${bill.id}`} className="block">
                <Card className="p-0 transition-transform active:scale-[0.99]">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                            canPay ? "bg-primary-light text-primary" : "bg-surface-tertiary text-text-secondary",
                          )}
                        >
                          <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text-primary">{bill.feeType.name}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">{getPeriodLabel(bill)}</p>
                        </div>
                      </div>
                      <StatusChip status={bill.status} />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-text-muted">Nominal</p>
                        <p className="mt-0.5 text-xl font-bold tracking-tight text-text-primary">
                          {formatRupiah(bill.amount)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-surface-tertiary bg-surface-secondary px-4 py-3">
                    <div className={cn("flex min-w-0 items-center gap-2 text-xs font-medium", dueInformation.className)}>
                      <span className="material-symbols-outlined shrink-0 text-base">{dueInformation.icon}</span>
                      <span className="truncate">{dueInformation.label}</span>
                    </div>
                    {canPay && <span className="shrink-0 text-xs font-bold text-primary">Bayar</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
