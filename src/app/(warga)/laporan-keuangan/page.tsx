"use client";

import { useCallback, useEffect, useState } from "react";
import { reportsApi } from "@/src/lib/api/reports";
import { expensesApi } from "@/src/lib/api/expenses";
import { incomeApi } from "@/src/lib/api/income";
import { Card } from "@/src/components/ui/Card";
import { StatusChip } from "@/src/components/ui/StatusChip";
import { Button } from "@/src/components/ui/Button";
import { Spinner } from "@/src/components/ui/Spinner";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { cn, formatRupiah, formatDate, monthName } from "@/src/lib/utils";
import { isPdfUrl } from "@/src/lib/file-utils";
import Link from "next/link";
import type { Expense, Income, PaginationMeta, Report } from "@/src/types";

const PAGE_SIZE = 10;
const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  totalData: 0,
  totalPage: 1,
};

type Section = "laporan" | "pengeluaran" | "pemasukan";

const SECTIONS: { value: Section; label: string; icon: string }[] = [
  { value: "laporan", label: "Laporan", icon: "summarize" },
  { value: "pengeluaran", label: "Pengeluaran", icon: "receipt_long" },
  { value: "pemasukan", label: "Pemasukan Lain", icon: "trending_up" },
];

const REPORT_STATUS_TABS = [
  { value: "open", label: "Terbuka" },
  { value: "closed", label: "Ditutup" },
  { value: "failed", label: "Gagal" },
];

const APPROVAL_STATUS_TABS = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

// ---------------------------------------------------------------------------
// Komponen generik: daftar dengan filter status + pagination sendiri.
// Dipakai ulang untuk ketiga jenis data (laporan/pengeluaran/pemasukan)
// supaya masing-masing benar-benar independen (tab & halamannya sendiri).
// ---------------------------------------------------------------------------
interface StatusFilteredListProps<T> {
  statusTabs: { value: string; label: string }[];
  fetchPage: (
    status: string,
    page: number,
    limit: number,
  ) => Promise<{ data: T[]; meta?: PaginationMeta }>;
  renderItem: (item: T) => React.ReactNode;
  itemLabel: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDescription: string;
}

