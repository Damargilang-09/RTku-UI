"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billsApi } from "@/src/lib/api/bills";
import { feeTypesApi } from "@/src/lib/api/fee-types";
import { ApiError } from "@/src/lib/api/axios";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { formatRupiah, monthName } from "@/src/lib/utils";
import type { FeeType } from "@/src/types";

export default function GenerateTagihanPage() {
  const router = useRouter();
  const now = new Date();

  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [feeTypeId, setFeeTypeId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(String(now.getMonth() + 1));
  const [periodYear, setPeriodYear] = useState(String(now.getFullYear()));
  const [dueDate, setDueDate] = useState("");
  const [loadingFeeTypes, setLoadingFeeTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feeTypesApi
      .getAll()
      .then((response) => setFeeTypes(response.data))
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Gagal mengambil jenis iuran",
        ),
      )
      .finally(() => setLoadingFeeTypes(false));
  }, []);

  const selectedFeeType = feeTypes.find((item) => item.id === feeTypeId);
  const isMonthly = selectedFeeType?.billingPeriod === "monthly";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedFeeType) {
      setError("Jenis iuran wajib dipilih");
      return;
    }

    if (isMonthly && (!periodMonth || !periodYear)) {
      setError("Bulan dan tahun periode wajib diisi untuk iuran bulanan");
      return;
    }

    if (isMonthly && selectedFeeType.dueDay === null) {
      setError("Tanggal jatuh tempo pada jenis iuran belum ditentukan");
      return;
    }

    if (!isMonthly && !dueDate) {
      setError("Tanggal jatuh tempo wajib diisi untuk iuran sekali bayar");
      return;
    }

    const payload = isMonthly
      ? {
          feeTypeId: selectedFeeType.id,
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
        }
      : {
          feeTypeId: selectedFeeType.id,
          dueDate,
        };

    setSubmitting(true);

    try {
      const response = await billsApi.generateBills(payload);
      router.push(
        `/tagihan-warga?generatedBatch=${encodeURIComponent(response.data.batchId)}`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal membuat tagihan warga",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <Link
          href="/tagihan-warga"
          className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-tertiary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Generate Tagihan Warga
          </h1>
          <p className="text-sm text-text-secondary">
            Buat tagihan secara massal untuk seluruh warga aktif.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5 sm:p-6"
      >
        {error && (
          <div className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
          Jenis Iuran
          <select
            disabled={loadingFeeTypes}
            value={feeTypeId}
            onChange={(event) => {
              setFeeTypeId(event.target.value);
              setDueDate("");
            }}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Pilih jenis iuran</option>
            {feeTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatRupiah(item.amount)}
              </option>
            ))}
          </select>
        </label>

        {selectedFeeType && (
          <div className="rounded-xl bg-info-bg px-4 py-3 text-sm text-info">
            {isMonthly
              ? `Jatuh tempo otomatis setiap tanggal ${selectedFeeType.dueDay ?? "belum ditentukan"}.`
              : "Tanggal jatuh tempo dipilih saat generate tagihan."}
          </div>
        )}

        {isMonthly && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
              Bulan Periode
              <select
                value={periodMonth}
                onChange={(event) => setPeriodMonth(event.target.value)}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <option key={month} value={month}>
                      {monthName(month)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <Input
              label="Tahun Periode"
              type="number"
              min="2000"
              value={periodYear}
              onChange={(event) => setPeriodYear(event.target.value)}
              required
            />
          </div>
        )}

        {selectedFeeType?.billingPeriod === "once" && (
          <Input
            label="Tanggal Jatuh Tempo"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
          />
        )}

        <div className="rounded-xl border border-warning/20 bg-warning-bg px-4 py-3 text-sm text-warning">
          Tagihan akan dibuat untuk seluruh user aktif dengan role Warga,
          Bendahara, dan Ketua RT. Data duplikat pada periode yang sama akan
          dilewati.
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link href="/tagihan-warga">
            <Button type="button" variant="secondary">
              Batal
            </Button>
          </Link>
          <Button type="submit" loading={submitting}>
            <span className="material-symbols-outlined text-base">
              add_card
            </span>
            Generate Tagihan
          </Button>
        </div>
      </form>
    </div>
  );
}
