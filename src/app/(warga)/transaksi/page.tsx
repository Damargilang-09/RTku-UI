"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { paymentsApi } from "@/src/lib/api/payments";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { formatRupiah, formatDateTime } from "@/src/lib/utils";
import type { PaginationMeta, Payment } from "@/src/types";
import { Button } from "@/src/components/ui/Button";

const PAGE_SIZE = 10;

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

export default function TransaksiPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    paymentsApi
      .getMyPayments({ page, limit: PAGE_SIZE })
      .then((res) => {
        setPayments(res.data);
        setMeta(
          res.meta ?? { ...EMPTY_META, page, totalData: res.data.length },
        );
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPage = Math.max(1, meta.totalPage ?? 1);
  const pageNumbers = Array.from({ length: totalPage }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPage || Math.abs(n - meta.page) <= 1,
  );

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-xl font-bold text-text-primary">Riwayat Transaksi</h1>

      {payments?.length === 0 ? (
        <EmptyState
          icon="receipt_long"
          title="Belum ada riwayat"
          description="Transaksi pembayaran kamu akan muncul di sini."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {payments?.map((p) => (
              <Link key={p.id} href={`/transaksi/${p.id}`}>
                <Card className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {p.feeTypeName ?? "Pembayaran Iuran"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatDateTime(p.paidAt)}
                    </p>
                    {p.paymentMethod && (
                      <p className="text-xs text-text-muted">
                        {p.paymentMethod}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      {formatRupiah(p.amount)}
                    </span>
                    <StatusChip status={p.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="fixed bottom-16  left-0 right-0  flex-col gap-5   px-4 py-3">
            <p className="flex justify-center pb-4 text-xs text-text-secondary">
              Menampilkan {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
              {meta.totalData} transaksi
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <Button
                variant="secondary"
                className="h-9 px-3 py-0 text-xs"
                disabled={meta.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
                Sebelumnya
              </Button>

              {pageNumbers.map((pageNumber, index) => {
                const previousPageNumber = pageNumbers[index - 1];
                const showEllipsis =
                  previousPageNumber && pageNumber - previousPageNumber > 1;

                return (
                  <div key={pageNumber} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="px-1 text-sm text-text-muted">...</span>
                    )}
                    <Button
                      variant={
                        pageNumber === meta.page ? "primary" : "secondary"
                      }
                      className="h-9 min-w-9 px-3 py-0 text-xs"
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="secondary"
                className="h-9 px-3 py-0 text-xs"
                disabled={meta.page >= totalPage}
                onClick={() =>
                  setPage((current) => Math.min(totalPage, current + 1))
                }
              >
                Berikutnya
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
