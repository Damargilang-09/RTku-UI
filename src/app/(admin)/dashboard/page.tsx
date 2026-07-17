"use client";

import { useEffect, useState } from "react";
import { reportsApi } from "@/src/lib/api/reports";
import { paymentsApi } from "@/src/lib/api/payments";
import { incomeApi } from "@/src/lib/api/income";
import { expensesApi } from "@/src/lib/api/expenses";
import { useAuthStore } from "@/src/lib/auth-store";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  formatRupiah,
  formatDate,
  monthName,
  ROLE_LABEL,
} from "@/src/lib/utils";
import type {
  DashboardSummary,
  Payment,
  Income,
  Expense,
  Report,
} from "@/src/types";

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [pendingIncome, setPendingIncome] = useState<Income[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [openReports, setOpenReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const isBendahara = user?.role === "bendahara";
  const isKetuaRT = user?.role === "ketuaRT";

  useEffect(() => {
    const tasks: Promise<void>[] = [
      reportsApi.dashboard().then((res) => setSummary(res.data)),
    ];

    if (isBendahara) {
      tasks.push(
        paymentsApi
          .getAll({ status: "pending", limit: 5 })
          .then((res) => setPendingPayments(res.data))
          .catch(() => undefined),
      );
    }

    if (isKetuaRT) {
      tasks.push(
        incomeApi
          .getAll({ status: "pending", limit: 5 })
          .then((res) => setPendingIncome(res.data ?? []))
          .catch(() => undefined),
        expensesApi
          .getAll({ status: "pending", limit: 5 })
          .then((res) => setPendingExpenses(res.data ?? []))
          .catch(() => undefined),
        reportsApi
          .getAll({ status: "open", limit: 5 })
          .then((res) => setOpenReports(res.data ?? []))
          .catch(() => undefined),
      );
    }

    Promise.all(tasks).finally(() => setLoading(false));
  }, [isBendahara, isKetuaRT]);

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          {user ? `${ROLE_LABEL[user.role]} · ${user.name}` : ""}
          {summary
            ? ` · Periode ${monthName(summary.period.month)} ${summary.period.year}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className=" text-text-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Saldo Kas RT</span>
            <span className="material-symbols-outlined">
              account_balance_wallet
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {formatRupiah(summary?.saldo ?? 0)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Pemasukan Bulan Ini
            </span>
            <span className="material-symbols-outlined text-secondary">
              trending_up
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {formatRupiah(summary?.income ?? 0)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Pengeluaran Bulan Ini
            </span>
            <span className="material-symbols-outlined text-danger">
              trending_down
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {formatRupiah(summary?.expenses ?? 0)}
          </p>
        </Card>
      </div>

      {isBendahara && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-text-primary">
            Pembayaran Menunggu Verifikasi
          </h2>
          {pendingPayments?.length === 0 ? (
            <EmptyState
              icon="fact_check"
              title="Tidak ada pembayaran menunggu"
              description="Semua pembayaran sudah diverifikasi."
            />
          ) : (
            <div className="overflow-hidden rounded-card border border-border bg-surface">
              {pendingPayments?.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3.5 ${idx !== pendingPayments.length - 1 ? "border-b border-surface-tertiary" : ""}`}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {p.userName} &middot; {p.feeTypeName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDate(p.paidAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {formatRupiah(p.amount)}
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isKetuaRT && (
        <>
          <div>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              Pemasukan Menunggu Verifikasi
            </h2>
            {pendingIncome.length === 0 ? (
              <EmptyState
                icon="trending_up"
                title="Tidak ada pemasukan menunggu"
                description="Semua pemasukan sudah diverifikasi."
              />
            ) : (
              <div className="overflow-hidden rounded-card border border-border bg-surface">
                {pendingIncome.map((inc, idx) => (
                  <div
                    key={inc.id}
                    className={`flex items-center justify-between px-4 py-3.5 ${idx !== pendingIncome.length - 1 ? "border-b border-surface-tertiary" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {inc.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {inc.income_code} &middot; {formatDate(inc.income_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatRupiah(inc.amount)}
                      </span>
                      <StatusChip status={inc.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              Pengeluaran Menunggu Verifikasi
            </h2>
            {pendingExpenses.length === 0 ? (
              <EmptyState
                icon="trending_down"
                title="Tidak ada pengeluaran menunggu"
                description="Semua pengeluaran sudah diverifikasi."
              />
            ) : (
              <div className="overflow-hidden rounded-card border border-border bg-surface">
                {pendingExpenses.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className={`flex items-center justify-between px-4 py-3.5 ${idx !== pendingExpenses.length - 1 ? "border-b border-surface-tertiary" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {exp.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {exp.expenseCode} &middot; {formatDate(exp.expenseDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatRupiah(exp.amount)}
                      </span>
                      <StatusChip status={exp.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold text-text-primary">
              Laporan Menunggu Verifikasi
            </h2>
            {openReports.length === 0 ? (
              <EmptyState
                icon="fact_check"
                title="Tidak ada laporan menunggu"
                description="Semua laporan bulanan sudah diverifikasi."
              />
            ) : (
              <div className="overflow-hidden rounded-card border border-border bg-surface">
                {openReports.map((rep, idx) => (
                  <div
                    key={rep.id}
                    className={`flex items-center justify-between px-4 py-3.5 ${idx !== openReports.length - 1 ? "border-b border-surface-tertiary" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Laporan {monthName(rep.period_month)} {rep.period_year}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {rep.users_reports_created_byTousers?.name ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatRupiah(rep.closing_balance)}
                      </span>
                      <StatusChip status={rep.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