function StatusFilteredList<T extends { id: string }>({
  statusTabs,
  fetchPage,
  renderItem,
  itemLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: StatusFilteredListProps<T>) {
  const [status, setStatus] = useState(statusTabs[0].value);
  const [items, setItems] = useState<T[]>([]);
  const [pageByStatus, setPageByStatus] = useState<Record<string, number>>(
    Object.fromEntries(statusTabs.map((t) => [t.value, 1])),
  );
  const [metaByStatus, setMetaByStatus] = useState<
    Record<string, PaginationMeta>
  >(Object.fromEntries(statusTabs.map((t) => [t.value, EMPTY_META])));
  const page = pageByStatus[status];
  const meta = metaByStatus[status];
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchPage(status, page, PAGE_SIZE)
      .then((res) => {
        const data = res.data ?? [];
        const responseMeta = res.meta ?? {
          page,
          limit: PAGE_SIZE,
          totalData: data.length,
          totalPage: 1,
        };
        setItems(data);
        setMetaByStatus((prev) => ({ ...prev, [status]: responseMeta }));
      })
      .finally(() => setLoading(false));
  }, [status, page, fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  function setPage(newPage: number) {
    setPageByStatus((prev) => ({ ...prev, [status]: newPage }));
  }

  const totalPage = Math.max(1, meta.totalPage ?? 1);
  const pageNumbers = Array.from({ length: totalPage }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPage || Math.abs(n - page) <= 1,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto">
        {statusTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              status === t.value
                ? "bg-primary text-white"
                : "bg-surface-tertiary text-text-secondary hover:bg-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => renderItem(item))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface px-4 py-3">
          <p className="text-xs text-text-secondary">
            Menampilkan {(meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.totalData)} dari{" "}
            {meta.totalData} {itemLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="h-9 px-3 py-0 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
              Sebelumnya
            </Button>

            {pageNumbers.map((n, index) => {
              const prev = pageNumbers[index - 1];
              const showEllipsis = prev && n - prev > 1;
              return (
                <div key={n} className="flex items-center gap-2">
                  {showEllipsis && (
                    <span className="px-1 text-xs text-text-muted">...</span>
                  )}
                  <Button
                    variant={n === page ? "primary" : "secondary"}
                    className="h-9 min-w-9 px-3 py-0 text-xs"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                </div>
              );
            })}

            <Button
              variant="secondary"
              className="h-9 px-3 py-0 text-xs"
              disabled={page >= totalPage}
              onClick={() => setPage(Math.min(totalPage, page + 1))}
            >
              Berikutnya
              <span className="material-symbols-outlined text-base">
                chevron_right
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Halaman utama
// ---------------------------------------------------------------------------
export default function LaporanKeuanganWargaPage() {
  const [section, setSection] = useState<Section>("laporan");
  const [openImage, setOpenImage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Laporan Keuangan RT
        </h1>
        <p className="text-sm text-text-secondary">
          Transparansi laporan, pengeluaran, dan pemasukan lain RT.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSection(s.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
              section === s.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-secondary hover:bg-surface-tertiary",
            )}
          >
            <span className="material-symbols-outlined text-base">
              {s.icon}
            </span>
            <span className="text-center leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {section === "laporan" && (
        <StatusFilteredList<Report>
          statusTabs={REPORT_STATUS_TABS}
          itemLabel="laporan"
          emptyIcon="summarize"
          emptyTitle="Belum ada laporan"
          emptyDescription="Laporan pada status ini akan muncul di sini."
          fetchPage={(status, page, limit) =>
            reportsApi.getAll({ status, page, limit })
          }
          renderItem={(r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              {r.report_proof_img ? (
                isPdfUrl(r.report_proof_img) ? (
                  <a
                    href={r.report_proof_img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-32 w-full shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-tertiary text-danger hover:bg-border"
                  >
                    <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                    <span className="mt-2 text-xs font-semibold">Buka Bukti PDF</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenImage(r.report_proof_img)}
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.report_proof_img}
                      alt={`Bukti laporan ${monthName(r.period_month)} ${r.period_year}`}
                      className="h-32 w-full rounded-xl border border-border object-cover"
                    />
                  </button>
                )
              ) : (
                <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-surface-tertiary text-text-muted">
                  <span className="material-symbols-outlined">image_not_supported</span>
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">
                    {monthName(r.period_month)} {r.period_year}
                  </p>
                  <StatusChip status={r.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <p className="text-text-secondary">Saldo Awal</p>
                    <p className="font-medium text-text-primary">
                      {formatRupiah(r.opening_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Pemasukan</p>
                    <p className="font-medium text-secondary-dark">
                      {formatRupiah(r.total_income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Pengeluaran</p>
                    <p className="font-medium text-danger">
                      {formatRupiah(r.total_expense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Saldo Akhir</p>
                    <p className="font-bold text-primary">
                      {formatRupiah(r.closing_balance)}
                    </p>
                  </div>
                </div>
                {r.status === "failed" && r.rejected_reason && (
                  <p className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                    Alasan gagal: {r.rejected_reason}
                  </p>
                )}
              </div>
            </Card>
          )}
        />
      )}

      {section === "pengeluaran" && (
        <StatusFilteredList<Expense>
          statusTabs={APPROVAL_STATUS_TABS}
          itemLabel="pengeluaran"
          emptyIcon="receipt_long"
          emptyTitle="Belum ada pengeluaran"
          emptyDescription="Pengeluaran pada status ini akan muncul di sini."
          fetchPage={(status, page, limit) =>
            expensesApi.getAll({ status, page, limit })
          }
          renderItem={(exp) => {
            const photos = (exp.expenses_image ?? []).slice(0, 3);

            return (
              <Card key={exp.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {exp.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {exp.expenseCode} &middot; {formatDate(exp.expenseDate)}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-xs text-text-muted">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      {formatRupiah(exp.amount)}
                    </span>
                    <StatusChip status={exp.status} />
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {photos.map((img) =>
                      isPdfUrl(img.attachment_url) ? (
                        <a
                          key={img.id}
                          href={img.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-surface-tertiary text-danger"
                        >
                          <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                          <span className="mt-1 text-[10px] font-semibold">Buka PDF</span>
                        </a>
                      ) : (
                        <button
                          key={img.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenImage(img.attachment_url);
                          }}
                          className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.attachment_url}
                            alt="Bukti pengeluaran"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ),
                    )}
                  </div>
                )}

                {exp.status === "rejected" && exp.rejectedReason && (
                  <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                    Alasan: {exp.rejectedReason}
                  </p>
                )}
              </Card>
            );
          }}
        />
      )}

      {section === "pemasukan" && (
        <StatusFilteredList<Income>
          statusTabs={APPROVAL_STATUS_TABS}
          itemLabel="pemasukan"
          emptyIcon="trending_up"
          emptyTitle="Belum ada pemasukan lain"
          emptyDescription="Pemasukan lain pada status ini akan muncul di sini."
          fetchPage={(status, page, limit) =>
            incomeApi.getAll({ status, page, limit })
          }
          renderItem={(inc) => (
            <Card key={inc.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {inc.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {inc.income_code} &middot; {formatDate(inc.income_date)}
                  </p>
                  {inc.description && (
                    <p className="mt-1 text-xs text-text-muted">
                      {inc.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-bold text-secondary-dark">
                    {formatRupiah(inc.amount)}
                  </span>
                  <StatusChip status={inc.status} />
                </div>
              </div>

              {inc.status === "rejected" && inc.rejected_reason && (
                <p className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-xs text-danger">
                  Alasan: {inc.rejected_reason}
                </p>
              )}
            </Card>
          )}
        />
      )}

      {openImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setOpenImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={openImage}
            alt="Bukti diperbesar"
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
